import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DeviceList from './components/DeviceList';
import DeviceDetailsModal from './components/DeviceDetailsModal';
import SettingsModal from './components/SettingsModal';
import {
  DeviceRecord,
  fetchAllDevices,
  fetchDeviceByIp,
  refreshDeviceByIp,
  deriveDeviceStatus,
  ProtocolMethod,
} from './api/devices';
import {
  CredentialRecord,
  fetchAllCredentials,
} from './api/credentials';
import { ThemeProvider, useTheme } from './theme/ThemeContext';

const AppContent: React.FC = () => {
  // Stores the full list of devices returned by GET /devices/get_all.
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  // Stores the credential objects returned by GET /credentials/connection_details.
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  // Search text typed in the header; we use it to filter the list in-memory.
  const [searchTerm, setSearchTerm] = useState('');
  // Currently selected device for the DeviceDetailsModal.
  const [selectedDevice, setSelectedDevice] = useState<DeviceRecord | null>(
    null
  );
  // Controls whether the settings modal is visible.
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Loading + error states for the initial fetch.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Protocol preference for the Update button (default SNMP as requested).
  const [protocol, setProtocol] = useState<ProtocolMethod>('snmp');

  const { theme } = useTheme();

  // Fetch devices and credentials at the same time when the app starts.
  const reloadDevicesAndCredentials = useCallback(async () => {
    const [deviceData, credentialData] = await Promise.all([
      fetchAllDevices(),
      fetchAllCredentials(),
    ]);
    setDevices(deviceData);
    setCredentials(credentialData);
  }, []);

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

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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

  // Filtering happens entirely in memory – no extra backend calls.
  const filteredDevices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      return devices;
    }

    return devices.filter((device) => {
      const hostnameMatch = device.hostname.toLowerCase().includes(term);
      const ipMatch = device.primaryIp
        ? device.primaryIp.toLowerCase().includes(term)
        : false;
      return hostnameMatch || ipMatch;
    });
  }, [devices, searchTerm]);

  // Sidebar counts update automatically whenever the devices array changes.
  const sidebarCounts = useMemo(() => {
    const counts = {
      total: devices.length,
      active: 0,
      inactive: 0,
      unauthorized: 0,
    };

    devices.forEach((device) => {
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
  }, [devices]);

  const handleDeviceRefresh = useCallback(
    async (ip: string) => {
      if (!ip) {
        return;
      }
      setError(null);

      // 1) Ask the backend to refresh the device using the current protocol.
      try {
        await refreshDeviceByIp(ip, protocol);
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
    [protocol]
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

  return (
    <div className={`app app--${theme}`}>
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <Sidebar counts={sidebarCounts} />

      <main className="main-content">
        {isLoading && <div className="loading-state">Loading devices…</div>}
        {error && <div className="error-state">{error}</div>}
        {!isLoading && (
          <DeviceList
            devices={filteredDevices}
            credentialMap={credentialMap}
            protocol={protocol}
            onSelectDevice={(device) => setSelectedDevice(device)}
            onRefreshDevice={handleDeviceRefresh}
          />
        )}
      </main>

      <DeviceDetailsModal
        device={selectedDevice}
        credential={credentialForSelectedDevice}
        onClose={() => setSelectedDevice(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        protocol={protocol}
        onProtocolChange={setProtocol}
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
