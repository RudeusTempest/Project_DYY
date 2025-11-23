# Network Device Monitor
A full-stack application for monitoring network devices with a React frontend and FastAPI backend.


## Project Structure

```
Project_DYY/
├── Backend/           # FastAPI backend
│   └── app/
│       ├── A_Connection.py
│       ├── B_Extraction.py
│       ├── C_Database.py
│       ├── D_FastAPI.py
│       └── Main.py
└── Frontend/          # React frontend
    ├── src/
    │   ├── App.tsx
    │   ├── App.css
    │   └── data.ts
    └── package.json
```


## Setup Instructions


### Backend Setup

1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Install Python dependencies (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI server:
   ```bash
   uvicorn src.main:app --reload
   ```

   The backend will run on `http://localhost:8000`


### Frontend Setup

1. Navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`


## Features

- **Real-time Data**: The frontend now fetches real data from the MongoDB database via the FastAPI backend
- **Device Monitoring**: View network devices with their interface details, IP addresses, and status
- **Search Functionality**: Search devices by hostname or IP address
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Proper error handling and loading states
- **Refresh Capability**: Manual refresh button to update data


## API Endpoints

- `GET /` - Returns all network devices from the database
- `GET /connection_details` - Returns device connection details
- `POST /add_device` - Adds a new device to the database (supports optional `secret` and `snmp_password` fields)

### Add Device Payload

When onboarding a device via `POST /credentials/add_device`, send a JSON body containing:

```json
{
  "device_type": "cisco_ios",
  "ip": "192.168.1.10",
  "username": "admin",
  "password": "P@ssw0rd",
  "secret": "optional enable password",
  "snmp_password": "optional community string"
}
```

The backend treats `secret` and `snmp_password` as optional—omit these fields if the device does not require them.


## Data Format

The application expects network device data in the following format:

```json
{
  "Mac": "aabb.cc02.b000",
  "hostname": "device-name",
  "interface": [
    {
      "interface": "Ethernet0/0",
      "ip_address": "192.168.1.1",
      "status": "up/up"
    }
  ],
  "last updated at": "2025-01-01 12:00:00"
}
```


## Troubleshooting

1. **CORS Issues**: The backend includes CORS middleware configured for React development servers
2. **Database Connection**: Ensure MongoDB is running and accessible
3. **Port Conflicts**: Make sure ports 8000 (backend) and 3000 (frontend) are available


## Recent Changes

- Replaced mock data with real API calls to the backend
- Added loading states and error handling
- Implemented refresh functionality
- Added CORS support for cross-origin requests
- Improved data format handling between frontend and backend
