# Network Device Monitor
A full-stack application for monitoring network devices with a React frontend and FastAPI backend.

## Project Structure

```
Project_DYY/
├── Backend/                          # FastAPI backend
│   ├── .gitignore
│   ├── README.md
│   ├── requirements.txt
│   ├── venv/
│   └── src/
│       ├── __init__.py
│       ├── main.py
│       ├── __pycache__/
│
│       ├── config/
│       │   ├── __pycache__/
│       │   └── database.py
│
│       ├── controllers/
│       │   ├── __pycache__/
│       │   ├── control.py
│       │   ├── credentials.py
│       │   ├── devices.py
│       │   └── groups.py
│
│       ├── middleware/
│       │   ├── __pycache__/
│       │   └── cors.py
│
│       ├── models/
│       │   ├── __pycache__/
│       │   ├── device.py
│       │   └── groups.py
│
│       ├── repositories/
│       │   ├── __pycache__/
│       │   ├── credentials.py
│       │   ├── devices.py
│       │   └── groups.py
│
│       ├── routes/
│       │   ├── __pycache__/
│       │   ├── credentials.py
│       │   ├── devices.py
│       │   └── groups.py
│
│       ├── services/
│       │   ├── __pycache__/
│       │   ├── connection.py
│       │   ├── credentials.py
│       │   ├── device.py
│       │   ├── extraction.py
│       │   └── groups.py
│
│       ├── tests/
│       │   ├── __pycache__/
│       │   └── test1.py
│
│       └── utils/
│           ├── bandwidth.py
│           ├── datetime.py
│           ├── network_parsers.py
│           └── snmp.py
│
└── Frontend/                         # React frontend
    ├── package.json
    └── src/
        ├── App.tsx
        ├── App.css
        └── data.ts
```

## Setup Instructions

### Backend Setup

1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Ensure MongoDB is running on `localhost:27017`

5. Start the FastAPI server:
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

### Device Management
- **Add Devices**: Onboard network devices (Cisco, Juniper) via CLI or SNMP
- **Real-time Monitoring**: Fetch device data via CLI or SNMP protocols
- **Device Groups**: Organize devices into logical groups
- **Status Tracking**: Monitor device connectivity and operational status

### Data Collection
- **CLI Method**: Direct command-line access to devices (Cisco IOS/XR, Juniper JunOS)
- **SNMP Method**: SNMPv2c community-based monitoring for agentless data retrieval
- **Bandwidth Monitoring**: Real-time Mbps tracking on interfaces
- **Interface Details**: IP addresses, MAC addresses, status, and configuration

### Data Extraction
- **Cisco Devices**: Support for IOS and XR platforms
- **Juniper Devices**: Support for JunOS platform
- **CDPs Neighbors**: Discover connected devices via CDP protocol
- **Bandwidth Metrics**: Extract interface utilization, errors, and MTU information

### API Features
- **RESTful API**: Clean endpoint design for device and credential management
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Type Safety**: Full type hints throughout the codebase
- **Async Operations**: Asynchronous processing for improved performance

## API Endpoints

### Devices
- `GET /devices/get_all` - Get all devices with latest information
- `GET /devices/get_one_record?ip=<ip_address>` - Get specific device by IP address
- `POST /devices/refresh_one?ip=<ip_address>&method=<snmp|cli>` - Refresh device data manually
- `PUT /devices/start_program?device_interval=<seconds>&mbps_interval=<seconds>&method=<snmp|cli>` - Start periodic refresh loop

### Credentials
- `POST /credentials/add_device` - Add new device with credentials
- `GET /credentials/connection_details` - Get all device credentials
- `GET /credentials/get_one_cred?ip=<ip_address>` - Get specific device credentials

### Groups
- `POST /groups/add_group` - Create a new device group
- `POST /groups/assign_device_to_group?device_mac=<mac>&group_name=<name>` - Add device to group
- `GET /groups/get_all_groups` - Get all groups with devices
- `GET /groups/one_group?group_name=<name>` - Get specific group details
- `DELETE /groups/delete_device_from_group?device_mac=<mac>&group_name=<name>` - Remove device from group
- `PUT /groups/delete_group?group_name=<name>` - Delete entire group

## Add Device Payload

When onboarding a device via `POST /credentials/add_device`, send a JSON body:

