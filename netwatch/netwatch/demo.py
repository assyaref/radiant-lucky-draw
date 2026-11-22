"""Synthetic traffic so the dashboard can be tried without capture privileges."""
from __future__ import annotations

import random
import threading
import time

from .store import Store

PROFILES = {
    "work": ["mail.google.com", "docs.google.com", "drive.google.com", "teams.microsoft.com",
             "outlook.office365.com", "slack.com", "github.com", "zoom.us", "web.whatsapp.com",
             "accounts.google.com", "sharepoint.com", "notion.so", "trello.com", "jira.atlassian.com"],
    "leisure": ["www.youtube.com", "rr3---sn-npoe7n7s.googlevideo.com", "www.instagram.com",
                "www.tiktok.com", "www.netflix.com", "shopee.co.id", "www.tokopedia.com",
                "twitter.com", "www.facebook.com", "open.spotify.com", "detik.com", "kompas.com"],
    "background": ["clients4.google.com", "update.microsoft.com", "time.windows.com",
                   "connectivitycheck.gstatic.com", "api.apple-cloudkit.com", "edge.microsoft.com"],
}
HTTP_SITES = [("neverssl.com", "/"), ("example.com", "/index.html"), ("info.cern.ch", "/hypertext/WWW/TheProject.html")]

DEVICES = [
    ("192.168.1.10", "FINANCE-PC01", "3c:52:82:1a:4b:10", 0.8),
    ("192.168.1.11", "HR-LAPTOP", "f4:8e:38:aa:21:11", 0.5),
    ("192.168.1.12", "MARKETING-MBP", "a4:83:e7:5c:99:12", 0.4),
    ("192.168.1.20", "RECEPTION-PC", "00:1e:68:77:02:20", 0.25),
    ("192.168.1.35", "Galaxy-S24", "8c:79:f5:3e:10:35", 0.15),
    ("192.168.1.36", "iPhone-Budi", "dc:a9:04:6a:c1:36", 0.2),
    ("192.168.1.50", "DEV-WORKSTATION", "b4:2e:99:0f:ab:50", 0.85),
    ("192.168.1.60", "MEETING-ROOM-TV", "70:2c:1f:9d:44:60", 0.05),
]


def _rand_ip() -> str:
    return f"{random.choice([142, 157, 104, 172, 13, 31, 52, 151])}.{random.randint(1, 254)}." \
           f"{random.randint(1, 254)}.{random.randint(1, 254)}"


class Demo:
    def __init__(self, store: Store):
        self.store = store
        self._stop = threading.Event()
        self.ipmap: dict[str, str] = {}

    def start(self) -> None:
        for ip, host, mac, _ in DEVICES:
            self.store.add_traffic(ip, "up", 64, "192.168.1.1", 53, "UDP", mac)
            self.store.set_hostname(ip, host)
        threading.Thread(target=self._loop, daemon=True).start()

    def stop(self) -> None:
        self._stop.set()

    def _resolve(self, dom: str) -> str:
        if dom not in self.ipmap:
            self.ipmap[dom] = _rand_ip()
        return self.ipmap[dom]

    def _loop(self) -> None:
        while not self._stop.is_set():
            for ip, _, mac, work_ratio in DEVICES:
                if random.random() < 0.25:
                    continue
                r = random.random()
                pool = "work" if r < work_ratio else ("leisure" if r < 0.92 else "background")
                dom = random.choice(PROFILES[pool])
                rip = self._resolve(dom)
                if random.random() < 0.3:
                    self.store.add_domain(ip, dom, "dns")
                    self.store.map_dns(ip, rip, dom)
                if random.random() < 0.4:
                    self.store.add_domain(ip, dom, "sni", remote_ip=rip)
                if random.random() < 0.02:
                    host, path = random.choice(HTTP_SITES)
                    self.store.add_domain(ip, host, "http", path=path, remote_ip=self._resolve(host))
                heavy = "video" in dom or "netflix" in dom or "tiktok" in dom or "youtube" in dom
                scale = 8 if heavy else 1
                for _ in range(random.randint(3, 12)):
                    self.store.add_traffic(ip, "down", random.randint(600, 1500) * scale * 10, rip,
                                           443, random.choice(["TCP", "TCP", "UDP"]), mac)
                    self.store.add_traffic(ip, "up", random.randint(60, 400) * 5, rip, 443, "TCP", mac)
            time.sleep(1)
