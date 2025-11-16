import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DeviceList from './components/DeviceList';
import DeviceModal from './components/Modal';
import AddDeviceModal, { AddDevicePayload } from './components/AddDeviceModal';
import { NetworkDevice, NetworkInterface, NeighborDevice } from './types';

// API configuration
const API_BASE_URL = 'http://localhost:8000';

const coerceString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
};

const coerceNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
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
    const normalized: NetworkInterface = {
      interface: name,
      ip_address: ip,
      status,
    };
    const maxSpeed = coerceNumber(
      (safe as any).max_speed ?? (safe as any).maxSpeed ?? (safe as any).speed
    );
    const mbpsReceived = coerceNumber(
      (safe as any).mbps_received ?? (safe as any).mbpsReceived
    );
    const mbpsSent = coerceNumber(
      (safe as any).mbps_sent ?? (safe as any).mbpsSent
    );

    if (maxSpeed !== null) {
      normalized.max_speed = maxSpeed;
    }
    if (mbpsReceived !== null) {
      normalized.mbps_received = mbpsReceived;
    }
    if (mbpsSent !== null) {
      normalized.mbps_sent = mbpsSent;
    }

    return normalized;
  });
};

const normalizeNeighbors = (neighbors: unknown): NeighborDevice[] => {
  if (!Array.isArray(neighbors)) return [];

  return neighbors
    .map((raw, idx) => {
      const safe = raw ?? {};
      const device_id = coerceString(
        (safe as any).device_id ?? (safe as any).deviceId,
        ''
      );
      const local_interface = coerceString(
        (safe as any).local_interface ?? (safe as any).localInterface,
        ''
      );
      const port_id = coerceString(
        (safe as any).port_id ?? (safe as any).portId,
        ''
      );

      if (!device_id && !local_interface && !port_id) {
        return null;
      }

      const neighbor: NeighborDevice = {
        device_id: device_id || `Neighbor ${idx + 1}`,
        local_interface: local_interface || 'Unknown interface',
      };
      if (port_id) {
        neighbor.port_id = port_id;
      }
      return neighbor;
    })
    .filter((neighbor): neighbor is NeighborDevice => Boolean(neighbor));
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

  const rawDateSource =
    source['raw date'] ??
    (source as any).raw_date ??
    (source as any).rawDate;

  let rawDate: string | { $date: string } | undefined;
  if (typeof rawDateSource === 'string') {
    rawDate = rawDateSource;
  } else if (
    rawDateSource &&
    typeof rawDateSource === 'object' &&
    typeof (rawDateSource as any).$date === 'string'
  ) {
    rawDate = { $date: (rawDateSource as any).$date };
  }

  const neighbors = normalizeNeighbors(
    (source as any).info_neighbors ??
      (source as any).neighbors ??
      (source as any).cdp_neighbors ??
      (source as any).lldp_neighbors
  );

  const normalized: NetworkDevice = {
    Mac: mac,
    mac,
    hostname,
    interface: normalizeInterfaces(source.interface),
    'last updated at': lastUpdated,
  };

  if (rawDate) {
    normalized['raw date'] = rawDate;
  }
  if (neighbors.length) {
    normalized.info_neighbors = neighbors;
  }

  return normalized;
};

const normalizeDeviceCollection = (input: unknown): NetworkDevice[] => {
  if (!Array.isArray(input)) return [];
  return input.map(normalizeDevice);
};

