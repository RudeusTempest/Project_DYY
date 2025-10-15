import React, { useState, useEffect } from 'react';
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
  const [refreshingIp, setRefreshingIp] = useState<string | null>(null);
  const [credentialIps, setCredentialIps] = useState<Set<string>>(new Set());
  
  // Theme (light/dark)
  const getInitialTheme = (): 'light' | 'dark' => {
    try {
      const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  };
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  

  // Fetch data from backend API or use mock data
  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingMockData(false);

      const response = await fetch(`${API_BASE_URL}/devices/get_all`);

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

  // Fetch connection credentials IPs
  const fetchCredentialIps = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/credentials/connection_details`);
      if (!res.ok) return;
      const data = await res.json();
      const ips: string[] = Array.isArray(data?.details) ? data.details.map((c: any) => c?.ip).filter((v: any) => typeof v === 'string') : [];
      setCredentialIps(new Set(ips));
    } catch {
      // ignore, keep empty set
    }
  };

  // Load data from API on component mount 
  useEffect(() => {
    fetchDevices();
    fetchCredentialIps();
  }, []);

  // Removed dynamic header height update effect as unnecessary

  const handleDeviceClick = (device: NetworkDevice) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  };

  // Filter devices based on search term
  const toLower = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v)).toLowerCase();
  const filteredDevices = devices.filter((device: any) => {
    const term = toLower(searchTerm);
    const hostname = toLower(device?.hostname);
    const interfaces = Array.isArray(device?.interface) ? device.interface : [];
    const hostMatch = hostname.includes(term);
    const ipMatch = interfaces.some((port: any) => toLower(port?.ip_address).includes(term));
    return hostMatch || ipMatch;
  });

  // Handle refresh button click
  const handleRefresh = () => {
    fetchDevices();
  };

  // Refresh a single device by IP
  const handleRefreshDevice = async (ip: string) => {
    try {
      setRefreshingIp(ip);
      await fetch(`${API_BASE_URL}/devices/refresh_one?ip=${encodeURIComponent(ip)}`, {
        method: 'POST',
      });
      // Re-fetch devices to reflect updated data
      await fetchDevices();
    } catch (err) {
      console.error('Error refreshing device:', err);
    } finally {
      setRefreshingIp(null);
    }
  };

  return (
    <div className="app">
      <Header
        loading={loading}
        onRefresh={handleRefresh}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        theme={theme}
        onToggleTheme={toggleTheme}
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
            <DeviceList
              devices={filteredDevices}
              onDeviceClick={handleDeviceClick}
              onRefreshDevice={handleRefreshDevice}
              refreshingIp={refreshingIp}
              credentialIps={credentialIps}
            />
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
