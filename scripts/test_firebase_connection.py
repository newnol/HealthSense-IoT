#!/usr/bin/env python3
"""
Test script for Firebase connection and database operations
Tests both Realtime Database and Firestore connectivity
"""

import sys
import json
import time
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db, firestore
from config import Colors

class FirebaseConnectionTester:
    def __init__(self):
        self.rtdb = None
        self.firestore_db = None
        self.app = None
        
    def print_status(self, message, status="INFO"):
        color = Colors.BLUE
        if status == "SUCCESS":
            color = Colors.GREEN
        elif status == "ERROR":
            color = Colors.RED
        elif status == "WARNING":
            color = Colors.YELLOW
            
        print(f"{color}[{status}]{Colors.END} {message}")
        
    def initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        self.print_status("Initializing Firebase Admin SDK...")
        
        try:
            # Check if already initialized
            if firebase_admin._apps:
                self.app = firebase_admin.get_app()
                self.print_status("Using existing Firebase app", "SUCCESS")
            else:
                # Initialize new app
                cred = credentials.Certificate("serviceAccountKey.json")
                self.app = firebase_admin.initialize_app(cred, {
                    'databaseURL': 'https://your-project-id-default-rtdb.firebaseio.com/'
                })
                self.print_status("Firebase Admin SDK initialized", "SUCCESS")
            
            # Initialize database clients
            self.rtdb = db
            self.firestore_db = firestore.client()
            
            return True
            
        except Exception as e:
            self.print_status(f"Failed to initialize Firebase: {str(e)}", "ERROR")
            return False
            
    def test_realtime_database(self):
        """Test Realtime Database operations"""
        self.print_status("Testing Realtime Database operations...")
        
        try:
            # Test write operation
            test_ref = self.rtdb.reference('/test')
            test_data = {
                'timestamp': int(time.time() * 1000),
                'message': 'Test from script',
                'value': 42
            }
            
            test_ref.set(test_data)
            self.print_status("✅ Realtime DB write successful", "SUCCESS")
            
            # Test read operation
            read_data = test_ref.get()
            if read_data and read_data.get('message') == 'Test from script':
                self.print_status("✅ Realtime DB read successful", "SUCCESS")
            else:
                self.print_status("❌ Realtime DB read failed", "ERROR")
                return False
                
            # Test device structure
            devices_ref = self.rtdb.reference('/devices')
            test_device = {
                'secret': 'test_secret_123',
                'name': 'Test Device',
                'created_at': int(time.time() * 1000)
            }
            
            devices_ref.child('test_device_001').set(test_device)
            self.print_status("✅ Device structure test successful", "SUCCESS")
            
            # Test records structure
            records_ref = self.rtdb.reference('/records')
            test_record = {
                'device_id': 'test_device_001',
                'heart_rate': 75,
                'spo2': 98,
                'timestamp': int(time.time() * 1000)
            }
            
            new_record_ref = records_ref.push(test_record)
            self.print_status(f"✅ Records structure test successful (key: {new_record_ref.key})", "SUCCESS")
            
            # Cleanup test data
            test_ref.delete()
            devices_ref.child('test_device_001').delete()
            new_record_ref.delete()
            self.print_status("✅ Test data cleaned up", "SUCCESS")
            
            return True
            
        except Exception as e:
            self.print_status(f"❌ Realtime Database test failed: {str(e)}", "ERROR")
            return False
            
    def test_firestore(self):
        """Test Firestore operations"""
        self.print_status("Testing Firestore operations...")
        
        try:
            # Test write operation
            test_collection = self.firestore_db.collection('test')
            test_doc_ref = test_collection.document('test_doc')
            
            test_data = {
                'timestamp': datetime.now(),
                'message': 'Test from script',
                'value': 42,
                'nested': {
                    'field1': 'value1',
                    'field2': 123
                }
            }
            
            test_doc_ref.set(test_data)
            self.print_status("✅ Firestore write successful", "SUCCESS")
            
            # Test read operation
            doc_snapshot = test_doc_ref.get()
            if doc_snapshot.exists and doc_snapshot.to_dict().get('message') == 'Test from script':
                self.print_status("✅ Firestore read successful", "SUCCESS")
            else:
                self.print_status("❌ Firestore read failed", "ERROR")
                return False
                
            # Test users collection structure
            users_collection = self.firestore_db.collection('users')
            test_user_ref = users_collection.document('test_user_001')
            
            test_user = {
                'email': 'test@example.com',
                'profile': {
                    'name': 'Test User',
                    'age': 30
                },
                'role': 'user',
                'created_at': datetime.now()
            }
            
            test_user_ref.set(test_user)
            self.print_status("✅ Users collection test successful", "SUCCESS")
            
            # Test device_users collection
            device_users_collection = self.firestore_db.collection('device_users')
            test_device_user_ref = device_users_collection.document('test_device_001')
            
            test_device_user = {
                'owner_id': 'test_user_001',
                'device_info': {
                    'name': 'Test Device',
                    'location': 'Home'
                },
                'shared_with': [],
                'created_at': datetime.now()
            }
            
            test_device_user_ref.set(test_device_user)
            self.print_status("✅ Device users collection test successful", "SUCCESS")
            
            # Test query operation
            users_query = users_collection.where('role', '==', 'user').limit(10)
            users_results = users_query.get()
            self.print_status(f"✅ Query test successful ({len(users_results)} results)", "SUCCESS")
            
            # Cleanup test data
            test_doc_ref.delete()
            test_user_ref.delete()
            test_device_user_ref.delete()
            self.print_status("✅ Test data cleaned up", "SUCCESS")
            
            return True
            
        except Exception as e:
            self.print_status(f"❌ Firestore test failed: {str(e)}", "ERROR")
            return False
            
    def test_data_flow(self):
        """Test realistic data flow between databases"""
        self.print_status("Testing realistic data flow...")
        
        try:
            # Simulate device registration in Realtime DB
            device_id = f"test_device_{int(time.time())}"
            device_secret = f"secret_{int(time.time())}"
            
            devices_ref = self.rtdb.reference('/devices')
            devices_ref.child(device_id).set({
                'secret': device_secret,
                'status': 'online',
                'last_seen': int(time.time() * 1000)
            })
            
            # Simulate user linking device in Firestore
            user_id = f"test_user_{int(time.time())}"
            
            # Create user profile
            users_ref = self.firestore_db.collection('users')
            users_ref.document(user_id).set({
                'email': f'test{int(time.time())}@example.com',
                'profile': {
                    'name': 'Test User',
                    'age': 25
                },
                'role': 'user',
                'created_at': datetime.now()
            })
            
            # Link device to user
            device_users_ref = self.firestore_db.collection('device_users')
            device_users_ref.document(device_id).set({
                'owner_id': user_id,
                'device_info': {
                    'name': 'My Health Monitor',
                    'location': 'Bedroom'
                },
                'shared_with': [],
                'created_at': datetime.now()
            })
            
            # Simulate sensor data in Realtime DB
            records_ref = self.rtdb.reference('/records')
            for i in range(3):
                test_record = {
                    'device_id': device_id,
                    'heart_rate': 70 + i * 2,
                    'spo2': 97 + i,
                    'timestamp': int(time.time() * 1000) + i * 1000
                }
                records_ref.push(test_record)
                
            self.print_status("✅ Data flow simulation successful", "SUCCESS")
            
            # Cleanup
            devices_ref.child(device_id).delete()
            users_ref.document(user_id).delete()
            device_users_ref.document(device_id).delete()
            
            # Note: Records cleanup would require iterating through records
            # which is more complex, so we'll leave them for now
            
            return True
            
        except Exception as e:
            self.print_status(f"❌ Data flow test failed: {str(e)}", "ERROR")
            return False
            
    def run_all_tests(self):
        """Run comprehensive Firebase tests"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}🔥 FIREBASE CONNECTION TEST{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        tests_passed = 0
        total_tests = 4
        
        # Test 1: Initialize Firebase
        if self.initialize_firebase():
            tests_passed += 1
        else:
            self.print_status("❌ Firebase initialization failed - stopping tests", "ERROR")
            return 0
            
        # Test 2: Realtime Database
        if self.test_realtime_database():
            tests_passed += 1
            
        # Test 3: Firestore
        if self.test_firestore():
            tests_passed += 1
            
        # Test 4: Data Flow
        if self.test_data_flow():
            tests_passed += 1
            
        # Summary
        print(f"\n{Colors.BOLD}📊 TEST SUMMARY{Colors.END}")
        print(f"Tests Passed: {Colors.GREEN}{tests_passed}/{total_tests}{Colors.END}")
        
        if tests_passed == total_tests:
            print(f"{Colors.GREEN}🎉 ALL FIREBASE TESTS PASSED!{Colors.END}")
        elif tests_passed >= total_tests * 0.75:
            print(f"{Colors.YELLOW}⚠️  MOST TESTS PASSED ({tests_passed}/{total_tests}){Colors.END}")
        else:
            print(f"{Colors.RED}❌ MULTIPLE TESTS FAILED ({tests_passed}/{total_tests}){Colors.END}")
            
        return tests_passed / total_tests

def main():
    """Main function"""
    tester = FirebaseConnectionTester()
    success_rate = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if success_rate >= 0.75 else 1)

if __name__ == "__main__":
    main()
