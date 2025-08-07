#!/usr/bin/env python3
"""
Test script for Device API endpoints
Tests device authentication, records submission, and command retrieval
"""

import requests
import json
import time
import random
from datetime import datetime
from config import API_BASE_URL, TEST_DEVICES, SAMPLE_SENSOR_DATA, Colors

class DeviceAPITester:
    def __init__(self, base_url=API_BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        
    def print_status(self, message, status="INFO"):
        color = Colors.BLUE
        if status == "SUCCESS":
            color = Colors.GREEN
        elif status == "ERROR":
            color = Colors.RED
        elif status == "WARNING":
            color = Colors.YELLOW
            
        print(f"{color}[{status}]{Colors.END} {message}")
        
    def test_device_authentication(self, device_config):
        """Test device authentication"""
        self.print_status(f"Testing authentication for {device_config['device_id']}")
        
        headers = {
            "X-Device-Id": device_config["device_id"],
            "X-Device-Secret": device_config["device_secret"],
            "Content-Type": "application/json"
        }
        
        # Test with valid credentials
        test_data = SAMPLE_SENSOR_DATA.copy()
        test_data["timestamp"] = int(time.time() * 1000)
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/records/",
                headers=headers,
                json=test_data
            )
            
            if response.status_code == 200:
                self.print_status(f"✅ Authentication successful for {device_config['device_id']}", "SUCCESS")
                return True
            else:
                self.print_status(f"❌ Authentication failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except requests.exceptions.RequestException as e:
            self.print_status(f"❌ Connection error: {str(e)}", "ERROR")
            return False
            
    def test_invalid_authentication(self, device_config):
        """Test with invalid credentials"""
        self.print_status("Testing invalid authentication")
        
        headers = {
            "X-Device-Id": device_config["device_id"],
            "X-Device-Secret": "wrong_secret",
            "Content-Type": "application/json"
        }
        
        test_data = SAMPLE_SENSOR_DATA.copy()
        test_data["timestamp"] = int(time.time() * 1000)
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/records/",
                headers=headers,
                json=test_data
            )
            
            if response.status_code == 401:
                self.print_status("✅ Invalid auth correctly rejected", "SUCCESS")
                return True
            else:
                self.print_status(f"❌ Invalid auth not rejected: {response.status_code}", "ERROR")
                return False
                
        except requests.exceptions.RequestException as e:
            self.print_status(f"❌ Connection error: {str(e)}", "ERROR")
            return False
            
    def test_records_submission(self, device_config, num_records=5):
        """Test submitting multiple sensor records"""
        self.print_status(f"Testing {num_records} records submission")
        
        headers = {
            "X-Device-Id": device_config["device_id"],
            "X-Device-Secret": device_config["device_secret"],
            "Content-Type": "application/json"
        }
        
        successful_submissions = 0
        
        for i in range(num_records):
            # Generate realistic sensor data
            test_data = {
                "heart_rate": random.randint(60, 100),
                "spo2": random.randint(95, 100),
                "temperature": round(random.uniform(36.0, 37.5), 1),
                "timestamp": int(time.time() * 1000),
                "battery_level": random.randint(20, 100),
                "signal_strength": random.randint(-80, -30)
            }
            
            try:
                response = self.session.post(
                    f"{self.base_url}/api/records/",
                    headers=headers,
                    json=test_data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.print_status(f"  Record {i+1}: ✅ Submitted (key: {result.get('key', 'N/A')})")
                    successful_submissions += 1
                else:
                    self.print_status(f"  Record {i+1}: ❌ Failed ({response.status_code})", "ERROR")
                    
            except requests.exceptions.RequestException as e:
                self.print_status(f"  Record {i+1}: ❌ Error - {str(e)}", "ERROR")
                
            time.sleep(0.5)  # Small delay between requests
            
        success_rate = (successful_submissions / num_records) * 100
        if success_rate == 100:
            self.print_status(f"✅ All {num_records} records submitted successfully", "SUCCESS")
        else:
            self.print_status(f"⚠️  {successful_submissions}/{num_records} records successful ({success_rate:.1f}%)", "WARNING")
            
        return success_rate
        
    def test_command_retrieval(self, device_config):
        """Test command retrieval"""
        self.print_status("Testing command retrieval")
        
        headers = {
            "X-Device-Id": device_config["device_id"],
            "X-Device-Secret": device_config["device_secret"]
        }
        
        try:
            response = self.session.get(
                f"{self.base_url}/api/command/{device_config['device_id']}",
                headers=headers
            )
            
            if response.status_code == 200:
                command_data = response.json()
                self.print_status(f"✅ Command retrieved: {json.dumps(command_data, indent=2)}", "SUCCESS")
                return True
            else:
                self.print_status(f"❌ Command retrieval failed: {response.status_code}", "ERROR")
                return False
                
        except requests.exceptions.RequestException as e:
            self.print_status(f"❌ Connection error: {str(e)}", "ERROR")
            return False
            
    def test_command_submission(self, device_config):
        """Test command submission"""
        self.print_status("Testing command submission")
        
        headers = {
            "X-Device-Id": device_config["device_id"],
            "X-Device-Secret": device_config["device_secret"],
            "Content-Type": "application/json"
        }
        
        command_data = {
            "action": "test_calibration",
            "pattern": [1, 0, 1, 0, 1],
            "duration": 3000,
            "timestamp": int(time.time() * 1000)
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/command/",
                headers=headers,
                json=command_data
            )
            
            if response.status_code == 200:
                result = response.json()
                self.print_status(f"✅ Command submitted: {json.dumps(result, indent=2)}", "SUCCESS")
                return True
            else:
                self.print_status(f"❌ Command submission failed: {response.status_code}", "ERROR")
                return False
                
        except requests.exceptions.RequestException as e:
            self.print_status(f"❌ Connection error: {str(e)}", "ERROR")
            return False
            
    def run_comprehensive_test(self, device_key="device_1"):
        """Run comprehensive test suite for a device"""
        device_config = TEST_DEVICES[device_key]
        
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}🧪 COMPREHENSIVE DEVICE API TEST{Colors.END}")
        print(f"{Colors.BOLD}Device: {device_config['name']} ({device_config['device_id']}){Colors.END}")
        print(f"{Colors.BOLD}Target: {self.base_url}{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        tests_passed = 0
        total_tests = 5
        
        # Test 1: Valid Authentication
        if self.test_device_authentication(device_config):
            tests_passed += 1
            
        # Test 2: Invalid Authentication
        if self.test_invalid_authentication(device_config):
            tests_passed += 1
            
        # Test 3: Records Submission
        success_rate = self.test_records_submission(device_config, 3)
        if success_rate >= 100:
            tests_passed += 1
            
        # Test 4: Command Retrieval
        if self.test_command_retrieval(device_config):
            tests_passed += 1
            
        # Test 5: Command Submission
        if self.test_command_submission(device_config):
            tests_passed += 1
            
        # Summary
        print(f"\n{Colors.BOLD}📊 TEST SUMMARY{Colors.END}")
        print(f"Tests Passed: {Colors.GREEN}{tests_passed}/{total_tests}{Colors.END}")
        
        if tests_passed == total_tests:
            print(f"{Colors.GREEN}🎉 ALL TESTS PASSED!{Colors.END}")
        elif tests_passed >= total_tests * 0.8:
            print(f"{Colors.YELLOW}⚠️  MOST TESTS PASSED ({tests_passed}/{total_tests}){Colors.END}")
        else:
            print(f"{Colors.RED}❌ MULTIPLE TESTS FAILED ({tests_passed}/{total_tests}){Colors.END}")
            
        return tests_passed / total_tests

def main():
    """Main function to run tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Device API endpoints")
    parser.add_argument("--url", default=API_BASE_URL, help="API base URL")
    parser.add_argument("--device", default="device_1", choices=TEST_DEVICES.keys(), help="Device to test")
    parser.add_argument("--records", type=int, default=3, help="Number of test records to submit")
    
    args = parser.parse_args()
    
    tester = DeviceAPITester(args.url)
    
    # Test specific device
    success_rate = tester.run_comprehensive_test(args.device)
    
    # Exit with appropriate code
    exit(0 if success_rate == 1.0 else 1)

if __name__ == "__main__":
    main()
