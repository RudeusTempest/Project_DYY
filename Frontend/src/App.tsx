import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { mockData } from './data';

// TypeScript interfaces
export interface NetworkInterface {
  interface: string;
  ip_address: string;
  status: string;
}

export interface NetworkDevice {
  Mac: string;
  hostname: string;
  interface: NetworkInterface[];
  "last updated at": string | { $date: string };
}

// API configuration
const API_BASE_URL = 'http://localhost:8000';

// Device Statistics Component - Now includes search and mock banner
const DeviceStatistics: React.FC<{ 
  devices: NetworkDevice[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  usingMockData: boolean;
  loading: boolean;
}> = ({ devices, searchTerm, onSearchChange, usingMockData, loading }) => {
  const stats = devices.reduce(
    (acc, device) => {
      acc.total++;
      
      const hasActivePort = device.interface.some(port => port.status.includes('up/up'));
      if (device.hostname === "Hostname not found") {
        acc.unauthorized++;
      } else if (hasActivePort) {
        acc.active++;
      } else {
        acc.inactive++;
      }
      
      return acc;
    },
    { total: 0, active: 0, inactive: 0, unauthorized: 0 }
  );

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <h3>Device Monitor</h3>
        
        {/* Mock Data Banner in Sidebar */}
        {usingMockData && !loading && (
          <div className="sidebar-mock-banner">
            <p>⚠️ Using mock data - API unavailable</p>
          </div>
        )}
        
        {/* Search Bar in Sidebar */}
        {!loading && (
          <div className="sidebar-search">
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        
        <div className="sidebar-separator"></div>
        
        <div className="stat-item total">
          <div className="stat-label">Total Devices</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        
        <div className="stat-item active">
          <div className="stat-label">Active</div>
          <div className="stat-value">{stats.active}</div>
        </div>
        
        <div className="stat-item inactive">
          <div className="stat-label">Inactive</div>
          <div className="stat-value">{stats.inactive}</div>
        </div>
        
        <div className="stat-item unauthorized">
          <div className="stat-label">Unauthorized</div>
          <div className="stat-value">{stats.unauthorized}</div>
        </div>
      </div>
    </div>
  );
};

// Device List Item Component
const DeviceListItem: React.FC<{ device: NetworkDevice; onClick: () => void }> = ({ device, onClick }) => {
  // Get primary IP address from first interface
  const primaryIP = device.interface[0]?.ip_address || 'No IP';
  
  // Count active/total interfaces
  const activeInterfaces = device.interface.filter(port => port.status.includes('up/up')).length;
  const totalInterfaces = device.interface.length;
  
  // Determine overall device status based on interfaces
  const getDeviceStatus = () => {
    const hasActivePort = device.interface.some(port => port.status.includes('up/up'));
    if (device.hostname === "Hostname not found") return 'Unauthorized';
    return hasActivePort ? 'Active' : 'Inactive';
  };

  const status = getDeviceStatus();

  // Format last updated date
  const formatLastUpdated = (lastUpdated: string | { $date: string }) => {
    if (typeof lastUpdated === 'string') {
      return lastUpdated;
    }
    return new Date(lastUpdated.$date).toLocaleString();
  };

  return (
    <div 
      onClick={onClick}
      className={`device-list-item ${status.toLowerCase()}`}
    >
      <div className="device-list-content">
        <div className="device-primary-info">
          <h3>{device.hostname}</h3>
          <div className="device-meta">
            <span className="ip-address">{primaryIP}</span>
            <span className="mac-address">{device.Mac}</span>
          </div>
        </div>
        
        <div className="device-secondary-info">
          <div className="interface-count">
            <span className="active-count">{activeInterfaces}</span>
            <span className="separator">/</span>
            <span className="total-count">{totalInterfaces}</span>
            <span className="label">Interfaces</span>
          </div>
          <div className="last-updated">
            Last updated: {formatLastUpdated(device["last updated at"])}
          </div>
        </div>
        
        <div className="device-status-info">
          <div className={`status ${status.toLowerCase()}`}>
            {status}
          </div>
        </div>
      </div>
    </div>
  );
};

// Port Status Component
const PortStatus: React.FC<{ interfaces: NetworkInterface[] }> = ({ interfaces }) => {
  return (
    <div className="port-status">
      <h4>Port Status</h4>
      <div className="ports-grid">
        {interfaces.map((port, index) => {
          const isActive = port.status.includes('up/up');
          const isUnauthorized = port.status.includes('not/authorized');
          
          let portClass = 'port-inactive';
          if (isActive) portClass = 'port-active';
          if (isUnauthorized) portClass = 'port-unauthorized';
          
          return (
            <div
              key={index}
              className={`port ${portClass}`}
              title={`${port.interface}: ${port.status}`}
            >
              {index + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Modal Component
const DeviceModal: React.FC<{ 
  device: NetworkDevice | null; 
  isOpen: boolean; 
  onClose: () => void 
}> = ({ device, isOpen, onClose }) => {
  if (!isOpen || !device) return null;

  // Format last updated date
  const formatLastUpdated = (lastUpdated: string | { $date: string }) => {
    if (typeof lastUpdated === 'string') {
      return lastUpdated;
    }
    return new Date(lastUpdated.$date).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`Copied: ${text}`);
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Device Details</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <div className="modal-body">
          <div className="device-details">
            <div className="detail-section">
              <h3>Device Information</h3>
              <div className="detail-item">
                <strong>Hostname:</strong> {device.hostname}
              </div>
              <div className="detail-item">
                <strong>MAC Address:</strong> {device.Mac}
                {device.Mac !== "Not found" && (
                  <button 
                    onClick={() => copyToClipboard(device.Mac)}
                    className="copy-button"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="detail-item">
                <strong>Last Updated:</strong> {formatLastUpdated(device["last updated at"])}
              </div>
            </div>
            
            <div className="detail-section">
              <h3>Interface Details</h3>
              <div className="interfaces">
                {device.interface.map((port, index) => (
                  <div key={index} className="interface-item">
                    <div><strong>{port.interface}:</strong></div>
                    <div>IP: {port.ip_address}
                      {port.ip_address !== "unassigned" && port.ip_address !== "This" && (
                        <button 
                          onClick={() => copyToClipboard(port.ip_address)}
                          className="copy-button"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                    <div>Status: {port.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <PortStatus interfaces={device.interface} />
        </div>
      </div>
    </div>
  );
};

// Main App Component
const NetworkDeviceMonitor: React.FC = () => {
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);

  // Fetch data from backend API
  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingMockData(false);
      
      const response = await fetch(`${API_BASE_URL}/get_all`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // The backend now returns the devices array directly
      const devicesData = Array.isArray(data) ? data : [];
      
      // If no devices found in database, use mock data
      if (devicesData.length === 0) {
        console.log('No devices found in database, using mock data');
        setDevices(mockData);
        setUsingMockData(true);
      } else {
        setDevices(devicesData);
        setUsingMockData(false);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      // On error, also fall back to mock data
      console.log('API request failed, using mock data');
      setDevices(mockData);
      setUsingMockData(true);
      setError(null); // Clear error since we're using mock data as fallback
    } finally {
      setLoading(false);
    }
  };

  // Load data from API on component mount
  useEffect(() => {
    fetchDevices();
  }, []);

  // Update header height dynamically
  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    const observer = new MutationObserver(updateHeight);
    if (headerRef.current) {
      observer.observe(headerRef.current, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      observer.disconnect();
    };
  }, []);

  const handleDeviceClick = (device: NetworkDevice) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  };

  // Filter devices based on search term
  const filteredDevices = devices.filter(device => 
    device.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.interface.some(port => 
      port.ip_address.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Handle refresh button click
  const handleRefresh = () => {
    fetchDevices();
  };

  return (
    <div className="app">
      <div className="app-header" ref={headerRef}>
        <div className="header-container">
          <div className="header-section">
            <h1>Network Device Monitor</h1>
            <button 
              onClick={handleRefresh} 
              className="refresh-button"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="app-layout">
        {/* Sidebar with Statistics, Search, and Mock Banner */}
        {!error && (
          <DeviceStatistics 
            devices={filteredDevices} 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            usingMockData={usingMockData}
            loading={loading}
          />
        )}
        
        {/* Main Content */}
        <div className="main-content">
          {/* Error Message */}
          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
              <button onClick={fetchDevices} className="retry-button">
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && !error && (
            <div className="loading-message">
              <p>Loading devices...</p>
            </div>
          )}

          {/* Device List */}
          {!loading && !error && (
            <div className="devices-list">
              {filteredDevices.map((device, index) => (
                <DeviceListItem
                  key={index}
                  device={device}
                  onClick={() => handleDeviceClick(device)}
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && filteredDevices.length === 0 && devices.length > 0 && (
            <div className="no-results">
              <p>No devices found matching your search.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal */}
      <DeviceModal
        device={selectedDevice}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default NetworkDeviceMonitor;