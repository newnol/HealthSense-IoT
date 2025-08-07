#!/usr/bin/env python3
"""
Load testing and performance testing script
Tests API performance under various load conditions
"""

import asyncio
import aiohttp
import time
import statistics
import random
from concurrent.futures import ThreadPoolExecutor
from config import API_BASE_URL, TEST_DEVICES, SAMPLE_SENSOR_DATA, Colors

class LoadTester:
    def __init__(self, base_url=API_BASE_URL):
        self.base_url = base_url
        self.results = []
        
    def print_status(self, message, status="INFO"):
        color = Colors.BLUE
        if status == "SUCCESS":
            color = Colors.GREEN
        elif status == "ERROR":
            color = Colors.RED
        elif status == "WARNING":
            color = Colors.YELLOW
            
        print(f"{color}[{status}]{Colors.END} {message}")
        
    async def send_single_request(self, session, device_config, request_id):
        """Send a single request and measure response time"""
        headers = {
            "X-Device-Id": device_config["device_id"],
            "X-Device-Secret": device_config["device_secret"],
            "Content-Type": "application/json"
        }
        
        # Generate realistic sensor data
        test_data = {
            "heart_rate": random.randint(60, 100),
            "spo2": random.randint(95, 100),
            "temperature": round(random.uniform(36.0, 37.5), 1),
            "timestamp": int(time.time() * 1000),
            "battery_level": random.randint(20, 100),
            "signal_strength": random.randint(-80, -30),
            "request_id": request_id
        }
        
        start_time = time.time()
        
        try:
            async with session.post(
                f"{self.base_url}/api/records/",
                headers=headers,
                json=test_data
            ) as response:
                end_time = time.time()
                response_time = (end_time - start_time) * 1000  # Convert to ms
                
                result = {
                    "request_id": request_id,
                    "status_code": response.status,
                    "response_time": response_time,
                    "success": response.status == 200,
                    "timestamp": start_time
                }
                
                if response.status == 200:
                    response_data = await response.json()
                    result["response_data"] = response_data
                    
                return result
                
        except Exception as e:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            
            return {
                "request_id": request_id,
                "status_code": 0,
                "response_time": response_time,
                "success": False,
                "error": str(e),
                "timestamp": start_time
            }
            
    async def concurrent_load_test(self, device_config, num_requests=50, concurrency=10):
        """Run concurrent load test"""
        self.print_status(f"Running concurrent load test: {num_requests} requests with {concurrency} concurrent connections")
        
        connector = aiohttp.TCPConnector(limit=concurrency)
        timeout = aiohttp.ClientTimeout(total=30)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            # Create semaphore to limit concurrency
            semaphore = asyncio.Semaphore(concurrency)
            
            async def limited_request(request_id):
                async with semaphore:
                    return await self.send_single_request(session, device_config, request_id)
                    
            # Create all tasks
            tasks = [limited_request(i) for i in range(num_requests)]
            
            # Execute all requests
            start_time = time.time()
            results = await asyncio.gather(*tasks)
            end_time = time.time()
            
            total_time = end_time - start_time
            
            # Analyze results
            successful_requests = [r for r in results if r["success"]]
            failed_requests = [r for r in results if not r["success"]]
            
            response_times = [r["response_time"] for r in successful_requests]
            
            self.print_status(f"Load test completed in {total_time:.2f} seconds", "SUCCESS")
            self.print_status(f"Successful requests: {len(successful_requests)}/{num_requests}")
            self.print_status(f"Failed requests: {len(failed_requests)}")
            
            if response_times:
                self.print_status(f"Average response time: {statistics.mean(response_times):.2f}ms")
                self.print_status(f"Median response time: {statistics.median(response_times):.2f}ms")
                self.print_status(f"Min response time: {min(response_times):.2f}ms")
                self.print_status(f"Max response time: {max(response_times):.2f}ms")
                
                if len(response_times) > 1:
                    self.print_status(f"Response time std dev: {statistics.stdev(response_times):.2f}ms")
                    
                # Calculate percentiles
                sorted_times = sorted(response_times)
                p95_index = int(len(sorted_times) * 0.95)
                p99_index = int(len(sorted_times) * 0.99)
                
                self.print_status(f"95th percentile: {sorted_times[p95_index]:.2f}ms")
                self.print_status(f"99th percentile: {sorted_times[p99_index]:.2f}ms")
                
            # Calculate throughput
            requests_per_second = len(successful_requests) / total_time
            self.print_status(f"Throughput: {requests_per_second:.2f} requests/second")
            
            return {
                "total_requests": num_requests,
                "successful_requests": len(successful_requests),
                "failed_requests": len(failed_requests),
                "total_time": total_time,
                "response_times": response_times,
                "throughput": requests_per_second,
                "success_rate": len(successful_requests) / num_requests * 100
            }
            
    def stress_test_sequential(self, device_config, duration_seconds=60):
        """Run sequential stress test for specified duration"""
        self.print_status(f"Running sequential stress test for {duration_seconds} seconds")
        
        import requests
        session = requests.Session()
        
        headers = {
            "X-Device-Id": device_config["device_id"],
            "X-Device-Secret": device_config["device_secret"],
            "Content-Type": "application/json"
        }
        
        start_time = time.time()
        request_count = 0
        successful_requests = 0
        response_times = []
        
        while (time.time() - start_time) < duration_seconds:
            # Generate test data
            test_data = {
                "heart_rate": random.randint(60, 100),
                "spo2": random.randint(95, 100),
                "temperature": round(random.uniform(36.0, 37.5), 1),
                "timestamp": int(time.time() * 1000),
                "battery_level": random.randint(20, 100),
                "request_id": request_count
            }
            
            request_start = time.time()
            
            try:
                response = session.post(
                    f"{self.base_url}/api/records/",
                    headers=headers,
                    json=test_data,
                    timeout=10
                )
                
                request_end = time.time()
                response_time = (request_end - request_start) * 1000
                response_times.append(response_time)
                
                if response.status_code == 200:
                    successful_requests += 1
                    
            except Exception as e:
                self.print_status(f"Request {request_count} failed: {str(e)}", "WARNING")
                
            request_count += 1
            
            # Small delay to prevent overwhelming
            time.sleep(0.1)
            
        total_time = time.time() - start_time
        
        self.print_status(f"Sequential stress test completed", "SUCCESS")
        self.print_status(f"Total requests: {request_count}")
        self.print_status(f"Successful requests: {successful_requests}")
        self.print_status(f"Success rate: {(successful_requests/request_count)*100:.2f}%")
        self.print_status(f"Average requests per second: {request_count/total_time:.2f}")
        
        if response_times:
            self.print_status(f"Average response time: {statistics.mean(response_times):.2f}ms")
            
        return {
            "total_requests": request_count,
            "successful_requests": successful_requests,
            "total_time": total_time,
            "response_times": response_times,
            "requests_per_second": request_count / total_time
        }
        
    def test_multiple_devices(self, num_devices=3, requests_per_device=20):
        """Test with multiple devices simultaneously"""
        self.print_status(f"Testing with {num_devices} devices, {requests_per_device} requests each")
        
        # Create multiple device configurations
        devices = []
        for i in range(num_devices):
            devices.append({
                "device_id": f"load_test_device_{i:03d}",
                "device_secret": f"load_test_secret_{i:03d}",
                "name": f"Load Test Device {i+1}"
            })
            
        async def test_device(device_config):
            return await self.concurrent_load_test(device_config, requests_per_device, 5)
            
        async def run_all_devices():
            tasks = [test_device(device) for device in devices]
            return await asyncio.gather(*tasks)
            
        start_time = time.time()
        results = asyncio.run(run_all_devices())
        total_time = time.time() - start_time
        
        # Aggregate results
        total_requests = sum(r["total_requests"] for r in results)
        total_successful = sum(r["successful_requests"] for r in results)
        all_response_times = []
        
        for result in results:
            all_response_times.extend(result["response_times"])
            
        self.print_status(f"Multi-device test completed in {total_time:.2f} seconds", "SUCCESS")
        self.print_status(f"Total requests across all devices: {total_requests}")
        self.print_status(f"Total successful requests: {total_successful}")
        self.print_status(f"Overall success rate: {(total_successful/total_requests)*100:.2f}%")
        
        if all_response_times:
            self.print_status(f"Overall average response time: {statistics.mean(all_response_times):.2f}ms")
            
        overall_throughput = total_successful / total_time
        self.print_status(f"Overall throughput: {overall_throughput:.2f} requests/second")
        
        return {
            "devices_tested": num_devices,
            "total_requests": total_requests,
            "successful_requests": total_successful,
            "total_time": total_time,
            "overall_throughput": overall_throughput
        }
        
    def run_performance_suite(self):
        """Run complete performance test suite"""
        device_config = TEST_DEVICES["device_1"]
        
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}⚡ PERFORMANCE & LOAD TEST SUITE{Colors.END}")
        print(f"{Colors.BOLD}Target: {self.base_url}{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        results = {}
        
        # Test 1: Basic concurrent load test
        self.print_status("🔸 Test 1: Basic Concurrent Load Test")
        results["concurrent_basic"] = asyncio.run(
            self.concurrent_load_test(device_config, 30, 5)
        )
        
        time.sleep(2)  # Brief pause between tests
        
        # Test 2: High concurrency test
        self.print_status("\n🔸 Test 2: High Concurrency Test")
        results["concurrent_high"] = asyncio.run(
            self.concurrent_load_test(device_config, 50, 15)
        )
        
        time.sleep(2)
        
        # Test 3: Sequential stress test
        self.print_status("\n🔸 Test 3: Sequential Stress Test (30 seconds)")
        results["sequential_stress"] = self.stress_test_sequential(device_config, 30)
        
        time.sleep(2)
        
        # Test 4: Multiple devices test
        self.print_status("\n🔸 Test 4: Multiple Devices Test")
        results["multiple_devices"] = self.test_multiple_devices(3, 15)
        
        # Summary
        print(f"\n{Colors.BOLD}📊 PERFORMANCE TEST SUMMARY{Colors.END}")
        
        for test_name, result in results.items():
            if "success_rate" in result:
                success_rate = result["success_rate"]
                color = Colors.GREEN if success_rate >= 95 else Colors.YELLOW if success_rate >= 80 else Colors.RED
                print(f"{test_name}: {color}{success_rate:.1f}% success rate{Colors.END}")
                
        return results

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Run load and performance tests")
    parser.add_argument("--url", default=API_BASE_URL, help="API base URL")
    parser.add_argument("--requests", type=int, default=50, help="Number of requests for load test")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent connections")
    parser.add_argument("--duration", type=int, default=60, help="Duration for stress test (seconds)")
    
    args = parser.parse_args()
    
    tester = LoadTester(args.url)
    
    if args.requests and args.concurrency:
        # Run single concurrent test
        device_config = TEST_DEVICES["device_1"]
        result = asyncio.run(
            tester.concurrent_load_test(device_config, args.requests, args.concurrency)
        )
        print(f"\nTest completed with {result['success_rate']:.1f}% success rate")
    else:
        # Run full suite
        tester.run_performance_suite()

if __name__ == "__main__":
    main()
