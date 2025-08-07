#!/usr/bin/env python3
"""
ESP32 Device Simulator
Simulates multiple ESP32 devices sending sensor data to the API
"""

import asyncio
import aiohttp
import random
import time
import json
from datetime import datetime, timedelta
from config import API_BASE_URL, Colors

class ESP32Simulator:
    def __init__(self, device_id, device_secret, base_url=API_BASE_URL):
        self.device_id = device_id
        self.device_secret = device_secret
        self.base_url = base_url
        self.is_running = False
        self.session = None
        
        # Simulate device characteristics
        self.battery_level = random.randint(50, 100)
        self.signal_strength = random.randint(-80, -30)
        self.baseline_heart_rate = random.randint(65, 85)
        self.baseline_spo2 = random.randint(97, 99)
        self.temperature_baseline = round(random.uniform(36.2, 37.0), 1)
        
        # Health patterns
        self.health_pattern = random.choice(['normal', 'exercise', 'resting', 'stressed'])
        self.anomaly_chance = 0.05  # 5% chance of anomaly
        
    def print_status(self, message, status="INFO"):
        color = Colors.BLUE
        if status == "SUCCESS":
            color = Colors.GREEN
        elif status == "ERROR":
            color = Colors.RED
        elif status == "WARNING":
            color = Colors.YELLOW
            
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"{color}[{timestamp}] {self.device_id}: {message}{Colors.END}")
        
    def generate_realistic_sensor_data(self):
        """Generate realistic sensor data based on health patterns"""
        current_time = int(time.time() * 1000)
        
        # Generate heart rate based on pattern
        if self.health_pattern == 'exercise':
            heart_rate = self.baseline_heart_rate + random.randint(20, 50)
        elif self.health_pattern == 'resting':
            heart_rate = self.baseline_heart_rate - random.randint(5, 15)
        elif self.health_pattern == 'stressed':
            heart_rate = self.baseline_heart_rate + random.randint(10, 25)
        else:  # normal
            heart_rate = self.baseline_heart_rate + random.randint(-5, 10)
            
        # Add some random variation
        heart_rate += random.randint(-3, 3)
        heart_rate = max(45, min(180, heart_rate))  # Clamp to realistic range
        
        # Generate SpO2
        if self.health_pattern == 'exercise':
            spo2 = self.baseline_spo2 - random.randint(1, 3)
        else:
            spo2 = self.baseline_spo2 + random.randint(-1, 1)
            
        spo2 = max(90, min(100, spo2))  # Clamp to realistic range
        
        # Generate temperature (usually stable)
        temperature = self.temperature_baseline + random.uniform(-0.3, 0.3)
        temperature = round(temperature, 1)
        
        # Battery drain simulation
        if random.random() < 0.1:  # 10% chance to drain battery
            self.battery_level = max(0, self.battery_level - 1)
            
        # Signal strength variation
        self.signal_strength += random.randint(-5, 5)
        self.signal_strength = max(-100, min(-20, self.signal_strength))
        
        # Simulate anomalies
        if random.random() < self.anomaly_chance:
            if random.choice([True, False]):
                heart_rate = random.choice([random.randint(35, 45), random.randint(150, 200)])
                self.print_status(f"⚠️  Anomaly: Heart rate spike to {heart_rate}", "WARNING")
            else:
                spo2 = random.randint(85, 92)
                self.print_status(f"⚠️  Anomaly: SpO2 drop to {spo2}", "WARNING")
                
        return {
            "heart_rate": heart_rate,
            "spo2": spo2,
            "temperature": temperature,
            "timestamp": current_time,
            "battery_level": self.battery_level,
            "signal_strength": self.signal_strength,
            "device_pattern": self.health_pattern
        }
        
    async def send_sensor_data(self):
        """Send sensor data to API"""
        headers = {
            "X-Device-Id": self.device_id,
            "X-Device-Secret": self.device_secret,
            "Content-Type": "application/json"
        }
        
        sensor_data = self.generate_realistic_sensor_data()
        
        try:
            async with self.session.post(
                f"{self.base_url}/api/records/",
                headers=headers,
                json=sensor_data,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    self.print_status(f"✅ Data sent: HR={sensor_data['heart_rate']}, SpO2={sensor_data['spo2']}% (key: {result.get('key', 'N/A')})")
                    return True
                else:
                    error_text = await response.text()
                    self.print_status(f"❌ Failed to send data: {response.status} - {error_text}", "ERROR")
                    return False
                    
        except asyncio.TimeoutError:
            self.print_status("❌ Timeout sending data", "ERROR")
            return False
        except Exception as e:
            self.print_status(f"❌ Error sending data: {str(e)}", "ERROR")
            return False
            
    async def check_for_commands(self):
        """Check for pending commands"""
        headers = {
            "X-Device-Id": self.device_id,
            "X-Device-Secret": self.device_secret
        }
        
        try:
            async with self.session.get(
                f"{self.base_url}/api/command/{self.device_id}",
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                
                if response.status == 200:
                    command_data = await response.json()
                    
                    if command_data.get('action'):
                        self.print_status(f"📡 Received command: {command_data['action']}")
                        
                        # Simulate command execution
                        if command_data['action'] == 'calibrate':
                            self.print_status("🔧 Executing calibration...")
                            await asyncio.sleep(2)  # Simulate calibration time
                            self.print_status("✅ Calibration complete")
                            
                        elif command_data['action'] == 'reset':
                            self.print_status("🔄 Executing reset...")
                            self.battery_level = random.randint(80, 100)
                            self.signal_strength = random.randint(-50, -30)
                            
                        elif command_data['action'] == 'change_pattern':
                            pattern = command_data.get('pattern', ['normal'])[0]
                            if pattern in ['normal', 'exercise', 'resting', 'stressed']:
                                self.health_pattern = pattern
                                self.print_status(f"🔄 Changed health pattern to: {pattern}")
                                
                        return True
                    
                return False
                
        except Exception as e:
            self.print_status(f"❌ Error checking commands: {str(e)}", "ERROR")
            return False
            
    async def simulate_device_lifecycle(self, duration_minutes=5, data_interval=10):
        """Simulate complete device lifecycle"""
        self.print_status(f"🚀 Starting simulation for {duration_minutes} minutes (data every {data_interval}s)")
        
        connector = aiohttp.TCPConnector(limit=5)
        timeout = aiohttp.ClientTimeout(total=30)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            self.session = session
            self.is_running = True
            
            start_time = time.time()
            end_time = start_time + (duration_minutes * 60)
            
            data_sent_count = 0
            commands_received = 0
            
            while time.time() < end_time and self.is_running:
                # Send sensor data
                if await self.send_sensor_data():
                    data_sent_count += 1
                    
                # Check for commands (less frequently)
                if data_sent_count % 3 == 0:  # Every 3rd data transmission
                    if await self.check_for_commands():
                        commands_received += 1
                        
                # Simulate battery critical shutdown
                if self.battery_level <= 5:
                    self.print_status("🔋 Battery critical! Shutting down...", "WARNING")
                    break
                    
                # Wait for next data transmission
                await asyncio.sleep(data_interval)
                
            self.is_running = False
            
            # Summary
            total_time = (time.time() - start_time) / 60  # Convert to minutes
            self.print_status(f"📊 Simulation complete after {total_time:.1f} minutes")
            self.print_status(f"   Data transmissions: {data_sent_count}")
            self.print_status(f"   Commands received: {commands_received}")
            self.print_status(f"   Final battery: {self.battery_level}%")
            self.print_status(f"   Health pattern: {self.health_pattern}")
            
            return {
                "device_id": self.device_id,
                "duration_minutes": total_time,
                "data_sent": data_sent_count,
                "commands_received": commands_received,
                "final_battery": self.battery_level,
                "health_pattern": self.health_pattern
            }

class MultiDeviceSimulator:
    def __init__(self, base_url=API_BASE_URL):
        self.base_url = base_url
        self.devices = []
        
    def print_status(self, message, status="INFO"):
        color = Colors.BLUE
        if status == "SUCCESS":
            color = Colors.GREEN
        elif status == "ERROR":
            color = Colors.RED
        elif status == "WARNING":
            color = Colors.YELLOW
            
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"{color}[{timestamp}] SIMULATOR: {message}{Colors.END}")
        
    def create_devices(self, num_devices=3):
        """Create multiple simulated devices"""
        self.print_status(f"Creating {num_devices} simulated devices...")
        
        device_types = ['bedroom', 'living_room', 'office', 'gym', 'kitchen']
        health_patterns = ['normal', 'exercise', 'resting', 'stressed']
        
        for i in range(num_devices):
            device_type = device_types[i % len(device_types)]
            health_pattern = health_patterns[i % len(health_patterns)]
            
            device = ESP32Simulator(
                device_id=f"sim_{device_type}_{i:03d}",
                device_secret=f"sim_secret_{i:03d}",
                base_url=self.base_url
            )
            
            device.health_pattern = health_pattern
            self.devices.append(device)
            
        self.print_status(f"✅ Created {len(self.devices)} devices")
        
    async def run_simulation(self, duration_minutes=3, data_interval=15):
        """Run simulation with multiple devices"""
        if not self.devices:
            self.create_devices(3)
            
        self.print_status(f"🚀 Starting multi-device simulation")
        self.print_status(f"   Duration: {duration_minutes} minutes")
        self.print_status(f"   Data interval: {data_interval} seconds")
        self.print_status(f"   Devices: {len(self.devices)}")
        
        # Start all device simulations concurrently
        tasks = []
        for device in self.devices:
            task = asyncio.create_task(
                device.simulate_device_lifecycle(duration_minutes, data_interval)
            )
            tasks.append(task)
            
        # Wait for all simulations to complete
        results = await asyncio.gather(*tasks)
        
        # Aggregate results
        total_data_sent = sum(r["data_sent"] for r in results)
        total_commands = sum(r["commands_received"] for r in results)
        
        self.print_status("📊 MULTI-DEVICE SIMULATION SUMMARY", "SUCCESS")
        self.print_status(f"   Total devices: {len(results)}")
        self.print_status(f"   Total data transmissions: {total_data_sent}")
        self.print_status(f"   Total commands received: {total_commands}")
        self.print_status(f"   Average data per device: {total_data_sent/len(results):.1f}")
        
        for result in results:
            pattern_color = Colors.GREEN if result["health_pattern"] == "normal" else Colors.YELLOW
            self.print_status(f"   {result['device_id']}: {result['data_sent']} transmissions, "
                            f"{pattern_color}{result['health_pattern']}{Colors.END} pattern, "
                            f"{result['final_battery']}% battery")
            
        return results

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="ESP32 Device Simulator")
    parser.add_argument("--url", default=API_BASE_URL, help="API base URL")
    parser.add_argument("--devices", type=int, default=3, help="Number of devices to simulate")
    parser.add_argument("--duration", type=int, default=3, help="Simulation duration in minutes")
    parser.add_argument("--interval", type=int, default=15, help="Data transmission interval in seconds")
    parser.add_argument("--single", help="Run single device with specified device_id")
    
    args = parser.parse_args()
    
    if args.single:
        # Single device simulation
        device = ESP32Simulator(
            device_id=args.single,
            device_secret=f"{args.single}_secret",
            base_url=args.url
        )
        
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}📱 ESP32 SINGLE DEVICE SIMULATOR{Colors.END}")
        print(f"{Colors.BOLD}Device: {args.single}{Colors.END}")
        print(f"{Colors.BOLD}Target: {args.url}{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        result = asyncio.run(device.simulate_device_lifecycle(args.duration, args.interval))
        print(f"\n{Colors.GREEN}Simulation completed!{Colors.END}")
        
    else:
        # Multi-device simulation
        simulator = MultiDeviceSimulator(args.url)
        simulator.create_devices(args.devices)
        
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}📱 ESP32 MULTI-DEVICE SIMULATOR{Colors.END}")
        print(f"{Colors.BOLD}Devices: {args.devices}{Colors.END}")
        print(f"{Colors.BOLD}Target: {args.url}{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        results = asyncio.run(simulator.run_simulation(args.duration, args.interval))
        print(f"\n{Colors.GREEN}Multi-device simulation completed!{Colors.END}")

if __name__ == "__main__":
    main()
