#!/usr/bin/env python3
"""
Provision a device entry in Firebase RTDB.

- Creates/updates /devices/{device_id} with secret and optional user_id
- Requires FIREBASE_* env vars and FIREBASE_DB_URL (loaded from .env.local)

Examples:
  python scripts/provision_device.py --id esp-test --secret s123 --user uid_abc
  python scripts/provision_device.py --id esp-test --secret s123 --force
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv


def load_environment() -> None:
    project_root = Path(__file__).resolve().parents[1]
    load_dotenv(project_root / ".env.local")

    missing: list[str] = []
    if not os.getenv("FIREBASE_DB_URL"):
        missing.append("FIREBASE_DB_URL")
    required_keys = [
        "FIREBASE_TYPE",
        "FIREBASE_PROJECT_ID",
        "FIREBASE_PRIVATE_KEY_ID",
        "FIREBASE_PRIVATE_KEY",
        "FIREBASE_CLIENT_EMAIL",
        "FIREBASE_CLIENT_ID",
        "FIREBASE_AUTH_URI",
        "FIREBASE_TOKEN_URI",
        "FIREBASE_AUTH_PROVIDER_X509_CERT_URL",
        "FIREBASE_CLIENT_X509_CERT_URL",
    ]
    for key in required_keys:
        if not os.getenv(key):
            missing.append(key)
    if missing:
        print("❌ Missing required env vars:")
        for var in missing:
            print(f"   - {var}")
        print("Please set them in .env.local or export them in your environment.")
        sys.exit(1)


def ensure_firebase_initialized() -> None:
    from firebase_admin import credentials, initialize_app  # lazy import

    db_url = os.environ["FIREBASE_DB_URL"].rstrip("/")
    private_key = (os.environ.get("FIREBASE_PRIVATE_KEY") or "").replace("\\n", "\n")
    service_account_info = {
        "type": os.environ.get("FIREBASE_TYPE"),
        "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
        "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": private_key,
        "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.environ.get("FIREBASE_CLIENT_ID"),
        "auth_uri": os.environ.get("FIREBASE_AUTH_URI"),
        "token_uri": os.environ.get("FIREBASE_TOKEN_URI"),
        "auth_provider_x509_cert_url": os.environ.get("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
        "client_x509_cert_url": os.environ.get("FIREBASE_CLIENT_X509_CERT_URL"),
    }
    try:
        initialize_app(credentials.Certificate(service_account_info), {"databaseURL": db_url})
    except ValueError:
        pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Provision a device in Firebase RTDB")
    parser.add_argument("--id", dest="device_id", required=True, help="Device ID")
    parser.add_argument("--secret", dest="device_secret", required=True, help="Device secret")
    parser.add_argument("--user", dest="user_uid", default=None, help="Optional user UID to bind")
    parser.add_argument("--force", action="store_true", help="Overwrite existing device data")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    load_environment()
    ensure_firebase_initialized()

    from firebase_admin import db  # lazy import to use initialized app

    ref = db.reference(f"/devices/{args.device_id}")
    existing = ref.get()

    if existing and not args.force:
        print(f"⚠️  Device '{args.device_id}' already exists: {existing}")
        print("Use --force to overwrite, or omit --user to avoid changing owner.")
        sys.exit(1)

    payload = {
        "secret": args.device_secret,
        "registered_at": existing.get("registered_at") if isinstance(existing, dict) else None,
    }
    
    # For backward compatibility, still support single user_id
    # But recommend using multi-user structure for new devices
    if args.user_uid:
        payload["user_id"] = args.user_uid
        
        # Also add to multi-user structure for consistency
        device_user_ref = db.reference(f"/device_users/{args.device_id}/{args.user_uid}")
        device_user_ref.set({
            "registered_at": existing.get("registered_at") if isinstance(existing, dict) else int(time.time() * 1000)
        })
        
    if not payload.get("registered_at"):
        payload["registered_at"] = int(time.time() * 1000)

    ref.set(payload)
    print("✅ Provisioned device:", args.device_id, payload)


if __name__ == "__main__":
    main()