const requestDevices = async (): Promise<NetworkDevice[]> => {
  console.log('[API] GET /devices/get_all - fetching latest devices');
  const response = await fetch(`${API_BASE_URL}/devices/get_all`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('[API] GET /devices/get_all - raw payload:', data);

  const devicesData = normalizeDeviceCollection(data);
  console.log(`[API] GET /devices/get_all - received ${devicesData.length} records`);
  return devicesData;
};

const findDeviceByIdentifier = (collection: NetworkDevice[], identifier: string): NetworkDevice | null => {
  const target = typeof identifier === 'string' ? identifier.trim().toLowerCase() : '';
  if (!target) {
    return null;
  }

  const matches = (value: unknown) => {
    if (typeof value !== 'string') return false;
    return value.trim().toLowerCase() === target;
  };

  return (
    collection.find((device) => {
      const macMatch = matches(device?.Mac) || matches((device as any)?.mac);
      const hostnameMatch = matches(device?.hostname);
      const interfaceMatch = Array.isArray(device?.interface)
        ? device.interface.some((port: any) => matches(port?.ip_address))
        : false;
      return macMatch || hostnameMatch || interfaceMatch;
    }) ?? null
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
  const [updatingIp, setUpdatingIp] = useState<string | null>(null);
  const [credentialIps, setCredentialIps] = useState<Set<string>>(new Set());
  const [isAddDeviceModalOpen, setAddDeviceModalOpen] = useState(false);
  
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

  const openAddDeviceModal = () => setAddDeviceModalOpen(true);
  const closeAddDeviceModal = () => setAddDeviceModalOpen(false);

  // Fetch data from backend API or use mock data
  const fetchDevices = useCallback(async (): Promise<NetworkDevice[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const devicesData = await requestDevices();
      if (devicesData.length === 0) {
        console.log('No devices found in database');
        setDevices([]);
      } else {
        setDevices(devicesData);
      }
      return devicesData;
    } catch (err) {
      console.error('Error fetching devices:', err);
      setDevices([]);
      setError('Unable to load devices from API.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch connection credentials IPs
  const fetchCredentialIps = useCallback(async () => {
    try {
      console.log('[API] GET /credentials/connection_details - fetching credential IPs');
      const res = await fetch(`${API_BASE_URL}/credentials/connection_details`);
      if (!res.ok) return;
      const data = await res.json();
      console.log('[API] GET /credentials/connection_details - raw payload:', data);

      const toIpList = (payload: unknown): string[] => {
        if (Array.isArray(payload)) {
          return payload
            .map((cred: any) => (typeof cred?.ip === 'string' ? cred.ip.trim() : ''))
            .filter((ip): ip is string => Boolean(ip));
        }
        if (Array.isArray((payload as any)?.details)) {
          return (payload as any).details
            .map((cred: any) => (typeof cred?.ip === 'string' ? cred.ip.trim() : ''))
            .filter((ip: string) => Boolean(ip));
        }
        return [];
      };

      const ips = toIpList(data);
      console.log(`[API] GET /credentials/connection_details - received ${ips.length} credential IP(s)`);
      setCredentialIps(new Set(ips));
    } catch {
      // ignore, keep empty set
    }
  }, []);

  // Load data from API on component mount 
  useEffect(() => {
    fetchDevices();
    fetchCredentialIps();
  }, [fetchDevices, fetchCredentialIps]);

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
  const filteredDevices = useMemo(() => {
    const term = toLower(searchTerm);
    if (term.length === 0) {
      return devices;
    }
    return devices.filter((device: any) => {
      const hostname = toLower(device?.hostname);
      const interfaces = Array.isArray(device?.interface) ? device.interface : [];
      const hostMatch = hostname.includes(term);
      const ipMatch = interfaces.some((port: any) => toLower(port?.ip_address).includes(term));
      return hostMatch || ipMatch;
    });
  }, [devices, searchTerm]);

  const hasDevices = devices.length > 0;
  const showDeviceList = !loading && !error && hasDevices;
  const showEmptyState = !loading && !error && !hasDevices;
  const showSearchNoResults = !loading && !error && hasDevices && filteredDevices.length === 0;

  // Handle refresh button click
  const handleRefresh = () => {
    fetchDevices();
  };

  const handleAddDeviceSubmit = useCallback(
    async (payload: AddDevicePayload) => {
      const sanitizedPayload: AddDevicePayload = {
        device_type: payload.device_type,
        ip: payload.ip,
        username: payload.username,
        password: payload.password,
        ...(payload.secret ? { secret: payload.secret } : {}),
      };

      console.log('[API] POST /credentials/add_device - submitting payload:', sanitizedPayload);
      const response = await fetch(`${API_BASE_URL}/credentials/add_device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedPayload),
      });

      let rawResponse: string | null = null;
      try {
        rawResponse = await response.clone().text();
        if (rawResponse) {
          console.log('[API] POST /credentials/add_device - response payload:', rawResponse);
        }
      } catch {
        rawResponse = null;
      }

      if (!response.ok) {
        let errorMessage = `Failed to add device (status ${response.status})`;
        if (rawResponse) {
          try {
            const parsed = JSON.parse(rawResponse);
            if (typeof parsed === 'string' && parsed.trim()) {
              errorMessage = parsed.trim();
            } else if (parsed && typeof parsed === 'object') {
              if (typeof (parsed as any).detail === 'string') {
                errorMessage = (parsed as any).detail;
              } else if (Array.isArray((parsed as any).detail) && (parsed as any).detail.length > 0) {
                const firstDetail = (parsed as any).detail[0];
                if (typeof firstDetail?.msg === 'string') {
                  errorMessage = firstDetail.msg;
                }
              }
            }
          } catch {
            errorMessage = rawResponse;
          }
        }
        throw new Error(errorMessage);
      }

      await fetchDevices();
      await fetchCredentialIps();
    },
    [fetchCredentialIps, fetchDevices]
  );

  // Update a single device by IP
  const handleUpdateDevice = async (ip: string) => {
    const sanitizedIp = typeof ip === 'string' ? ip.trim() : '';
    if (!sanitizedIp || sanitizedIp.toLowerCase() === 'no ip') {
      console.warn('[API] POST /devices/refresh_one - skipping update, no valid IP provided');
      return;
    }

    try {
      setUpdatingIp(sanitizedIp);
      const updateUrl = `${API_BASE_URL}/devices/refresh_one?ip=${encodeURIComponent(sanitizedIp)}`;
      console.log(`[API] POST /devices/refresh_one - updating device ip=${sanitizedIp}`);
      const updateResponse = await fetch(updateUrl, {
        method: 'POST',
      });
      if (!updateResponse.ok) {
        console.warn(
          `[API] POST /devices/refresh_one - request failed with status ${updateResponse.status} for ip=${sanitizedIp}`
        );
        throw new Error(`HTTP error! status: ${updateResponse.status}`);
      }

      let updatePayload: unknown = null;
      try {
        updatePayload = await updateResponse.clone().json();
        console.log(`[API] POST /devices/refresh_one - response payload for ip=${sanitizedIp}:`, updatePayload);
      } catch {
        console.log(`[API] POST /devices/refresh_one - no JSON response for ip=${sanitizedIp}`);
      }

      console.log(`[API] POST /devices/refresh_one - update triggered for ip=${sanitizedIp}, refreshing device list`);
      const latestDevices = await requestDevices();
      setDevices(latestDevices);
      setError(null);

      const updatedDevice = findDeviceByIdentifier(latestDevices, sanitizedIp);
      if (!updatedDevice) {
        console.warn(`[API] Device not found after refresh for identifier "${sanitizedIp}"`);
        return;
      }

      setSelectedDevice((current) => {
        if (!current) return current;
        const sameMac = current.Mac && updatedDevice.Mac && current.Mac === updatedDevice.Mac;
        const sameHostname = current.hostname && updatedDevice.hostname && current.hostname === updatedDevice.hostname;
        return sameMac || sameHostname ? updatedDevice : current;
      });
    } catch (err) {
      console.error('Error updating device:', err);
      console.log('[API] GET /devices/get_all - refetching after update failure');
      await fetchDevices();
    } finally {
      setUpdatingIp(null);
    }
  };

  return (
    <div className="app">
      <Header
        loading={loading}
        onRefresh={handleRefresh}
        onAddDevice={openAddDeviceModal}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="app-layout">
        {!error && (
          <Sidebar
            devices={filteredDevices}
            loading={loading}
          />
        )}

        <div className="main-content">
          {error && (
            <div className="status-panel api-error">
              <h3>API unavailable</h3>
              <p>{error}</p>
              <button onClick={fetchDevices} className="retry-button">Try again</button>
            </div>
          )}

          {loading && !error && (
            <div className="loading-message">
              <p>Loading devices...</p>
            </div>
          )}

          {showEmptyState && (
            <div className="status-panel empty-state">
              <h3>No devices found</h3>
              <p>We couldn’t load any devices from the API. Try refreshing to fetch the latest inventory.</p>
              <button onClick={fetchDevices} className="secondary-action-button">Refresh</button>
            </div>
          )}

          {showDeviceList && (
            <DeviceList
              devices={filteredDevices}
              onDeviceClick={handleDeviceClick}
              onUpdateDevice={handleUpdateDevice}
              updatingIp={updatingIp}
              credentialIps={credentialIps}
            />
          )}

          {showSearchNoResults && (
            <div className="no-results">
              <p>No devices found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      <AddDeviceModal
        isOpen={isAddDeviceModalOpen}
        onClose={closeAddDeviceModal}
        onSubmit={handleAddDeviceSubmit}
      />
      <DeviceModal device={selectedDevice} isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default NetworkDeviceMonitor;
