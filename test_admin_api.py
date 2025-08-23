#!/usr/bin/env python3
"""
Test script for Admin API endpoints
This script tests the user deletion functionality
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust if your server runs on different port
ADMIN_TOKEN = "your_admin_token_here"  # Replace with actual admin token

def test_admin_api():
    """Test admin API endpoints"""
    
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }
    
    print("🧪 Testing Admin API...")
    print("=" * 50)
    
    # Test 1: Get all users
    print("\n1. Testing GET /api/admin/users")
    try:
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        if response.status_code == 200:
            users = response.json()
            print(f"✅ Success: Found {len(users.get('users', []))} users")
            
            # Get first user for deletion test
            if users.get('users'):
                test_user = users['users'][0]
                print(f"   Test user: {test_user.get('email')} (UID: {test_user.get('uid')})")
            else:
                print("   ⚠️  No users found for testing")
                return
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Test 2: Test user deletion (commented out for safety)
    print("\n2. Testing DELETE /api/admin/users/{user_id}")
    print("   ⚠️  User deletion test is COMMENTED OUT for safety")
    print("   To test deletion, uncomment the code below and use a test user")
    
    """
    # UNCOMMENT TO TEST USER DELETION (USE WITH CAUTION!)
    test_user_id = test_user['uid']
    print(f"   Testing deletion of user: {test_user['email']}")
    
    try:
        response = requests.delete(f"{BASE_URL}/api/admin/users/{test_user_id}", headers=headers)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: User deleted")
            print(f"   Deleted data: {result.get('deletedData', {})}")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    """
    
    # Test 3: Test invalid user deletion
    print("\n3. Testing DELETE /api/admin/users/invalid_user_id")
    try:
        response = requests.delete(f"{BASE_URL}/api/admin/users/invalid_user_id", headers=headers)
        if response.status_code == 404:
            print("✅ Success: Correctly rejected invalid user ID")
        else:
            print(f"❌ Unexpected response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Admin API testing completed!")
    print("\n📝 Notes:")
    print("- User deletion test is commented out for safety")
    print("- Replace ADMIN_TOKEN with actual admin token")
    print("- Ensure server is running before testing")
    print("- Test with non-production data only")

if __name__ == "__main__":
    if ADMIN_TOKEN == "your_admin_token_here":
        print("❌ Please set ADMIN_TOKEN to a valid admin token")
        print("   Edit this file and replace 'your_admin_token_here'")
        sys.exit(1)
    
    test_admin_api()
