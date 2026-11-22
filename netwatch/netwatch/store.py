"""Thread-safe in-memory store of per-device network activity."""
from __future__ import annotations

import ipaddress
import threading
import time
from collections import deque
from dataclasses import dataclass, field

SERIES_SECONDS = 180  # bandwidth history window shown in the chart
MAX_DOMAINS = 2000
MAX_CONNS = 1500
MAX_EVENTS = 5000


def _now() -> float:
    return time.time()


@dataclass
class DomainStat:
    domain: str
    source: str
    hits: int = 0
    bytes: int = 0
    first: float = field(default_factory=_now)
    last: float = field(default_factory=_now)
    paths: deque = field(default_factory=lambda: deque(maxlen=20))


@dataclass
class ConnStat:
    proto: str
    remote_ip: str
    remote_port: int
    bytes_up: int = 0
    bytes_down: int = 0
    packets: int = 0
    first: float = field(default_factory=_now)
    last: float = field(default_factory=_now)


class Device:
    def __init__(self, ip: str):
        self.ip = ip
        self.mac: str | None = None
        self.hostname: str | None = None
        self.first_seen = _now()
        self.last_seen = self.first_seen
        self.bytes_up = 0
        self.bytes_down = 0
        self.packets = 0
        # ring buffer of [second, up, down]
        self.series: deque = deque(maxlen=SERIES_SECONDS)
        self.domains: dict[str, DomainStat] = {}
        self.conns: dict[tuple, ConnStat] = {}
        self.dns_map: dict[str, str] = {}  # remote ip -> domain
        self.protocols: dict[str, int] = {}

    def _bucket(self, ts: float) -> list:
        sec = int(ts)
        if self.series and self.series[-1][0] == sec:
            return self.series[-1]
        b = [sec, 0, 0]
        self.series.append(b)
        return b