```json
{
  "device_type": "cisco_ios",
  "ip": "192.168.1.10",
  "username": "admin",
  "password": "P@ssw0rd",
  "secret": "optional_enable_password",
  "snmp_password": "optional_community_string",
  "mac_address": "optional_device_mac"
}
```

**Supported device types:**
- `cisco_ios` - Cisco IOS devices
- `cisco_xr` - Cisco XR devices
- `juniper_junos` - Juniper JunOS devices

**Field Notes:**
- `secret`: Enable password (optional, required for some Cisco devices)
- `snmp_password`: SNMP community string (optional, required for SNMP monitoring)
- `mac_address`: Device MAC address (optional, auto-detected via CLI)

## Data Format

Device data structure stored in MongoDB:

```json
{
  "mac": "aabb.cc02.b000",
  "hostname": "device-name",
  "device_type": "cisco_ios",
  "status": "active",
  "interface": [
    {
      "interface": "Ethernet0/0",
      "ip_address": "192.168.1.1",
      "status": "up/up",
      "max_speed": 1000,
      "mbps_received": 45.2,
      "mbps_sent": 23.1,
      "bandwidth": {
        "bandwidth_max_mbps": 1000,
        "txload_percent": 15.5,
        "rxload_percent": 8.2,
        "input_rate_kbps": 125.5,
        "output_rate_kbps": 89.3,
        "mtu": 1500,
        "crc_errors": 0,
        "input_errors": 0,
        "output_errors": 0
      }
    }
  ],
  "info_neighbors": [
    {
      "device_id": "neighbor-device",
      "local_interface": "Ethernet0/0",
      "port_id": "Ethernet0/1"
    }
  ],
  "last updated at": "15-01-2025 14:30:45",
  "raw date": "2025-01-15T14:30:45.123456"
}
```

## Database

Uses MongoDB with three main collections:
- `devices_cred` - Device credentials for authentication
- `devices_info` - Current device information and monitoring data
- `archive` - Historical device records
- `groups` - Device grouping configuration

## Configuration

### Connection Settings
- MongoDB connection: `mongodb://localhost:27017/`
- Database name: `projectDYY`
- Default server selection timeout: 5000ms
- Connection timeout: 30 seconds

### Refresh Intervals
- Device info refresh: Configurable (default 3600 seconds / 1 hour)
- Bandwidth update: Configurable (default 0 / disabled)

## Troubleshooting

**CORS Issues**: The backend is configured for React development servers at `http://localhost:3000` and `http://127.0.0.1:3000`

**MongoDB Connection**: Ensure MongoDB is running:
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service (Linux/Mac)
brew services start mongodb-community

# Start MongoDB service (Windows)
net start MongoDB
```

**Device Connection Failures**:
- Verify device IP address is reachable
- Check username and password credentials
- Ensure device supports chosen method (CLI or SNMP)
- For SNMP: verify community string is correct

**Port Conflicts**:
- Backend uses port 8000
- Frontend uses port 3000
- MongoDB uses port 27017
- Ensure these ports are available

## Architecture

### Layered Design
1. **Routes** - FastAPI endpoints
2. **Controllers** - Business logic and orchestration
3. **Services** - Core functionality (connection, data extraction, credentials)
4. **Repositories** - Database operations
5. **Models** - Pydantic data models
6. **Utils** - Helper functions

### Error Handling
- Specific exception handling for network issues (timeout, authentication)
- Graceful degradation with fallback values
- Proper HTTP status codes (404 for not found, 500 for server errors)
- Comprehensive error logging with context

### Type Safety
- Full type hints on all functions and methods
- Optional types for nullable values
- Complex types for structured data
- Return type declarations on all methods

## Dependencies

See `requirements.txt`:
- `fastapi>=0.111.0` - Web framework
- `uvicorn[standard]>=0.23.2` - ASGI server
- `netmiko>=4.1.0` - Device CLI connectivity
- `pymongo>=4.6.1` - MongoDB driver
- `dnspython>=2.4.2` - DNS support
- `pysnmp>=7.1.21` - SNMP protocol

## Recent Improvements

- ✅ Comprehensive error handling throughout codebase
- ✅ Full type checking with type hints
- ✅ Proper HTTP error responses with status codes
- ✅ Graceful failure modes with fallback values
- ✅ Group management functionality
- ✅ Support for multiple device types (Cisco IOS/XR, Juniper)
- ✅ SNMP and CLI monitoring methods
- ✅ Bandwidth and interface detail extraction
- ✅ CDP neighbor discovery (CLI method)
