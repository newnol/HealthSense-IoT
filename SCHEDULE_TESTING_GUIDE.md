# Schedule Management Testing Guide

## Overview
This guide explains how to test the new schedule management functionality in the HealthSense-IoT system.

## Features Implemented

### 1. Frontend Features
- **Dashboard Button**: Added "Quản lý lịch trình" (Manage Scheduling) button next to device management
- **Schedule Page**: `/schedule` with two tabs:
  - **Create Schedule Tab**: Create new schedules for devices
  - **Manage Schedules Tab**: View and manage existing schedules

### 2. Backend Features
- **Schedule API**: Complete REST API at `/api/schedule/*`
- **MQTT Integration**: Real-time notifications to ESP32 devices via HiveMQ
- **Background Scheduler**: Automatic processing of scheduled notifications
- **Database**: Firebase Realtime Database for schedule storage

## Testing Steps

### 1. Start the System
```bash
# Terminal 1: Start backend
cd /home/pnt/study/iot-final/HealthSense-IoT
python start-backend.py

# Terminal 2: Start frontend
npm run dev
```

### 2. Access the Application
- Frontend: http://localhost:3000
- Backend API Docs: http://localhost:8001/docs

### 3. Test User Journey

#### Step 1: Login/Authentication
1. Go to http://localhost:3000
2. Login with your Firebase credentials
3. Navigate to Dashboard

#### Step 2: Access Schedule Management
1. Click the "⏰ Quản lý lịch trình" button on the dashboard
2. You should see the schedule management page with two tabs

#### Step 3: Create a Schedule
1. Go to "Tạo lịch trình mới" tab
2. Select a device from your registered devices
3. Set a future time (e.g., 2-3 minutes from now for testing)
4. Click "Tạo lịch trình"
5. Verify success message appears

#### Step 4: View Schedules
1. Switch to "Quản lý lịch trình" tab
2. Verify your created schedule appears
3. Check the status shows "Đang chờ" (Pending)

#### Step 5: Wait for Notification
1. Wait for the scheduled time
2. The background scheduler will automatically send MQTT notification
3. Check schedule status changes to "Đã hoàn thành" (Completed)

### 4. API Testing

#### Check Scheduler Status
```bash
curl -X GET "http://localhost:8001/api/schedule/status"
```

#### Test MQTT Connection (requires device_id and auth)
```bash
curl -X POST "http://localhost:8001/api/schedule/test-mqtt/YOUR_DEVICE_ID" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

#### Get User Schedules
```bash
curl -X GET "http://localhost:8001/api/schedule/user" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

## MQTT Configuration

### HiveMQ Cloud Setup
- **Broker**: `70030b8b8dc741c79d6ab7ffa586f461.s1.eu.hivemq.cloud`
- **Port**: 8883 (TLS)
- **Username**: `phamngocthai`
- **Password**: `Thai2005`

### MQTT Topics
- Pattern: `healthsense/{device_id}/notification`
- Example: `healthsense/ESP32_001/notification`

### Message Format
```json
{
  "timestamp": 1692633600000,
  "message": "Health Check Reminder: Time for your scheduled health monitoring",
  "type": "scheduled_notification",
  "action": "health_check_reminder"
}
```

## Database Structure

### Schedules
```
/schedules/{schedule_id}
{
  "user_id": "firebase_user_id",
  "device_id": "ESP32_001",
  "scheduled_time": {
    "minute": 30,
    "hour": 14,
    "day": 21,
    "month": 8,
    "year": 2025
  },
  "created_at": 1692633600000,
  "status": "pending|sent|failed",
  "notification_time_utc": "2025-08-21T14:30:00+00:00",
  "sent_at": 1692634800000 // optional, when sent
}
```

## ESP32 Integration

### Subscribing to Notifications
Your ESP32 devices should subscribe to:
```
healthsense/{your_device_id}/notification
```

### Sample ESP32 Code
```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

const char* mqtt_server = "70030b8b8dc741c79d6ab7ffa586f461.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_username = "phamngocthai";
const char* mqtt_password = "Thai2005";

String device_id = "ESP32_001"; // Your device ID
String topic = "healthsense/" + device_id + "/notification";

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  // Parse JSON
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  String notification_message = doc["message"];
  String action = doc["action"];
  
  if (action == "health_check_reminder") {
    // Trigger health monitoring
    Serial.println("⏰ Scheduled health check reminder received!");
    Serial.println("Message: " + notification_message);
    
    // Add your health monitoring logic here
    // e.g., take heart rate and SpO2 readings
  }
}
```

## Troubleshooting

### Common Issues

1. **Schedule not executing**
   - Check if background scheduler is running: `/api/schedule/status`
   - Verify schedule time is in the future
   - Check Firebase database permissions

2. **MQTT connection fails**
   - Verify HiveMQ credentials
   - Check TLS/SSL configuration
   - Test with `/api/schedule/test-mqtt/{device_id}`

3. **Device not found**
   - Ensure device is registered in device management
   - Check user has access to the device

4. **Authentication errors**
   - Verify Firebase token is valid
   - Check user permissions

### Logs
- Backend logs: Check terminal running `python start-backend.py`
- Frontend logs: Check browser console
- Schedule logs: Background scheduler logs appear in backend terminal

## Production Considerations

1. **Environment Variables**: Move MQTT credentials to environment variables
2. **Error Handling**: Implement retry logic for failed MQTT messages
3. **Scaling**: Consider using proper task queue (Celery, Redis) for large scale
4. **Monitoring**: Add proper logging and monitoring for schedule execution
5. **Security**: Implement proper rate limiting and validation

## Testing Checklist

- [ ] Can access schedule page from dashboard
- [ ] Can create new schedule with valid device
- [ ] Schedule appears in manage tab
- [ ] Background scheduler processes schedule at correct time
- [ ] MQTT notification sent successfully
- [ ] Schedule status updates to "sent"
- [ ] Can delete pending schedules
- [ ] Cannot delete completed schedules
- [ ] Proper error messages for invalid inputs
- [ ] Responsive design works on mobile
