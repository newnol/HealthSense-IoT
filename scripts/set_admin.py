#!/usr/bin/env python3
"""
Script to set admin claims for a user in Firebase Auth.
This is useful for setting up the first admin user.

Usage:
    python scripts/set_admin.py <user_email> [--remove]

Example:
    python scripts/set_admin.py admin@example.com
    python scripts/set_admin.py user@example.com --remove
"""

import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv
from firebase_admin import credentials, initialize_app, auth

# Load environment variables
PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env.local")

def main():
    parser = argparse.ArgumentParser(description='Set or remove admin claims for a Firebase user')
    parser.add_argument('email', help='Email address of the user')
    parser.add_argument('--remove', action='store_true', help='Remove admin claim instead of adding it')
    args = parser.parse_args()

    # Initialize Firebase Admin SDK using env-based service account
    try:
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
        cred = credentials.Certificate(service_account_info)  # type: ignore[arg-type]
        initialize_app(cred)
    except Exception as e:
        print(f"Error initializing Firebase Admin: {e}")
        sys.exit(1)

    try:
        # Get user by email
        user = auth.get_user_by_email(args.email)
        print(f"Found user: {user.uid} ({user.email})")

        # Set or remove admin claim
        if args.remove:
            # Remove admin claim
            auth.set_custom_user_claims(user.uid, {'admin': False})
            print(f"Admin claim removed from user {user.email}")
        else:
            # Add admin claim
            auth.set_custom_user_claims(user.uid, {'admin': True})
            print(f"Admin claim added to user {user.email}")

        # Verify the claims were set
        user = auth.get_user(user.uid)
        current_claims = user.custom_claims or {}
        print(f"Current custom claims: {current_claims}")
        
        if current_claims.get('admin'):
            print(f"✓ User {user.email} is now an admin")
        else:
            print(f"✓ User {user.email} is not an admin")

    except auth.UserNotFoundError:
        print(f"Error: User with email '{args.email}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()