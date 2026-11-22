"""Live packet capture (scapy) feeding the Store.

What can be seen from passive capture:
  * bytes up/down per device, remote IPs and ports
  * DNS queries (which domain a device looked up) + the IPs they resolved to
  * TLS SNI (the hostname of every HTTPS connection, even though content is encrypted)
  * plain HTTP Host + path (full URL, only for unencrypted http://)
  * DHCP hostnames and MAC addresses
HTTPS page content and full HTTPS URLs are encrypted and are NOT visible.
"""
from __future__ import annotations

import socket
import struct
import threading
from concurrent.futures import ThreadPoolExecutor

from .store import Store

HTTP_METHODS = (b"GET ", b"POST ", b"PUT ", b"HEAD ", b"DELETE ", b"PATCH ", b"OPTIONS ")


def parse_sni(payload: bytes) -> str | None:
    """Extract server_name from a TLS ClientHello record, or None."""
    try:
        if len(payload) < 43 or payload[0] != 0x16 or payload[5] != 0x01:
            return None
        pos = 9 + 2 + 32  # record hdr(5) + handshake hdr(4) + version(2) + random(32)
        sid_len = payload[pos]
        pos += 1 + sid_len
        cs_len = struct.unpack("!H", payload[pos:pos + 2])[0]
        pos += 2 + cs_len
        comp_len = payload[pos]
        pos += 1 + comp_len
        ext_total = struct.unpack("!H", payload[pos:pos + 2])[0]
        pos += 2
        end = min(len(payload), pos + ext_total)
        while pos + 4 <= end:
            etype, elen = struct.unpack("!HH", payload[pos:pos + 4])
            pos += 4
            if etype == 0x0000:  # server_name
                # list len(2) type(1) name len(2) name
                name_len = struct.unpack("!H", payload[pos + 3:pos + 5])[0]
                return payload[pos + 5:pos + 5 + name_len].decode("ascii", "ignore") or None
            pos += elen
    except (IndexError, struct.error, UnicodeError):
        return None
    return None


def parse_http(payload: bytes) -> tuple[str, str] | None:
    """Return (host, path) for a plain HTTP request, or None."""
    if not payload.startswith(HTTP_METHODS):
        return None
    try:
        head = payload.split(b"\r\n\r\n", 1)[0].decode("latin-1")
        lines = head.split("\r\n")
        path = lines[0].split(" ")[1]
        host = next((l.split(":", 1)[1].strip() for l in lines[1:] if l.lower().startswith("host:")), None)
        if not host:
            return None
        return host.split(":")[0], path[:300]
    except (IndexError, UnicodeError):
        return None


class Capture:
    def __init__(self, store: Store, iface: str | None = None, bpf: str = "ip"):
        self.store = store
        self.iface = iface
        self.bpf = bpf
        self.sniffer = None
        self._resolver = ThreadPoolExecutor(max_workers=4)
        self._resolved: set[str] = set()
        self._lock = threading.Lock()

    def start(self) -> None:
        from scapy.all import AsyncSniffer, conf  # imported lazily: needs root/capture rights

        conf.verb = 0
        self.sniffer = AsyncSniffer(iface=self.iface, filter=self.bpf, prn=self._handle, store=False)
        self.sniffer.start()

    def stop(self) -> None:
        if self.sniffer:
            self.sniffer.stop()

    # -------------------------------------------------------------------
    def _reverse_dns(self, ip: str) -> None:
        with self._lock:
            if ip in self._resolved:
                return
            self._resolved.add(ip)

        def job():
            try:
                name = socket.gethostbyaddr(ip)[0]
                self.store.set_hostname(ip, name)
            except OSError:
                pass

        self._resolver.submit(job)

    def _handle(self, pkt) -> None:
        from scapy.layers.dhcp import DHCP
        from scapy.layers.dns import DNS, DNSRR
        from scapy.layers.inet import IP, TCP, UDP
        from scapy.layers.l2 import Ether

        if IP not in pkt:
            return
        ip = pkt[IP]
        src, dst, length = ip.src, ip.dst, int(ip.len or len(ip))
        src_local, dst_local = self.store.is_local(src), self.store.is_local(dst)
        if not (src_local or dst_local):
            return

        proto, sport, dport, payload = "IP", 0, 0, b""
        if TCP in pkt:
            proto, sport, dport = "TCP", pkt[TCP].sport, pkt[TCP].dport
            payload = bytes(pkt[TCP].payload)
        elif UDP in pkt:
            proto, sport, dport = "UDP", pkt[UDP].sport, pkt[UDP].dport
            payload = bytes(pkt[UDP].payload)

        smac = pkt[Ether].src if Ether in pkt else None
        dmac = pkt[Ether].dst if Ether in pkt else None

        if src_local:
            # When capturing on the gateway, src MAC of outbound packets is the device itself.
            self.store.add_traffic(src, "up", length, dst, dport, proto, smac)
            self._reverse_dns(src)
        if dst_local:
            self.store.add_traffic(dst, "down", length, src, sport, proto, dmac)
            self._reverse_dns(dst)

        # ---- DNS -------------------------------------------------------
        if DNS in pkt and (sport == 53 or dport == 53):
            dns = pkt[DNS]
            try:
                if dns.qr == 0 and src_local and dns.qd is not None:
                    q = dns.qd.qname.decode(errors="ignore")
                    self.store.add_domain(src, q, "dns")
                elif dns.qr == 1 and dst_local and dns.an is not None:
                    qname = dns.qd.qname.decode(errors="ignore") if dns.qd is not None else None
                    for i in range(dns.ancount or 0):
                        rr = dns.an[i] if not isinstance(dns.an, list) else dns.an[i]
                        if isinstance(rr, DNSRR) and rr.type in (1, 28) and qname:
                            self.store.map_dns(dst, str(rr.rdata), qname)
            except (AttributeError, IndexError, TypeError):
                pass
            return

        # ---- DHCP hostname ---------------------------------------------
        if DHCP in pkt:
            for opt in pkt[DHCP].options:
                if isinstance(opt, tuple) and opt[0] == "hostname":
                    name = opt[1].decode(errors="ignore") if isinstance(opt[1], bytes) else str(opt[1])
                    req_ip = next((o[1] for o in pkt[DHCP].options
                                   if isinstance(o, tuple) and o[0] == "requested_addr"), None)
                    if req_ip and self.store.is_local(req_ip):
                        self.store.set_hostname(req_ip, name)
            return

        if not payload or not src_local:
            return
        # ---- TLS SNI ---------------------------------------------------
        if proto == "TCP" and payload[:1] == b"\x16":
            sni = parse_sni(payload)
            if sni:
                self.store.add_domain(src, sni, "sni", remote_ip=dst)
                return
        # ---- plain HTTP --------------------------------------------------
        if proto == "TCP":
            http = parse_http(payload)
            if http:
                self.store.add_domain(src, http[0], "http", path=http[1], remote_ip=dst)
