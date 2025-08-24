import React, { useState, useEffect } from 'react';
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


// Device Card Component
const DeviceCard: React.FC<{ device: NetworkDevice; onClick: () => void }> = ({ device, onClick }) => {
  // Get primary IP address from first interface
  const primaryIP = device.interface[0]?.ip_address || 'No IP';
  
  // Determine overall device status based on interfaces
  const getDeviceStatus = () => {
    const hasActivePort = device.interface.some(port => port.status.includes('up/up'));
    if (device.hostname === "Hostname not found") return 'Unauthorized';
    return hasActivePort ? 'Active' : 'Inactive';
  };

  const status = getDeviceStatus();

  return (
    <div 
      onClick={onClick}
      className={`device-card ${status.toLowerCase()}`}
    >
      <div className="device-info">
        <div>
          <h3>{device.hostname}</h3>
          <p>IP: {primaryIP}</p>
        </div>
        <div className="status-badge">
          <span className={`status ${status.toLowerCase()}`}>
            {status}
          </span>
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

  // Load mock data (simulating API call)
  useEffect(() => {
    setDevices(mockData);
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

  return (
    <div className="app">
      <div className="container">
        <h1>Network Device Monitor</h1>
        
        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by hostname or IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Device Grid */}
        <div className="devices-grid">
          {filteredDevices.map((device, index) => (
            <DeviceCard
              key={index}
              device={device}
              onClick={() => handleDeviceClick(device)}
            />
          ))}
        </div>

        {/* No Results */}
        {filteredDevices.length === 0 && (
          <div className="no-results">
            <p>No devices found matching your search.</p>
          </div>
        )}

        {/* Modal */}
        <DeviceModal
          device={selectedDevice}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      </div>
    </div>
  );
};

export default NetworkDeviceMonitor;