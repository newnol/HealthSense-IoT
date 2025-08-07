# Backend Testing Scripts

This folder contains comprehensive testing scripts for the Physics Final Project backend system.

## 📁 Scripts Overview

### 🔧 Configuration
- **`config.py`** - Central configuration file with API endpoints, test data, and styling
- **`requirements.txt`** - Python dependencies for test scripts

### 🧪 Individual Test Scripts

#### 1. **`test_firebase_connection.py`** - Firebase Database Testing
Tests Firebase Realtime Database and Firestore connectivity and operations.

```bash
python test_firebase_connection.py
```

**Features:**
- ✅ Firebase Admin SDK initialization
- ✅ Realtime Database read/write operations
- ✅ Firestore collection operations
- ✅ Data structure validation
- ✅ Cleanup of test data

#### 2. **`test_device_api.py`** - Device API Endpoint Testing
Comprehensive testing of device authentication and data submission APIs.

```bash
python test_device_api.py --device device_1 --records 5
```

**Features:**
- ✅ Device authentication validation
- ✅ Invalid credentials rejection
- ✅ Sensor data submission
- ✅ Command retrieval and submission
- ✅ Multiple test scenarios

**Options:**
- `--url` - API base URL (default: http://localhost:8000)
- `--device` - Device to test (device_1, device_2)
- `--records` - Number of test records to submit

#### 3. **`test_load_performance.py`** - Load & Performance Testing
Tests API performance under various load conditions.

```bash
python test_load_performance.py --requests 50 --concurrency 10
```

**Features:**
- ⚡ Concurrent request testing
- ⚡ Sequential stress testing
- ⚡ Multi-device simulation
- ⚡ Response time analysis
- ⚡ Throughput measurement

**Options:**
- `--url` - API base URL
- `--requests` - Number of requests for load test
- `--concurrency` - Concurrent connections
- `--duration` - Duration for stress test (seconds)

#### 4. **`test_esp32_simulator.py`** - ESP32 Device Simulation
Realistic simulation of ESP32 devices sending sensor data.

```bash
# Single device simulation
python test_esp32_simulator.py --single esp32_001 --duration 5

# Multi-device simulation
python test_esp32_simulator.py --devices 3 --duration 3 --interval 15
```

**Features:**
- 📱 Realistic sensor data generation
- 📱 Multiple health patterns (normal, exercise, resting, stressed)
- 📱 Battery and signal simulation
- 📱 Command processing simulation
- 📱 Anomaly detection simulation

**Options:**
- `--url` - API base URL
- `--devices` - Number of devices to simulate
- `--duration` - Simulation duration in minutes
- `--interval` - Data transmission interval in seconds
- `--single` - Run single device with specified device_id

### 🎯 Master Test Runner

#### **`run_all_tests.py`** - Comprehensive Test Suite
Executes all test scripts in logical order and generates detailed reports.

```bash
# Full test suite
python run_all_tests.py

# Quick health check
python run_all_tests.py --quick
```

**Features:**
- 🎯 Sequential execution of all tests
- 🎯 Comprehensive test reporting
- 🎯 Performance metrics
- 🎯 Failure analysis
- 🎯 Recommendations based on results

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd scripts
pip install -r requirements.txt
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-rtdb.firebaseio.com/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

### 3. Run Quick Health Check
```bash
python run_all_tests.py --quick
```

### 4. Run Full Test Suite
```bash
python run_all_tests.py
```

## 📊 Test Results Interpretation

### ✅ Success Indicators
- **Green messages** - Tests passed successfully
- **100% success rate** - All functionality working
- **Low response times** - Good performance
- **No critical failures** - System ready for production

### ⚠️ Warning Indicators
- **Yellow messages** - Non-critical issues
- **80-99% success rate** - Minor issues need attention
- **High response times** - Performance optimization needed

### ❌ Failure Indicators
- **Red messages** - Critical failures
- **<80% success rate** - Major issues
- **Connection errors** - Infrastructure problems
- **Authentication failures** - Security/config issues

## 🔧 Troubleshooting

### Common Issues

#### Firebase Connection Failed
```bash
❌ Firebase Connection Failed:
   - Check serviceAccountKey.json exists and is valid
   - Verify FIREBASE_DB_URL environment variable
   - Ensure Firebase project has Realtime DB enabled
```

#### API Endpoints Not Accessible
```bash
❌ Device API Failed:
   - Check if FastAPI server is running
   - Verify API endpoints are accessible
   - Test device authentication logic
```

#### Performance Issues
```bash
⚠️ Performance Issues:
   - API may be slow under load
   - Consider optimizing database queries
   - Check server resources
```

### Debug Mode
For detailed debugging, examine individual test outputs:

```bash
python test_device_api.py --url http://localhost:8000 --device device_1
```

## 📈 Advanced Usage

### Custom Test Scenarios

#### Test Production Environment
```bash
python test_device_api.py --url https://your-app.vercel.app
```

#### Stress Test with High Load
```bash
python test_load_performance.py --requests 200 --concurrency 50 --duration 300
```

#### Long-running Device Simulation
```bash
python test_esp32_simulator.py --devices 5 --duration 60 --interval 10
```

### Automated Testing in CI/CD
```bash
#!/bin/bash
# CI/CD script example
cd scripts
pip install -r requirements.txt

# Run health check first
python run_all_tests.py --quick
if [ $? -eq 0 ]; then
    echo "Health check passed, running full suite..."
    python run_all_tests.py
else
    echo "Health check failed, stopping deployment"
    exit 1
fi
```

## 🎯 Best Practices

1. **Always run quick health check first** before full testing
2. **Test locally** before testing production endpoints
3. **Monitor resource usage** during load tests
4. **Review error messages** carefully for debugging
5. **Run tests regularly** during development
6. **Use realistic test data** for accurate results

## 📝 Adding New Tests

To add new test scripts:

1. Create new `.py` file in `scripts/` folder
2. Follow the existing pattern with `print_status()` and colors
3. Add configuration to `config.py` if needed
4. Update `run_all_tests.py` to include new script
5. Document the new test in this README

## 🤝 Support

If you encounter issues with the test scripts:

1. Check the error messages and recommendations
2. Verify your environment configuration
3. Ensure all dependencies are installed
4. Test individual scripts before running the full suite
5. Review the Firebase and API configurations

---

**Happy Testing! 🧪✨**
