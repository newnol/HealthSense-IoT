#!/usr/bin/env python3
"""
Master test runner - executes all test scripts in sequence
Provides comprehensive testing of the entire backend system
"""

import subprocess
import sys
import time
import os
from datetime import datetime
from config import Colors, API_BASE_URL

class MasterTestRunner:
    def __init__(self):
        self.test_results = {}
        self.start_time = None
        
    def print_status(self, message, status="INFO"):
        color = Colors.BLUE
        if status == "SUCCESS":
            color = Colors.GREEN
        elif status == "ERROR":
            color = Colors.RED
        elif status == "WARNING":
            color = Colors.YELLOW
            
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"{color}[{timestamp}] {message}{Colors.END}")
        
    def print_header(self, title):
        print(f"\n{Colors.BOLD}{'='*80}{Colors.END}")
        print(f"{Colors.BOLD}{title.center(80)}{Colors.END}")
        print(f"{Colors.BOLD}{'='*80}{Colors.END}\n")
        
    def run_test_script(self, script_name, description, timeout=300):
        """Run a test script and capture results"""
        self.print_status(f"🧪 Starting: {description}")
        
        script_path = os.path.join(os.path.dirname(__file__), script_name)
        
        if not os.path.exists(script_path):
            self.print_status(f"❌ Script not found: {script_path}", "ERROR")
            return False
            
        try:
            start_time = time.time()
            
            # Run the script
            result = subprocess.run(
                [sys.executable, script_path],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=os.path.dirname(__file__)
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            # Store results
            self.test_results[script_name] = {
                "description": description,
                "duration": duration,
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0
            }
            
            if result.returncode == 0:
                self.print_status(f"✅ Completed: {description} ({duration:.1f}s)", "SUCCESS")
                return True
            else:
                self.print_status(f"❌ Failed: {description} (exit code: {result.returncode})", "ERROR")
                if result.stderr:
                    print(f"{Colors.RED}STDERR:{Colors.END}")
                    print(result.stderr)
                return False
                
        except subprocess.TimeoutExpired:
            self.print_status(f"⏰ Timeout: {description} (>{timeout}s)", "ERROR")
            self.test_results[script_name] = {
                "description": description,
                "duration": timeout,
                "return_code": -1,
                "stdout": "",
                "stderr": "Test timed out",
                "success": False
            }
            return False
            
        except Exception as e:
            self.print_status(f"💥 Exception: {description} - {str(e)}", "ERROR")
            self.test_results[script_name] = {
                "description": description,
                "duration": 0,
                "return_code": -2,
                "stdout": "",
                "stderr": str(e),
                "success": False
            }
            return False
            
    def run_comprehensive_test_suite(self):
        """Run all test scripts in logical order"""
        self.start_time = time.time()
        
        self.print_header("🧪 COMPREHENSIVE BACKEND TEST SUITE")
        self.print_status(f"Target API: {API_BASE_URL}")
        self.print_status(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test sequence in logical order
        test_sequence = [
            {
                "script": "test_firebase_connection.py",
                "description": "Firebase Connection & Database Operations",
                "timeout": 120,
                "critical": True
            },
            {
                "script": "test_device_api.py",
                "description": "Device API Endpoints (Authentication & Records)",
                "timeout": 180,
                "critical": True
            },
            {
                "script": "test_load_performance.py",
                "description": "Load Testing & Performance Analysis",
                "timeout": 300,
                "critical": False
            },
            {
                "script": "test_esp32_simulator.py",
                "description": "ESP32 Device Simulation",
                "timeout": 240,
                "critical": False
            }
        ]
        
        successful_tests = 0
        critical_failures = 0
        
        for i, test_config in enumerate(test_sequence, 1):
            self.print_status(f"📋 Test {i}/{len(test_sequence)}: {test_config['description']}")
            
            success = self.run_test_script(
                test_config["script"],
                test_config["description"],
                test_config["timeout"]
            )
            
            if success:
                successful_tests += 1
            elif test_config.get("critical", False):
                critical_failures += 1
                self.print_status(f"🚨 Critical test failed: {test_config['description']}", "ERROR")
                
            # Brief pause between tests
            if i < len(test_sequence):
                time.sleep(2)
                
        # Generate comprehensive report
        self.generate_test_report(successful_tests, len(test_sequence), critical_failures)
        
        return successful_tests, len(test_sequence), critical_failures
        
    def generate_test_report(self, successful_tests, total_tests, critical_failures):
        """Generate detailed test report"""
        total_duration = time.time() - self.start_time
        
        self.print_header("📊 COMPREHENSIVE TEST REPORT")
        
        # Overall summary
        success_rate = (successful_tests / total_tests) * 100
        
        if success_rate == 100:
            status_color = Colors.GREEN
            status_icon = "🎉"
            status_text = "ALL TESTS PASSED"
        elif success_rate >= 75 and critical_failures == 0:
            status_color = Colors.YELLOW
            status_icon = "⚠️"
            status_text = "MOSTLY SUCCESSFUL"
        else:
            status_color = Colors.RED
            status_icon = "❌"
            status_text = "MULTIPLE FAILURES"
            
        print(f"{status_color}{status_icon} {status_text}{Colors.END}")
        print(f"Success Rate: {status_color}{success_rate:.1f}% ({successful_tests}/{total_tests}){Colors.END}")
        print(f"Critical Failures: {Colors.RED if critical_failures > 0 else Colors.GREEN}{critical_failures}{Colors.END}")
        print(f"Total Duration: {total_duration:.1f} seconds")
        print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Detailed results
        print(f"\n{Colors.BOLD}📋 DETAILED RESULTS:{Colors.END}")
        
        for script_name, result in self.test_results.items():
            status_icon = "✅" if result["success"] else "❌"
            status_color = Colors.GREEN if result["success"] else Colors.RED
            
            print(f"\n{status_icon} {Colors.BOLD}{result['description']}{Colors.END}")
            print(f"   Script: {script_name}")
            print(f"   Duration: {result['duration']:.1f}s")
            print(f"   Exit Code: {status_color}{result['return_code']}{Colors.END}")
            
            if not result["success"] and result["stderr"]:
                print(f"   {Colors.RED}Error: {result['stderr'][:200]}...{Colors.END}")
                
        # Recommendations
        self.print_recommendations(successful_tests, total_tests, critical_failures)
        
    def print_recommendations(self, successful_tests, total_tests, critical_failures):
        """Print recommendations based on test results"""
        print(f"\n{Colors.BOLD}💡 RECOMMENDATIONS:{Colors.END}")
        
        if successful_tests == total_tests:
            print(f"{Colors.GREEN}🎯 Excellent! Your backend is ready for production.{Colors.END}")
            print(f"{Colors.GREEN}   - All systems are functioning correctly{Colors.END}")
            print(f"{Colors.GREEN}   - Performance appears to be good{Colors.END}")
            print(f"{Colors.GREEN}   - Consider deploying to staging environment{Colors.END}")
            
        elif critical_failures == 0:
            print(f"{Colors.YELLOW}⚡ Good progress! Address non-critical issues:{Colors.END}")
            print(f"{Colors.YELLOW}   - Core functionality is working{Colors.END}")
            print(f"{Colors.YELLOW}   - Performance or simulation tests may need attention{Colors.END}")
            print(f"{Colors.YELLOW}   - Review failed test outputs for improvements{Colors.END}")
            
        else:
            print(f"{Colors.RED}🔧 Critical issues need immediate attention:{Colors.END}")
            print(f"{Colors.RED}   - Fix Firebase connection issues first{Colors.END}")
            print(f"{Colors.RED}   - Verify API endpoints are working{Colors.END}")
            print(f"{Colors.RED}   - Check environment variables and credentials{Colors.END}")
            print(f"{Colors.RED}   - Review error messages above{Colors.END}")
            
        # Specific recommendations based on failed tests
        failed_tests = [name for name, result in self.test_results.items() if not result["success"]]
        
        if "test_firebase_connection.py" in failed_tests:
            print(f"{Colors.RED}🔥 Firebase Connection Failed:{Colors.END}")
            print(f"   - Check serviceAccountKey.json exists and is valid")
            print(f"   - Verify FIREBASE_DB_URL environment variable")
            print(f"   - Ensure Firebase project has Realtime DB enabled")
            
        if "test_device_api.py" in failed_tests:
            print(f"{Colors.RED}📡 Device API Failed:{Colors.END}")
            print(f"   - Check if FastAPI server is running")
            print(f"   - Verify API endpoints are accessible")
            print(f"   - Test device authentication logic")
            
        if "test_load_performance.py" in failed_tests:
            print(f"{Colors.YELLOW}⚡ Performance Issues:{Colors.END}")
            print(f"   - API may be slow under load")
            print(f"   - Consider optimizing database queries")
            print(f"   - Check server resources")
            
    def run_quick_health_check(self):
        """Run a quick health check of critical components"""
        self.print_header("⚡ QUICK HEALTH CHECK")
        
        quick_tests = [
            {
                "script": "test_firebase_connection.py",
                "description": "Firebase Health Check",
                "timeout": 60
            },
            {
                "script": "test_device_api.py",
                "description": "API Health Check", 
                "timeout": 90
            }
        ]
        
        successful = 0
        
        for test_config in quick_tests:
            success = self.run_test_script(
                test_config["script"],
                test_config["description"],
                test_config["timeout"]
            )
            if success:
                successful += 1
                
        if successful == len(quick_tests):
            self.print_status("🎉 Quick health check PASSED", "SUCCESS")
            return True
        else:
            self.print_status(f"❌ Quick health check FAILED ({successful}/{len(quick_tests)})", "ERROR")
            return False

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Master test runner for backend system")
    parser.add_argument("--quick", action="store_true", help="Run quick health check only")
    parser.add_argument("--verbose", action="store_true", help="Show detailed output")
    
    args = parser.parse_args()
    
    runner = MasterTestRunner()
    
    try:
        if args.quick:
            success = runner.run_quick_health_check()
            exit(0 if success else 1)
        else:
            successful, total, critical = runner.run_comprehensive_test_suite()
            
            # Exit with appropriate code
            if successful == total:
                exit(0)  # All tests passed
            elif critical == 0:
                exit(1)  # Non-critical failures
            else:
                exit(2)  # Critical failures
                
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⏹️  Test suite interrupted by user{Colors.END}")
        exit(130)
    except Exception as e:
        print(f"\n{Colors.RED}💥 Unexpected error: {str(e)}{Colors.END}")
        exit(3)

if __name__ == "__main__":
    main()
