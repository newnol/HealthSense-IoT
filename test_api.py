#!/usr/bin/env python3
"""Test script to verify the new device creation API"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from api.main import app
    print("✅ FastAPI app imported successfully")

    # Check if our new route exists
    admin_routes = [route for route in app.routes if route.path.startswith('/api/admin/devices')]

    print("\nAdmin device routes:")
    for route in admin_routes:
        print(f"  {route.path} - {route.methods}")

    # Check if POST method exists for creating devices
    post_route = [route for route in admin_routes if 'POST' in route.methods and route.path == '/api/admin/devices']

    if post_route:
        print("✅ POST /api/admin/devices endpoint found")
    else:
        print("❌ POST /api/admin/devices endpoint not found")

except Exception as e:
    print(f"❌ Error importing FastAPI app: {e}")
    sys.exit(1)
