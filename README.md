# Heart Rate & SpO2 Monitoring System

A smart health monitoring system that uses ESP32 to collect heart rate data (Heart Rate) and blood oxygen concentration (SpO2), integrates AI to analyze and provide personalized health advice. The system is built with a modern full-stack architecture, including Next.js frontend, FastAPI backend and Firebase Realtime Database.

## 🩺 Project Overview

This project aims to create a comprehensive health monitoring solution that allows:
- **Real-time data collection**: ESP32 measures and transmits Heart Rate and SpO2 data
- **Smart analytics**: AI processes data to assess health status
- **Personalized advice**: Provides recommendations and alerts based on analyzed data
- **Continuous monitoring**: Tracks health trends over time

## 🔬 Main functions

### 📡 Data collection
- Measures Heart Rate with high accuracy
- Measures SpO2 in real time
- Securely transmits data from ESP32 to the cloud via REST API

### 🤖 AI analytics
- Processes and analyzes physiological data
- Detects abnormalities in health indicators
- Evaluates trends and patterns personal health

### 💡 Smart advice
- Data-driven lifestyle recommendations
- Early warning of potential health issues
- Activity and rest recommendations

### 📊 Data visualization
- Dashboard to track health metrics
- Trend charts over time
- Regular health reports

## 🏗️ Architecture

- **Frontend**: Next.js (React) with TypeScript support
- **Backend**: FastAPI (Python) with Firebase Admin SDK
- **Database**: Firebase Realtime Database
- **Deployment**: Vercel with serverless functions
- **Device Communication**: REST API with header-based authentication

## 📋 Features

- **User Authentication**: Firebase Authentication with email/password and Google sign-in
- **Device Registration & Authentication**: Secure device identification using device ID and secret
- **Data Collection**: RESTful endpoints for IoT devices to submit sensor data
- **Command Management**: Send commands and patterns to registered devices
- **Real-time Database**: Firebase integration for persistent data storage
- **Personal Dashboard**: User-specific health monitoring dashboard
- **CORS Support**: Cross-origin requests enabled for web client access

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python 3.8+
- Firebase project with Realtime Database enabled
- Vercel CLI (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HealthSense-IoT
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Set up Python environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Realtime Database
   - Enable Authentication with Email/Password and Google providers
   - Generate a service account key and save as `serviceAccountKey.json`
   - Get your Firebase config from Project Settings > General > Your apps
   - Set up environment variables (see Environment Variables section)

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Client Configuration (for frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Configuration (for backend)
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
FIREBASE_DB_URL=https://your-project-id-default-rtdb.firebaseio.com/

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Development

1. **Start the Next.js development server**
   ```bash
   npm run dev
   ```

2. **For local API testing, start FastAPI server**
   ```bash
   uvicorn api.main:app --reload --port 8001
   ```

3. **Access the application**
   - Frontend: http://localhost:3000 (Landing page)
   - Dashboard: http://localhost:3000/dashboard (After login)
   - Device Setup: http://localhost:3000/device-setup (For ESP32 registration)
   - API Documentation: http://localhost:8001/docs

## 📡 API Endpoints

### Authentication API

**GET** `/api/auth/verify`
- Verify Firebase ID token
- Headers: `Authorization: Bearer <firebase_id_token>`
- Response: User information and verification status

### Records API

**POST** `/api/records/`
- Submit sensor data from devices
- Headers: `X-Device-Id`, `X-Device-Secret`
- Body: JSON payload with sensor data
- Response: `{"status": "ok", "key": "record_id"}`

**GET** `/api/records/`
- Get user's health records
- Headers: `Authorization: Bearer <firebase_id_token>`
- Query: `limit` (optional, default: 1000)
- Response: Array of health records

**POST** `/api/records/device/register`
- Register ESP32 device to user account
- Headers: `Authorization: Bearer <firebase_id_token>`
- Body: `{"device_id": "ESP32_001", "device_secret": "secret_key"}`
- Response: `{"status": "ok", "message": "Device registered successfully"}`

### Command API

**GET** `/api/command/{device_id}`
- Retrieve pending commands for a device
- Headers: `X-Device-Id`, `X-Device-Secret`
- Response: `{"action": "command_type", "pattern": [...]}`

**POST** `/api/command/`
- Send commands to devices
- Headers: `X-Device-Id`, `X-Device-Secret`
- Body: `{"action": "command_type", "pattern": [...]}`
- Response: `{"status": "ok", "device_id": "device_id"}`

## 🗄️ Database Structure

```
/
├── devices/
│   └── {device_id}/
│       └── secret: "device_secret"
├── records/
│   └── {record_id}/
│       ├── device_id: "device_id"
│       └── ...sensor_data
└── commands/
    └── {device_id}/
        ├── action: "command_type"
        └── pattern: [...]
```

## 🔐 Authentication

Devices authenticate using two headers:
- `X-Device-Id`: Unique identifier for the device
- `X-Device-Secret`: Secret key stored in Firebase under `/devices/{device_id}/secret`

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - `GOOGLE_APPLICATION_CREDENTIALS`: Content of serviceAccountKey.json
   - `FIREBASE_DB_URL`: Your Firebase database URL

### Manual Setup

The project includes `vercel.json` configuration for automatic deployment of both Next.js frontend and Python API.

## 📁 Project Structure

```
HealthSense-IoT/
├── api/                    # FastAPI backend
│   ├── main.py            # Main application and Firebase setup
│   ├── records.py         # Data collection endpoints
│   └── command.py         # Command management endpoints
├── pages/                 # Next.js pages
│   └── index.jsx         # Homepage with API test
├── package.json          # Node.js dependencies
├── requirements.txt      # Python dependencies
├── next.config.js        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── vercel.json           # Vercel deployment config
└── serviceAccountKey.json # Firebase credentials (gitignored)
```

## 🛠️ Development Guidelines

### Adding New API Endpoints

1. Create a new router file in `/api/`
2. Import and include the router in `api/main.py`
3. Use the `verify_device` dependency for authentication
4. Follow RESTful conventions

### Frontend Development

- Components should be placed in a `/components/` directory
- Use TypeScript for type safety
- Utilize Next.js API routes for server-side logic if needed

### Database Operations

- Use Firebase Admin SDK for server-side operations
- Structure data efficiently for real-time updates
- Implement proper error handling for database operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Authentication Errors**
   - Verify serviceAccountKey.json is correctly placed
   - Check environment variables are set properly

2. **CORS Issues**
   - Ensure CORS middleware is properly configured in FastAPI
   - Check if request headers are correctly set

3. **Deployment Issues**
   - Verify all environment variables are set in Vercel
   - Check build logs for dependency issues

### Getting Help

- Check the [Issues](../../issues) page for known problems
- Review API documentation at `/docs` endpoint
- Consult Firebase and Vercel documentation for platform-specific issues

## 📊 Monitoring

- Use Vercel Analytics for performance monitoring
- Check Firebase Console for database usage
- Monitor API endpoints through Vercel Functions logs