class Store:
    def __init__(self, subnets: list[str]):
        self.lock = threading.RLock()
        self.subnets = [ipaddress.ip_network(s, strict=False) for s in subnets]
        self.devices: dict[str, Device] = {}
        self.events: deque = deque(maxlen=MAX_EVENTS)
        self._event_id = 0
        self.started = _now()
        self.packets_total = 0

    # ---- helpers -------------------------------------------------------
    def is_local(self, ip: str) -> bool:
        try:
            addr = ipaddress.ip_address(ip)
        except ValueError:
            return False
        return any(addr in n for n in self.subnets)

    def _dev(self, ip: str) -> Device:
        d = self.devices.get(ip)
        if d is None:
            d = Device(ip)
            self.devices[ip] = d
            self._event(ip, "device", f"New device detected on network: {ip}")
        return d

    def _event(self, ip: str, kind: str, msg: str) -> None:
        self._event_id += 1
        self.events.append({"id": self._event_id, "ts": _now(), "ip": ip, "kind": kind, "msg": msg})

    # ---- ingestion -----------------------------------------------------
    def add_traffic(self, local_ip: str, direction: str, nbytes: int, remote_ip: str,
                    remote_port: int, proto: str, mac: str | None = None) -> None:
        """direction: 'up' (device -> remote) or 'down' (remote -> device)."""
        with self.lock:
            self.packets_total += 1
            d = self._dev(local_ip)
            ts = _now()
            d.last_seen = ts
            d.packets += 1
            if mac and d.mac != mac:
                d.mac = mac
            b = d._bucket(ts)
            if direction == "up":
                d.bytes_up += nbytes
                b[1] += nbytes
            else:
                d.bytes_down += nbytes
                b[2] += nbytes
            label = _proto_label(proto, remote_port)
            d.protocols[label] = d.protocols.get(label, 0) + nbytes

            key = (proto, remote_ip, remote_port)
            c = d.conns.get(key)
            if c is None:
                if len(d.conns) >= MAX_CONNS:
                    oldest = min(d.conns, key=lambda k: d.conns[k].last)
                    del d.conns[oldest]
                c = ConnStat(proto, remote_ip, remote_port)
                d.conns[key] = c
            c.packets += 1
            c.last = ts
            if direction == "up":
                c.bytes_up += nbytes
            else:
                c.bytes_down += nbytes

            dom = d.dns_map.get(remote_ip)
            if dom and dom in d.domains:
                d.domains[dom].bytes += nbytes

    def add_domain(self, local_ip: str, domain: str, source: str, path: str | None = None,
                   remote_ip: str | None = None) -> None:
        domain = domain.strip(".").lower()
        if not domain or _is_noise(domain):
            return
        with self.lock:
            d = self._dev(local_ip)
            ts = _now()
            d.last_seen = ts
            s = d.domains.get(domain)
            if s is None:
                if len(d.domains) >= MAX_DOMAINS:
                    oldest = min(d.domains, key=lambda k: d.domains[k].last)
                    del d.domains[oldest]
                s = DomainStat(domain, source)
                d.domains[domain] = s
                self._event(local_ip, source, f"{source.upper()} → {domain}")
            elif ts - s.last > 60:
                self._event(local_ip, source, f"{source.upper()} → {domain}")
            s.hits += 1
            s.last = ts
            if source != "dns":
                s.source = source  # SNI/HTTP are stronger evidence than a DNS lookup
            if path:
                s.paths.append(path)
                self._event(local_ip, "http", f"HTTP GET http://{domain}{path}")
            if remote_ip:
                d.dns_map[remote_ip] = domain

    def map_dns(self, local_ip: str, remote_ip: str, domain: str) -> None:
        with self.lock:
            d = self._dev(local_ip)
            d.dns_map[remote_ip] = domain.strip(".").lower()

    def set_hostname(self, ip: str, hostname: str) -> None:
        with self.lock:
            d = self._dev(ip)
            if hostname and d.hostname != hostname:
                d.hostname = hostname
                self._event(ip, "device", f"Hostname identified: {hostname}")

    # ---- queries -------------------------------------------------------
    def _rate(self, d: Device, window: int = 5) -> tuple[float, float]:
        cutoff = int(_now()) - window
        up = sum(b[1] for b in d.series if b[0] > cutoff)
        down = sum(b[2] for b in d.series if b[0] > cutoff)
        return up / window, down / window

    def summary(self, d: Device) -> dict:
        up, down = self._rate(d)
        return {
            "ip": d.ip, "mac": d.mac, "hostname": d.hostname,
            "first_seen": d.first_seen, "last_seen": d.last_seen,
            "bytes_up": d.bytes_up, "bytes_down": d.bytes_down, "packets": d.packets,
            "rate_up": up, "rate_down": down, "domains": len(d.domains),
            "online": _now() - d.last_seen < 120,
        }

    def list_devices(self) -> list[dict]:
        with self.lock:
            out = [self.summary(d) for d in self.devices.values()]
        out.sort(key=lambda x: ipaddress.ip_address(x["ip"]))
        return out

    def device_detail(self, ip: str) -> dict | None:
        with self.lock:
            d = self.devices.get(ip)
            if d is None:
                return None
            now = int(_now())
            series_map = {b[0]: b for b in d.series}
            series = [[s, *(series_map.get(s, [s, 0, 0])[1:])] for s in range(now - 119, now + 1)]
            domains = sorted(d.domains.values(), key=lambda s: s.last, reverse=True)
            conns = sorted(d.conns.values(), key=lambda c: c.bytes_up + c.bytes_down, reverse=True)[:200]
            return {
                **self.summary(d),
                "series": series,
                "protocols": sorted(d.protocols.items(), key=lambda kv: kv[1], reverse=True)[:12],
                "sites": [{
                    "domain": s.domain, "source": s.source, "hits": s.hits, "bytes": s.bytes,
                    "first": s.first, "last": s.last, "paths": list(s.paths)[-5:],
                } for s in domains[:500]],
                "connections": [{
                    "proto": c.proto, "remote_ip": c.remote_ip, "remote_port": c.remote_port,
                    "domain": d.dns_map.get(c.remote_ip), "service": _proto_label(c.proto, c.remote_port),
                    "bytes_up": c.bytes_up, "bytes_down": c.bytes_down, "packets": c.packets,
                    "first": c.first, "last": c.last,
                } for c in conns],
            }

    def events_since(self, since: int, ip: str | None = None, limit: int = 200) -> list[dict]:
        with self.lock:
            evs = [e for e in self.events if e["id"] > since and (ip is None or e["ip"] == ip)]
        return evs[-limit:]

    def status(self) -> dict:
        with self.lock:
            return {
                "uptime": _now() - self.started,
                "devices": len(self.devices),
                "packets": self.packets_total,
                "subnets": [str(n) for n in self.subnets],
            }


_PORTS = {
    20: "FTP-DATA", 21: "FTP", 22: "SSH", 23: "TELNET", 25: "SMTP", 53: "DNS", 67: "DHCP", 68: "DHCP",
    80: "HTTP", 110: "POP3", 123: "NTP", 137: "NETBIOS", 143: "IMAP", 443: "HTTPS", 445: "SMB",
    465: "SMTPS", 587: "SMTP", 853: "DNS-TLS", 993: "IMAPS", 995: "POP3S", 1194: "OPENVPN",
    1723: "PPTP", 3389: "RDP", 3478: "STUN/WEBRTC", 5060: "SIP", 5222: "XMPP", 5228: "GOOGLE-PUSH",
    5353: "MDNS", 8080: "HTTP-ALT", 8443: "HTTPS-ALT", 51820: "WIREGUARD",
}


def _proto_label(proto: str, port: int) -> str:
    name = _PORTS.get(port)
    if proto == "UDP" and port == 443:
        return "QUIC"
    return name or f"{proto}/{port}"


_NOISE_SUFFIXES = (".local", ".arpa", ".lan", ".localdomain", ".internal")


def _is_noise(domain: str) -> bool:
    return "." not in domain or domain.endswith(_NOISE_SUFFIXES)
