import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DeviceList, { type DeviceViewMode } from './components/DeviceList';
import DeviceDetailsModal from './components/DeviceDetailsModal';
import SettingsModal from './components/SettingsModal';
import AddDeviceModal from './components/AddDeviceModal';
import {
  DeviceRecord,
  fetchAllDevices,
  fetchDeviceByIp,
  refreshDeviceByIp,
  deriveDeviceStatus,
  type DeviceStatus,
  ProtocolMethod,
  startProgram,
} from './api/devices';
import {
  CredentialRecord,
  fetchAllCredentials,
} from './api/credentials';
import { mockDevices, mockCredentials } from './mockData';
import { ThemeProvider, useTheme } from './theme/ThemeContext';

const AppContent: React.FC = () => {
  const START_PROGRAM_DEVICE_INTERVAL = 3600;
  const START_PROGRAM_MBPS_INTERVAL = 0;
  const START_PROGRAM_METHOD: ProtocolMethod = 'snmp';

  // Stores the full list of devices returned by GET /devices/get_all.
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  // Stores the credential objects returned by GET /credentials/connection_details.
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  // When true, the UI shows bundled mock data instead of hitting the backend.
  const [useMockData, setUseMockData] = useState(false);
  // Search text typed in the header; we use it to filter the list in-memory.
  const [searchTerm, setSearchTerm] = useState('');
  // Currently selected device for the DeviceDetailsModal.
  const [selectedDevice, setSelectedDevice] = useState<DeviceRecord | null>(
    null
  );
  // Controls whether the settings modal is visible.
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Controls the add-device modal visibility.
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  // Loading + error states for the initial fetch.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track a manual refresh triggered by the header button.
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Protocol preference for the Update button (default SNMP as requested).
  const [protocol, setProtocol] = useState<ProtocolMethod>('snmp');
  // Per-device protocol overrides, keyed by IP.
  const [deviceProtocolOverrides, setDeviceProtocolOverrides] = useState<
    Record<string, ProtocolMethod>
  >({});
  // Preferred view for device list (gallery default).
  const [viewMode, setViewMode] = useState<DeviceViewMode>('gallery');
  // Current sidebar status filter; "all" shows every device.
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');

  const { theme } = useTheme();

  const applyMockData = useCallback(() => {
    setDevices(mockDevices);
    setCredentials(mockCredentials);
  }, []);

  // Fetch devices and credentials at the same time when the app starts.
  const reloadDevicesAndCredentials = useCallback(
    async (forceMock = useMockData) => {
      if (forceMock) {
        applyMockData();
        setError('Showing mock data (backend calls disabled).');
        return;
      }

      const [deviceData, credentialData] = await Promise.all([
        fetchAllDevices().catch(() => null),
        fetchAllCredentials().catch(() => null),
      ]);

      const hasDevices = Array.isArray(deviceData) && deviceData.length > 0;
      const hasCredentials =
        Array.isArray(credentialData) && credentialData.length > 0;

      if (hasDevices && hasCredentials) {
        setDevices(deviceData);
        setCredentials(credentialData);
        setError(null);
        return;
      }

      applyMockData();
      setUseMockData(true);
      setError(
        'Using mock data because the API is unavailable or returned no records.'
      );
    },
    [useMockData, applyMockData]
  );

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await reloadDevicesAndCredentials();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load initial data.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [reloadDevicesAndCredentials]);

  const handleGlobalRefresh = useCallback(async () => {
    setError(null);
    setIsRefreshing(true);
    try {
      await reloadDevicesAndCredentials();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to refresh devices.'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [reloadDevicesAndCredentials]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    startProgram(
      START_PROGRAM_DEVICE_INTERVAL,
      START_PROGRAM_MBPS_INTERVAL,
      START_PROGRAM_METHOD
    ).catch((startError) => {
      console.warn('start_program call failed or timed out', startError);
    });
  }, [
    START_PROGRAM_DEVICE_INTERVAL,
    START_PROGRAM_MBPS_INTERVAL,
    START_PROGRAM_METHOD,
  ]);

  // Quick lookup by IP so components can easily grab credential info.
  const credentialMap = useMemo(() => {
    const map: Record<string, CredentialRecord> = {};
    credentials.forEach((credential) => {
      if (credential.ip) {
        map[credential.ip] = credential;
      }
    });
    return map;
  }, [credentials]);

  // Helper to resolve which IP we should associate with this device.
  const resolveDeviceIp = useCallback(
    (device: DeviceRecord, credential?: CredentialRecord) =>
      device.primaryIp || credential?.ip,
    []
  );

  const knownDeviceIps = useMemo(() => {
    const ipSet = new Set<string>();
    devices.forEach((device) => {
      if (device.primaryIp) {
        ipSet.add(device.primaryIp);
      }
      device.interfaces.forEach((iface) => {
        if (
          typeof iface.ip_address === 'string' &&
          iface.ip_address.toLowerCase() !== 'unassigned' &&
          iface.ip_address.toLowerCase() !== 'unknown'
        ) {
          ipSet.add(iface.ip_address);
        }
      });
    });
    return ipSet;
  }, [devices]);

  const pendingCredentials = useMemo(
    () => credentials.filter((credential) => credential.ip && !knownDeviceIps.has(credential.ip)),
    [credentials, knownDeviceIps]
  );

  const pendingDevices = useMemo(
    () =>
      pendingCredentials.map((credential) => ({
        mac: `pending-${credential.ip}`,
        hostname: credential.device_type || 'Credentials saved',
        interfaces: [],
        neighbors: [],
        lastUpdatedAt: 'Waiting for first poll',
        primaryIp: credential.ip,
      })),
    [pendingCredentials]
  );

  const pendingIpLookup = useMemo(() => {
    const lookup: Record<string, boolean> = {};
    pendingCredentials.forEach((credential) => {
      if (credential.ip) {
        lookup[credential.ip] = true;
      }
    });
    return lookup;
  }, [pendingCredentials]);

  const displayDevices = useMemo(
    () => [...devices, ...pendingDevices],
    [devices, pendingDevices]
  );

  // Determine which protocol should be used for a given device (override or global).
  const getProtocolForDevice = useCallback(
    (device: DeviceRecord, credential?: CredentialRecord): ProtocolMethod => {
      const deviceIp = resolveDeviceIp(device, credential);
      if (deviceIp && deviceProtocolOverrides[deviceIp]) {
        return deviceProtocolOverrides[deviceIp];
      }
      return protocol;
    },
    [deviceProtocolOverrides, protocol, resolveDeviceIp]
  );

  const handleDeviceProtocolChange = useCallback(
    (
      device: DeviceRecord,
      credential: CredentialRecord | undefined,
      method: ProtocolMethod
    ) => {
      const deviceIp = resolveDeviceIp(device, credential);
      if (!deviceIp) {
        return;
      }
      setDeviceProtocolOverrides((previous) => ({
        ...previous,
        [deviceIp]: method,
      }));
    },
    [resolveDeviceIp]
  );

  // Filtering happens entirely in memory – no extra backend calls.
  const filteredDevices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return displayDevices.filter((device) => {
      if (statusFilter !== 'all' && deriveDeviceStatus(device) !== statusFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      const hostnameMatch = device.hostname.toLowerCase().includes(term);
      const ipMatch = device.primaryIp
        ? device.primaryIp.toLowerCase().includes(term)
        : false;
      return hostnameMatch || ipMatch;
    });
  }, [displayDevices, searchTerm, statusFilter]);

  // Sidebar counts update automatically whenever the devices array changes.
  const sidebarCounts = useMemo(() => {
    const counts = {
      total: displayDevices.length,
      active: 0,
      inactive: 0,
      unauthorized: 0,
    };

    displayDevices.forEach((device) => {
      const status = deriveDeviceStatus(device);
      if (status === 'active') {
        counts.active += 1;
      } else if (status === 'inactive') {
        counts.inactive += 1;
      } else {
        counts.unauthorized += 1;
      }
    });

    return counts;
  }, [displayDevices]);

  const handleStatusFilterChange = useCallback(
    (status: DeviceStatus | 'all') => {
      setStatusFilter((current) => (current === status ? 'all' : status));
    },
    []
  );

  const handleDeviceRefresh = useCallback(
    async (ip: string) => {
      if (!ip) {
        return;
      }
      if (useMockData) {
        setError('Refresh is disabled while showing mock data.');
        return;
      }
      setError(null);

      const methodToUse = deviceProtocolOverrides[ip] ?? protocol;

      // 1) Ask the backend to refresh the device using the current protocol.
      try {
        await refreshDeviceByIp(ip, methodToUse);
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : 'Device refresh failed.'
        );
        return;
      }

      // 2) Try to fetch just that device.
      try {
        const updatedDevice = await fetchDeviceByIp(ip);
        if (updatedDevice) {
          setDevices((previous) => {
            const alreadyExists = previous.some(
              (device) =>
                device.primaryIp === ip || device.mac === updatedDevice.mac
            );

            if (alreadyExists) {
              return previous.map((device) =>
                device.primaryIp === ip || device.mac === updatedDevice.mac
                  ? updatedDevice
                  : device
              );
            }

            return [...previous, updatedDevice];
          });
          return;
        }
      } catch {
        // If GET /devices/get_one_record fails we silently move on to the
        // fallback where we reload all devices.
      }

      // 3) Fallback: reload the entire device list.
      try {
        const latestDevices = await fetchAllDevices();
        setDevices(latestDevices);
      } catch (fallbackError) {
        setError(
          fallbackError instanceof Error
            ? fallbackError.message
            : 'Unable to refresh device data.'
        );
      }
    },
    [deviceProtocolOverrides, protocol, useMockData]
  );

  const handleErasePendingCredential = useCallback(
    (ip: string) => {
      if (!ip || knownDeviceIps.has(ip)) {
        return;
      }
      setCredentials((previous) =>
        previous.filter((credential) => credential.ip !== ip)
      );
    },
    [knownDeviceIps]
  );

  const handleDeviceAdded = useCallback(async () => {
    setError(null);
    try {
      await reloadDevicesAndCredentials();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to reload devices.'
      );
    }
  }, [reloadDevicesAndCredentials]);

  const credentialForSelectedDevice = useMemo(() => {
    if (!selectedDevice) {
      return undefined;
    }
    if (selectedDevice.primaryIp) {
      return credentialMap[selectedDevice.primaryIp];
    }
    return undefined;
  }, [selectedDevice, credentialMap]);

  const selectedDeviceProtocol = useMemo(() => {
    if (!selectedDevice) {
      return protocol;
    }
    return getProtocolForDevice(selectedDevice, credentialForSelectedDevice);
  }, [selectedDevice, credentialForSelectedDevice, getProtocolForDevice, protocol]);

  const handleMockToggle = useCallback(
    async (enabled: boolean) => {
      setUseMockData(enabled);
      await reloadDevicesAndCredentials(enabled);
    },
    [reloadDevicesAndCredentials]
  );

  return (
    <div className={`app app--${theme}`}>
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefreshAll={handleGlobalRefresh}
        isRefreshing={isRefreshing}
        isLoading={isLoading}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAddDevice={() => setIsAddDeviceOpen(true)}
      />
      <Sidebar
        counts={sidebarCounts}
        selectedStatus={statusFilter}
        onSelectStatus={handleStatusFilterChange}
      />

      <main className="main-content">
        {isLoading && <div className="loading-state">Loading devices…</div>}
        {!isLoading && isRefreshing && (
          <div className="loading-state">Refreshing devices…</div>
        )}
        {error && <div className="error-state">{error}</div>}
        {!isLoading && (
          <DeviceList
            devices={filteredDevices}
            credentialMap={credentialMap}
            pendingIpLookup={pendingIpLookup}
            getProtocolForDevice={getProtocolForDevice}
            onSelectDevice={(device) => setSelectedDevice(device)}
            onRefreshDevice={handleDeviceRefresh}
            onErasePending={handleErasePendingCredential}
            viewMode={viewMode}
          />
        )}
      </main>

      <DeviceDetailsModal
        device={selectedDevice}
        credential={credentialForSelectedDevice}
        protocol={selectedDeviceProtocol}
        onProtocolChange={(method) => {
          if (selectedDevice) {
            handleDeviceProtocolChange(
              selectedDevice,
              credentialForSelectedDevice,
              method
            );
          }
        }}
        onClose={() => setSelectedDevice(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        protocol={protocol}
        onProtocolChange={setProtocol}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        useMockData={useMockData}
        onUseMockDataChange={handleMockToggle}
      />
      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
        onDeviceAdded={handleDeviceAdded}
      />
    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;
