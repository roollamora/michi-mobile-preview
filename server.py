#!/usr/bin/env python3
"""Static site + JSON API for Michi fundraising preview."""

from __future__ import annotations

import json
import os
import secrets
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "data" / "site-data.json"
SESSIONS: dict[str, float] = {}
SESSION_TTL = 60 * 60 * 12  # 12 hours


def load_data() -> dict:
    with DATA_FILE.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_data(data: dict) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with DATA_FILE.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def public_payload(data: dict) -> dict:
    payload = json.loads(json.dumps(data))
    if "settings" in payload and "adminPassword" in payload["settings"]:
        payload["settings"] = {
            key: value for key, value in payload["settings"].items() if key != "adminPassword"
        }
    return payload


def prune_sessions() -> None:
    import time

    now = time.time()
    expired = [token for token, expiry in SESSIONS.items() if expiry <= now]
    for token in expired:
        SESSIONS.pop(token, None)


def is_authorized(handler: SimpleHTTPRequestHandler) -> bool:
    import time

    prune_sessions()
    auth = handler.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return False
    token = auth[7:].strip()
    expiry = SESSIONS.get(token)
    return expiry is not None and expiry > time.time()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8") or "{}")

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/site":
            self.send_json(public_payload(load_data()))
            return
        super().do_GET()

    def do_POST(self) -> None:
        import time

        path = urlparse(self.path).path
        if path == "/api/login":
            body = self.read_json_body()
            data = load_data()
            password = body.get("password", "")
            if password != data.get("settings", {}).get("adminPassword"):
                self.send_json({"ok": False, "error": "Invalid password"}, status=401)
                return
            token = secrets.token_urlsafe(32)
            SESSIONS[token] = time.time() + SESSION_TTL
            self.send_json({"ok": True, "token": token})
            return

        if path == "/api/logout":
            if is_authorized(self):
                auth = self.headers.get("Authorization", "")
                token = auth[7:].strip()
                SESSIONS.pop(token, None)
            self.send_json({"ok": True})
            return

        if not is_authorized(self):
            self.send_json({"ok": False, "error": "Unauthorized"}, status=401)
            return

        if path == "/api/site":
            body = self.read_json_body()
            current = load_data()
            if "donations" in body:
                current["donations"].update(body["donations"])
            if "statusUpdates" in body and isinstance(body["statusUpdates"], list):
                current["statusUpdates"] = body["statusUpdates"]
            if "content" in body and isinstance(body["content"], dict):
                current.setdefault("content", {})
                current["content"].update(body["content"])
            if "settings" in body:
                for key, value in body["settings"].items():
                    if key == "adminPassword" and not str(value).strip():
                        continue
                    current["settings"][key] = value
            if "newsletter" in body:
                current["newsletter"] = body["newsletter"]
            save_data(current)
            self.send_json({"ok": True, "data": public_payload(current)})
            return

        if path == "/api/newsletter":
            body = self.read_json_body()
            current = load_data()
            entry = {
                "id": f"nl-{uuid.uuid4().hex[:8]}",
                "email": str(body.get("email", "")).strip().lower(),
                "name": str(body.get("name", "")).strip(),
                "status": body.get("status", "active"),
                "subscribedAt": body.get("subscribedAt")
                or __import__("datetime").datetime.utcnow().isoformat() + "Z",
            }
            if not entry["email"]:
                self.send_json({"ok": False, "error": "Email required"}, status=400)
                return
            current["newsletter"].append(entry)
            save_data(current)
            self.send_json({"ok": True, "entry": entry})
            return

        self.send_json({"ok": False, "error": "Not found"}, status=404)

    def do_PUT(self) -> None:
        path = urlparse(self.path).path
        if not is_authorized(self):
            self.send_json({"ok": False, "error": "Unauthorized"}, status=401)
            return

        if path.startswith("/api/newsletter/"):
            subscriber_id = path.split("/")[-1]
            body = self.read_json_body()
            current = load_data()
            updated = None
            for entry in current["newsletter"]:
                if entry["id"] == subscriber_id:
                    if "email" in body:
                        entry["email"] = str(body["email"]).strip().lower()
                    if "name" in body:
                        entry["name"] = str(body["name"]).strip()
                    if "status" in body:
                        entry["status"] = body["status"]
                    updated = entry
                    break
            if not updated:
                self.send_json({"ok": False, "error": "Not found"}, status=404)
                return
            save_data(current)
            self.send_json({"ok": True, "entry": updated})
            return

        self.send_json({"ok": False, "error": "Not found"}, status=404)

    def do_DELETE(self) -> None:
        path = urlparse(self.path).path
        if not is_authorized(self):
            self.send_json({"ok": False, "error": "Unauthorized"}, status=401)
            return

        if path.startswith("/api/newsletter/"):
            subscriber_id = path.split("/")[-1]
            current = load_data()
            before = len(current["newsletter"])
            current["newsletter"] = [
                entry for entry in current["newsletter"] if entry["id"] != subscriber_id
            ]
            if len(current["newsletter"]) == before:
                self.send_json({"ok": False, "error": "Not found"}, status=404)
                return
            save_data(current)
            self.send_json({"ok": True})
            return

        self.send_json({"ok": False, "error": "Not found"}, status=404)


def main() -> None:
    port = int(os.environ.get("PORT", "8899"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Serving {ROOT} at http://127.0.0.1:{port}")
    print(f"Admin: http://127.0.0.1:{port}/admin.html")
    server.serve_forever()


if __name__ == "__main__":
    main()
