"""NETWATCH web server: JSON API + static dashboard, protected by an operator login."""
from __future__ import annotations

import argparse
import hmac
import json
import mimetypes
import os
import secrets
import sys
import threading
import time
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .store import Store

STATIC = Path(__file__).parent / "static"
SESSION_TTL = 8 * 3600
MAX_FAILS = 5
LOCKOUT = 300


class Auth:
    def __init__(self, user: str, password: str):
        self.user, self.password = user, password
        self.sessions: dict[str, float] = {}
        self.fails: dict[str, list] = {}
        self.lock = threading.Lock()

    def locked(self, client: str) -> int:
        with self.lock:
            count, until = self.fails.get(client, [0, 0])
            return max(0, int(until - time.time())) if count >= MAX_FAILS else 0

    def login(self, client: str, user: str, password: str) -> str | None:
        ok = hmac.compare_digest(user.encode(), self.user.encode()) & \
            hmac.compare_digest(password.encode(), self.password.encode())
        with self.lock:
            if not ok:
                rec = self.fails.setdefault(client, [0, 0])
                if rec[0] >= MAX_FAILS and rec[1] < time.time():
                    rec[0] = 0
                rec[0] += 1
                if rec[0] >= MAX_FAILS:
                    rec[1] = time.time() + LOCKOUT
                return None
            self.fails.pop(client, None)
            token = secrets.token_urlsafe(32)
            self.sessions[token] = time.time() + SESSION_TTL
            return token

    def valid(self, token: str | None) -> bool:
        if not token:
            return False
        with self.lock:
            exp = self.sessions.get(token)
            if exp is None or exp < time.time():
                self.sessions.pop(token, None)
                return False
            return True

    def logout(self, token: str | None) -> None:
        with self.lock:
            self.sessions.pop(token or "", None)


def make_handler(store: Store, auth: Auth, meta: dict):
    class Handler(BaseHTTPRequestHandler):
        server_version = "NETWATCH"

        def log_message(self, fmt, *args):  # quiet
            pass

        # ---- utils ------------------------------------------------------
        def _token(self) -> str | None:
            c = SimpleCookie(self.headers.get("Cookie", ""))
            return c["nw_session"].value if "nw_session" in c else None

        def _json(self, code: int, obj, headers: dict | None = None) -> None:
            body = json.dumps(obj).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            for k, v in (headers or {}).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(body)

        def _body(self) -> dict:
            n = int(self.headers.get("Content-Length") or 0)
            if n > 10_000:
                return {}
            try:
                return json.loads(self.rfile.read(n) or b"{}")
            except json.JSONDecodeError:
                return {}

        # ---- routes -----------------------------------------------------
        def do_GET(self):
            url = urlparse(self.path)
            q = {k: v[0] for k, v in parse_qs(url.query).items()}
            if url.path.startswith("/api/"):
                if url.path == "/api/session":
                    return self._json(200, {"authenticated": auth.valid(self._token()), **meta})
                if not auth.valid(self._token()):
                    return self._json(401, {"error": "unauthorized"})
                if url.path == "/api/status":
                    return self._json(200, {**store.status(), **meta})
                if url.path == "/api/devices":
                    return self._json(200, store.list_devices())
                if url.path == "/api/device":
                    d = store.device_detail(q.get("ip", ""))
                    return self._json(200, d) if d else self._json(404, {"error": "target not observed"})
                if url.path == "/api/events":
                    since = int(q.get("since", "0") or 0)
                    return self._json(200, store.events_since(since, q.get("ip") or None))
                return self._json(404, {"error": "not found"})
            self._static(url.path)

        def do_POST(self):
            url = urlparse(self.path)
            client = self.client_address[0]
            if url.path == "/api/login":
                wait = auth.locked(client)
                if wait:
                    return self._json(429, {"error": f"Terminal locked. Retry in {wait}s."})
                b = self._body()
                token = auth.login(client, str(b.get("username", "")), str(b.get("password", "")))
                if not token:
                    return self._json(401, {"error": "ACCESS DENIED — invalid credentials"})
                cookie = f"nw_session={token}; HttpOnly; SameSite=Strict; Path=/"
                return self._json(200, {"ok": True}, {"Set-Cookie": cookie})
            if url.path == "/api/logout":
                auth.logout(self._token())
                return self._json(200, {"ok": True},
                                  {"Set-Cookie": "nw_session=; Max-Age=0; Path=/"})
            self._json(404, {"error": "not found"})

        def _static(self, path: str) -> None:
            rel = "index.html" if path in ("", "/") else path.lstrip("/")
            f = (STATIC / rel).resolve()
            if STATIC.resolve() not in f.parents or not f.is_file():
                self.send_error(404)
                return
            data = f.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(f.name)[0] or "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("X-Frame-Options", "DENY")
            self.end_headers()
            self.wfile.write(data)

    return Handler


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(prog="netwatch", description="Office network monitoring terminal")
    p.add_argument("--subnet", action="append",
                   help="Office LAN range (CIDR), repeatable. Default 192.168.1.0/24")
    p.add_argument("--iface", help="Network interface to capture on (e.g. eth0). Default: scapy default")
    p.add_argument("--host", default="127.0.0.1", help="Dashboard bind address (default 127.0.0.1)")
    p.add_argument("--port", type=int, default=8787)
    p.add_argument("--demo", action="store_true", help="Simulated traffic, no capture needed")
    a = p.parse_args(argv)

    subnets = a.subnet or ["192.168.1.0/24"]
    store = Store(subnets)

    user = os.environ.get("NETWATCH_USER", "admin")
    password = os.environ.get("NETWATCH_PASS")
    if not password:
        password = secrets.token_urlsafe(9)
        print(f"[!] NETWATCH_PASS not set. Generated one-time passphrase for '{user}': {password}")

    if a.demo:
        from .demo import Demo
        Demo(store).start()
        mode = "DEMO / SIMULATION"
    else:
        from .capture import Capture
        try:
            Capture(store, a.iface).start()
        except (PermissionError, OSError, ImportError) as e:
            sys.exit(f"[x] Cannot start capture: {e}\n    Run with sudo/Administrator (and Npcap on "
                     f"Windows), or try --demo.")
        mode = "LIVE CAPTURE"

    meta = {"mode": mode, "iface": a.iface or "default"}
    srv = ThreadingHTTPServer((a.host, a.port), make_handler(store, Auth(user, password), meta))
    print(f"[+] NETWATCH {mode} on subnets {', '.join(subnets)}")
    print(f"[+] Dashboard: http://{a.host}:{a.port}")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n[+] Shutting down")


if __name__ == "__main__":
    main()
