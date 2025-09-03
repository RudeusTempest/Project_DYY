import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { mockData } from './data';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DeviceList from './components/DeviceList';
import DeviceModal from './components/Modal';
import { NetworkDevice } from './types';

// API configuration
const API_BASE_URL = 'http://localhost:8000';

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

      const devicesData = Array.isArray(data) ? data : [];

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
      console.log('API request failed, using mock data');
      setDevices(mockData);
      setUsingMockData(true);
      setError(null);
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
    device.interface.some(port => port.ip_address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle refresh button click
  const handleRefresh = () => {
    fetchDevices();
  };

  return (
    <div className="app">
      <Header
        ref={headerRef}
        loading={loading}
        onRefresh={handleRefresh}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="app-layout">
        {!error && (
          <Sidebar
            devices={filteredDevices}
            usingMockData={usingMockData}
            loading={loading}
          />
        )}

        <div className="main-content">
          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
              <button onClick={fetchDevices} className="retry-button">Retry</button>
            </div>
          )}

          {loading && !error && (
            <div className="loading-message">
              <p>Loading devices...</p>
            </div>
          )}

          {!loading && !error && (
            <DeviceList devices={filteredDevices} onDeviceClick={handleDeviceClick} />
          )}

          {!loading && !error && filteredDevices.length === 0 && devices.length > 0 && (
            <div className="no-results">
              <p>No devices found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      <DeviceModal device={selectedDevice} isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default NetworkDeviceMonitor;
