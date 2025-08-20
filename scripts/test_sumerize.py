#!/usr/bin/env python3
import argparse
import json
import os
import sys
from typing import Optional

import requests


def call_get(base_url: str, user_id: str, use_header: bool, insecure: bool) -> requests.Response:
    url = base_url.rstrip("/") + "/api/ai/sumerize"
    headers = {}
    params = {}
    if use_header:
        headers["X-User-Id"] = user_id
    else:
        params["user_id"] = user_id
    return requests.get(url, headers=headers, params=params, timeout=30, verify=not insecure)


def call_post(base_url: str, user_id: str, use_header: bool, insecure: bool) -> requests.Response:
    url = base_url.rstrip("/") + "/api/ai/sumerize"
    headers = {"Content-Type": "application/json"}
    params = {}
    if use_header:
        headers["X-User-Id"] = user_id
    else:
        params["user_id"] = user_id
    # Body is empty; endpoint only needs the user id
    return requests.post(url, headers=headers, params=params, json={}, timeout=30, verify=not insecure)


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser(description="Test /api/ai/sumerize endpoint")
    parser.add_argument("--base-url", default=os.environ.get("API_BASE_URL", "http://localhost:8001"), help="Base URL of the backend (default: http://localhost:8001 or $API_BASE_URL)")
    parser.add_argument("--user-id", default=os.environ.get("TEST_USER_ID"), help="Firebase UID to summarize (default: $TEST_USER_ID)")
    parser.add_argument("--method", choices=["GET", "POST"], default="POST", help="HTTP method to use (default: POST)")
    parser.add_argument("--use-header", action="store_true", help="Send user id via X-User-Id header instead of query param")
    parser.add_argument("--insecure", action="store_true", help="Disable TLS verification (useful for self-signed certs)")

    args = parser.parse_args(argv)

    if not args.user_id:
        print("Error: --user-id or $TEST_USER_ID is required", file=sys.stderr)
        return 2

    try:
        if args.method == "GET":
            resp = call_get(args.base_url, args.user_id, args.use_header, args.insecure)
        else:
            resp = call_post(args.base_url, args.user_id, args.use_header, args.insecure)
    except requests.RequestException as e:
        print(f"Request error: {e}", file=sys.stderr)
        return 3

    print(f"Status: {resp.status_code}")
    try:
        data = resp.json()
        print(json.dumps(data, ensure_ascii=False, indent=2))
    except ValueError:
        print(resp.text)

    return 0 if resp.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())


