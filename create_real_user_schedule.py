#!/usr/bin/env python3

import firebase_admin
from firebase_admin import credentials, db
import os
from dotenv import load_dotenv
import time
from datetime import datetime, timezone

# Load environment variables
load_dotenv('.env.local')

def main():
    try:
        # Initialize Firebase
        db_url = os.environ.get('FIREBASE_DB_URL')
        private_key = os.environ.get('FIREBASE_PRIVATE_KEY')
        if private_key:
            private_key = private_key.replace('\\n', '\n')

        service_account_info = {
            'type': os.environ.get('FIREBASE_TYPE'),
            'project_id': os.environ.get('FIREBASE_PROJECT_ID'),
            'private_key_id': os.environ.get('FIREBASE_PRIVATE_KEY_ID'),
            'private_key': private_key,
            'client_email': os.environ.get('FIREBASE_CLIENT_EMAIL'),
            'client_id': os.environ.get('FIREBASE_CLIENT_ID'),
            'auth_uri': os.environ.get('FIREBASE_AUTH_URI'),
            'token_uri': os.environ.get('FIREBASE_TOKEN_URI'),
            'auth_provider_x509_cert_url': os.environ.get('FIREBASE_AUTH_PROVIDER_X509_CERT_URL'),
            'client_x509_cert_url': os.environ.get('FIREBASE_CLIENT_X509_CERT_URL'),
        }

        cred = credentials.Certificate(service_account_info)
        firebase_admin.initialize_app(cred, {'databaseURL': db_url})

        # Use real user and device from the database
        user_id = "GZzh6muiEieCUWwqmWB0vTfLNfw2"  # Real user who has device access
        device_id = "esp"  # Real device that user has access to

        # Create schedule for 30 seconds from now
        now = datetime.now(timezone.utc)
        test_time = datetime(now.year, now.month, now.day, now.hour, now.minute, now.second + 30, tzinfo=timezone.utc)

        scheduled_time = {
            "year": test_time.year,
            "month": test_time.month,
            "day": test_time.day,
            "hour": test_time.hour,
            "minute": test_time.minute
        }

        print(f"Creating test schedule for real user/device...")
        print(f"User ID: {user_id}")
        print(f"Device ID: {device_id}")
        print(f"Current time (UTC): {now}")
        print(f"Notification time (UTC): {test_time}")
        print(f"Time difference: {(test_time - now).total_seconds()} seconds")

        # Create schedule record
        schedules_ref = db.reference("/schedules")
        schedule_data = {
            "user_id": user_id,
            "device_id": device_id,
            "scheduled_time": scheduled_time,
            "created_at": int(time.time() * 1000),
            "status": "pending",
            "notification_time_utc": test_time.isoformat(),
            "test_schedule": True
        }

        new_schedule_ref = schedules_ref.push(schedule_data)
        schedule_id = new_schedule_ref.key

        print(f"\nCreated schedule: {schedule_id}")
        print(f"Scheduled data: {scheduled_time}")
        print(f"\nWatch the backend logs to see if this gets processed!")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
