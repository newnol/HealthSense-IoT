#!/usr/bin/env python3
"""Create a test schedule for immediate execution"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
from firebase_admin import credentials, initialize_app, db
from datetime import datetime, timezone
import time

# Load environment
PROJECT_ROOT = Path(__file__).resolve().parent
load_dotenv(PROJECT_ROOT / ".env.local")

# Initialize Firebase
db_url = os.environ.get("FIREBASE_DB_URL")
if db_url:
    db_url = db_url.rstrip("/")

private_key = os.environ.get("FIREBASE_PRIVATE_KEY")
if private_key:
    private_key = private_key.replace("\\n", "\n")

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

cred = credentials.Certificate(service_account_info)
initialize_app(cred, {"databaseURL": db_url})

def main():
    print("Creating test schedule for 30 seconds from now...")
    
    # Get current time
    now = datetime.now(timezone.utc)
    # Schedule for 30 seconds from now
    test_time = datetime(now.year, now.month, now.day, now.hour, now.minute, now.second + 30, tzinfo=timezone.utc)
    
    scheduled_time = {
        "year": test_time.year,
        "month": test_time.month,
        "day": test_time.day,
        "hour": test_time.hour,
        "minute": test_time.minute
    }
    
    # Create schedule record
    schedules_ref = db.reference("/schedules")
    schedule_data = {
        "user_id": "debug_user",
        "device_id": "debug_device",
        "scheduled_time": scheduled_time,
        "created_at": int(time.time() * 1000),
        "status": "pending",
        "notification_time_utc": test_time.isoformat(),
        "test_schedule": True,
        "debug_immediate": True
    }
    
    new_schedule_ref = schedules_ref.push(schedule_data)
    schedule_id = new_schedule_ref.key
    
    print(f"Created schedule: {schedule_id}")
    print(f"Current time (UTC): {now}")
    print(f"Notification time (UTC): {test_time}")
    print(f"Time difference: {(test_time - now).total_seconds()} seconds")
    print(f"Scheduled data: {json.dumps(scheduled_time, indent=2)}")
    print("\nWatch the backend logs to see if this gets processed!")

if __name__ == "__main__":
    main()
