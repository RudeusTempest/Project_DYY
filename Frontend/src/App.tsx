import React, { useState, useEffect } from 'react';
import './App.css';
import { mockData } from './data';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DeviceList from './components/DeviceList';
import DeviceModal from './components/Modal';
import { NetworkDevice, NetworkInterface } from './types';

// API configuration
const API_BASE_URL = 'http://localhost:8000';

const coerceString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
};

const normalizeInterfaces = (interfaces: unknown): NetworkInterface[] => {
  if (!Array.isArray(interfaces)) return [];
  return interfaces.map((raw, idx) => {
    const safe = raw ?? {};
    const name = coerceString(
      (safe as any).interface ?? (safe as any).Interface,
      `Port ${idx + 1}`
    );
    const ip = coerceString(
      (safe as any).ip_address ?? (safe as any).IP_Address ?? (safe as any).ip,
      'unassigned'
    );
    const status = coerceString(
      (safe as any).status ?? (safe as any).Status,
      'unknown'
    );
    return {
      interface: name,
      ip_address: ip,
      status,
    };
  });
};

const normalizeDevice = (raw: unknown): NetworkDevice => {
  const source = (raw ?? {}) as Record<string, unknown>;
  const mac = coerceString(source.Mac ?? source.mac, 'Not found');
  const hostname = coerceString(source.hostname, 'Hostname not found');
  const lastUpdatedSource =
    source['last updated at'] ??
    source.last_updated_at ??
    source.lastUpdated ??
    source.last_update;

  let lastUpdated: string | { $date: string };
  if (typeof lastUpdatedSource === 'string') {
    lastUpdated = lastUpdatedSource;
  } else if (
    lastUpdatedSource &&
    typeof lastUpdatedSource === 'object' &&
    typeof (lastUpdatedSource as any).$date === 'string'
  ) {
    lastUpdated = { $date: (lastUpdatedSource as any).$date };
  } else {
    lastUpdated = 'Unknown';
  }

  return {
    Mac: mac,
    mac,
    hostname,
    interface: normalizeInterfaces(source.interface),
    'last updated at': lastUpdated,
  };
};

const normalizeDeviceCollection = (input: unknown): NetworkDevice[] => {
  if (!Array.isArray(input)) return [];
  return input.map(normalizeDevice);
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

      console.log('[API] GET /devices/get_all - fetching latest devices');
      const response = await fetch(`${API_BASE_URL}/devices/get_all`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[API] GET /devices/get_all - raw payload:', data);

      const devicesData = normalizeDeviceCollection(data);

      console.log(`[API] GET /devices/get_all - received ${devicesData.length} records`);
      if (devicesData.length === 0) {
        console.log('No devices found in database, using mock data');
        setDevices(normalizeDeviceCollection(mockData));
        setUsingMockData(true);
      } else {
        setDevices(devicesData);
        setUsingMockData(false);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      console.log('API request failed, using mock data');
      setDevices(normalizeDeviceCollection(mockData));
      setUsingMockData(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch connection credentials IPs
  const fetchCredentialIps = async () => {
    try {
      console.log('[API] GET /credentials/connection_details - fetching credential IPs');
      const res = await fetch(`${API_BASE_URL}/credentials/connection_details`);
      if (!res.ok) return;
      const data = await res.json();
      console.log('[API] GET /credentials/connection_details - raw payload:', data);
      const ips: string[] = Array.isArray(data?.details) ? data.details.map((c: any) => c?.ip).filter((v: any) => typeof v === 'string') : [];
      console.log(`[API] GET /credentials/connection_details - received ${ips.length} credential IP(s)`);
      setCredentialIps(new Set(ips));
    } catch {
      // ignore, keep empty set
    }
  };

  const fetchDeviceRecord = async (ip: string): Promise<NetworkDevice | null> => {
    try {
      console.log(`[API] GET /devices/get_one_record - fetching device record for ip=${ip}`);
      const response = await fetch(`${API_BASE_URL}/devices/get_one_record?ip=${encodeURIComponent(ip)}`);
      if (!response.ok) {
        console.warn(`[API] GET /devices/get_one_record - request failed with status ${response.status} for ip=${ip}`);
        return null;
      }
      const data = await response.json();
      console.log(`[API] GET /devices/get_one_record - raw payload for ip=${ip}:`, data);
      const record = Array.isArray(data) ? data[0] : data;
      if (!record) {
        console.warn(`[API] GET /devices/get_one_record - no record returned for ip=${ip}`);
        return null;
      }
      console.log(`[API] GET /devices/get_one_record - received record for ip=${ip}`);
      return normalizeDevice(record);
    } catch (err) {
      console.error('Error fetching device record:', err);
      return null;
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
      const refreshUrl = `${API_BASE_URL}/devices/refresh_one?ip=${encodeURIComponent(ip)}`;
      console.log(`[API] POST /devices/refresh_one - refreshing device ip=${ip}`);
      const refreshResponse = await fetch(refreshUrl, {
        method: 'POST',
      });
      if (!refreshResponse.ok) {
        console.warn(`[API] POST /devices/refresh_one - request failed with status ${refreshResponse.status} for ip=${ip}`);
        throw new Error(`HTTP error! status: ${refreshResponse.status}`);
      }

      let refreshPayload: unknown = null;
      try {
        refreshPayload = await refreshResponse.clone().json();
        console.log(`[API] POST /devices/refresh_one - response payload for ip=${ip}:`, refreshPayload);
      } catch {
        console.log(`[API] POST /devices/refresh_one - no JSON response for ip=${ip}`);
      }

      console.log(`[API] POST /devices/refresh_one - refresh triggered for ip=${ip}, fetching latest record`);
      const updatedDevice = await fetchDeviceRecord(ip);

      if (!updatedDevice) {
        console.log(`[API] GET /devices/get_one_record - falling back to full fetch after refresh for ip=${ip}`);
        await fetchDevices();
      } else {
        setDevices((prev) => {
          const next = [...prev];
          const index = next.findIndex((device) => {
            const sameMac = device?.Mac && updatedDevice.Mac && device.Mac === updatedDevice.Mac;
            const sameHostname = device?.hostname && updatedDevice.hostname && device.hostname === updatedDevice.hostname;
            return sameMac || sameHostname;
          });

          if (index >= 0) {
            next[index] = updatedDevice;
          } else {
            next.push(updatedDevice);
          }

          return next;
        });

        setUsingMockData(false);

        setSelectedDevice((current) => {
          if (!current) return current;
          const sameMac = current.Mac && updatedDevice.Mac && current.Mac === updatedDevice.Mac;
          const sameHostname = current.hostname && updatedDevice.hostname && current.hostname === updatedDevice.hostname;
          return sameMac || sameHostname ? updatedDevice : current;
        });
      }
    } catch (err) {
      console.error('Error refreshing device:', err);
      console.log('[API] GET /devices/get_all - refetching after refresh failure');
      await fetchDevices();
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
