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
import {
  fetchAllGroups,
  fetchGroupWithMembers,
  GroupWithMembers,
} from './api/groups';
import { mockDevices, mockCredentials } from './mockData';
import { ThemeProvider, useTheme } from './theme/ThemeContext';

const DEFAULT_DEVICE_INTERVAL = 3600;
const DEFAULT_MBPS_INTERVAL = 0;
const DEFAULT_AUTO_METHOD: ProtocolMethod = 'snmp';

const AppContent: React.FC = () => {

  // Stores the full list of devices returned by GET /devices/get_all.
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  // Stores the credential objects returned by GET /credentials/connection_details.
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  // Stores groups returned by GET /groups/get_all_groups + /groups/one_group.
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  // When true, the UI shows bundled mock data instead of hitting the backend.
  const [useMockData, setUseMockData] = useState(false);
  // Search text typed in the header; we use it to filter the list in-memory.
  const [searchTerm, setSearchTerm] = useState('');
  // Currently selected group filter ("all" shows every group).
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  // Filter devices by device type (as reported in credentials).
  const [selectedDeviceType, setSelectedDeviceType] =
    useState<string>('all');
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
  // Automatic update scheduler settings for /devices/start_program.
  const [autoUpdateDeviceInterval, setAutoUpdateDeviceInterval] =
    useState<number>(DEFAULT_DEVICE_INTERVAL);
  const [autoUpdateMbpsInterval, setAutoUpdateMbpsInterval] = useState<number>(
    DEFAULT_MBPS_INTERVAL
  );
  const [autoUpdateMethod, setAutoUpdateMethod] =
    useState<ProtocolMethod>(DEFAULT_AUTO_METHOD);
  const [autoUpdateMessage, setAutoUpdateMessage] = useState<string | null>(
    null
  );
  const [isStartingAutoUpdate, setIsStartingAutoUpdate] = useState(false);

  const { theme } = useTheme();

  const normalizeIp = useCallback((ip?: string) => {
    if (!ip || typeof ip !== 'string') {
      return '';
    }
    return ip.toLowerCase().trim().split('/')[0];
  }, []);

  const normalizeMac = useCallback((mac?: string) => {
    if (!mac || typeof mac !== 'string') {
      return '';
    }
    return mac.toLowerCase().replace(/[^a-f0-9]/g, '');
  }, []);

  const loadGroupsWithMembers = useCallback(
    async (): Promise<GroupWithMembers[]> => {
      try {
        const summaries = await fetchAllGroups();
        if (!Array.isArray(summaries) || summaries.length === 0) {
          return [];
        }

        const detailedGroups = await Promise.all(
          summaries.map(async (group) => {
            if (!group?.group) {
              return null;
            }

            if (Array.isArray((group as GroupWithMembers).device_macs)) {
              return {
                group: group.group,
                device_macs: (group as GroupWithMembers).device_macs ?? [],
              };
            }

            const details = await fetchGroupWithMembers(group.group).catch(() => null);
            const deviceMacs =
              details && Array.isArray(details.device_macs)
                ? details.device_macs
                : [];

            return {
              group: group.group,
              device_macs: deviceMacs,
            };
          })
        );

        return detailedGroups
          .filter(
            (group): group is GroupWithMembers =>
              Boolean(group && group.group)
          )
          .map((group) => ({
            group: group.group,
            device_macs: group.device_macs ?? [],
          }));
      } catch (groupError) {
        console.warn('Failed to load groups', groupError);
        return [];
      }
    },
    []
  );

  const applyMockData = useCallback(() => {
    setDevices(mockDevices);
    setCredentials(mockCredentials);
    setGroups([]);
  }, []);

  // Fetch devices and credentials at the same time when the app starts.
  const reloadDevicesAndCredentials = useCallback(
    async (forceMock = useMockData) => {
      if (forceMock) {
        applyMockData();
        setGroups([]);
        setError('Showing mock data (backend calls disabled).');
        return;
      }

      const [deviceData, credentialData, groupData] = await Promise.all([
        fetchAllDevices().catch(() => null),
        fetchAllCredentials().catch(() => null),
        loadGroupsWithMembers(),
      ]);

      const hasDevices = Array.isArray(deviceData) && deviceData.length > 0;
      const hasCredentials =
        Array.isArray(credentialData) && credentialData.length > 0;

      if (hasDevices && hasCredentials) {
        setDevices(deviceData);
        setCredentials(credentialData);
        setGroups(Array.isArray(groupData) ? groupData : []);
        setError(null);
        return;
      }

      applyMockData();
      setUseMockData(true);
      setGroups([]);
      setError(
        'Using mock data because the API is unavailable or returned no records.'
      );
    },
    [useMockData, applyMockData, loadGroupsWithMembers]
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
      DEFAULT_DEVICE_INTERVAL,
      DEFAULT_MBPS_INTERVAL,
      DEFAULT_AUTO_METHOD
    ).catch((startError) => {
      console.warn('start_program call failed or timed out', startError);
    });
  }, []);

  const handleStartAutoUpdate = useCallback(async () => {
    setAutoUpdateMessage(null);
    setIsStartingAutoUpdate(true);
    try {
      await startProgram(
        autoUpdateDeviceInterval,
        autoUpdateMbpsInterval,
        autoUpdateMethod
      );
      setAutoUpdateMessage('Automatic updates started.');
    } catch (startError) {
      setAutoUpdateMessage(
        startError instanceof Error
          ? startError.message
          : 'Failed to start automatic updates.'
      );
    } finally {
      setIsStartingAutoUpdate(false);
    }
  }, [autoUpdateDeviceInterval, autoUpdateMbpsInterval, autoUpdateMethod]);

  // Quick lookup by IP so components can easily grab credential info.
  const credentialMap = useMemo(() => {
    const map: Record<string, CredentialRecord> = {};
    credentials.forEach((credential) => {
      if (credential.ip) {
        const key = normalizeIp(credential.ip);
        if (key) {
          map[key] = credential;
        }
      }
    });
    return map;
  }, [credentials, normalizeIp]);

  const availableDeviceTypes = useMemo(() => {
    const deviceTypes = new Set<string>();
    credentials.forEach((credential) => {
      if (credential.device_type) {
        deviceTypes.add(credential.device_type);
      }
    });
    return Array.from(deviceTypes).sort((a, b) => a.localeCompare(b));
  }, [credentials]);

  const availableGroupNames = useMemo(
    () =>
      groups
        .map((group) => group.group)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [groups]
  );

  useEffect(() => {
    if (
      selectedDeviceType !== 'all' &&
      !availableDeviceTypes.includes(selectedDeviceType)
    ) {
      setSelectedDeviceType('all');
    }
  }, [availableDeviceTypes, selectedDeviceType]);

  useEffect(() => {
    if (selectedGroup !== 'all' && !availableGroupNames.includes(selectedGroup)) {
      setSelectedGroup('all');
    }
  }, [availableGroupNames, selectedGroup]);

  const findCredentialForDevice = useCallback(
    (device: DeviceRecord): CredentialRecord | undefined => {
      const primaryKey = normalizeIp(device.primaryIp);
      if (primaryKey && credentialMap[primaryKey]) {
        return credentialMap[primaryKey];
      }

      const interfaceKey = device.interfaces
        .map((iface) => normalizeIp(iface.ip_address))
        .find((key) => key && credentialMap[key]);

      if (interfaceKey) {
        return credentialMap[interfaceKey];
      }

      return undefined;
    },
    [credentialMap, normalizeIp]
  );

  // Helper to resolve which IP we should associate with this device.
  const resolveDeviceIp = useCallback(
    (device: DeviceRecord, credential?: CredentialRecord) =>
      device.primaryIp || credential?.ip,
    []
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

  const deviceGroupsByMac = useMemo(() => {
    const mapping: Record<string, string[]> = {};

    groups.forEach((group) => {
      const groupName = group.group;
      if (!groupName) {
        return;
      }

      (group.device_macs ?? []).forEach((mac) => {
        const normalizedMac = normalizeMac(mac);
        if (!normalizedMac) {
          return;
        }
        if (!mapping[normalizedMac]) {
          mapping[normalizedMac] = [];
        }
        if (!mapping[normalizedMac].includes(groupName)) {
          mapping[normalizedMac].push(groupName);
        }
      });
    });

    return mapping;
  }, [groups, normalizeMac]);

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

    return devices.filter((device) => {
      if (statusFilter !== 'all' && deriveDeviceStatus(device) !== statusFilter) {
        return false;
      }

      if (selectedGroup !== 'all') {
        const groupsForDevice =
          deviceGroupsByMac[normalizeMac(device.mac)] ?? [];
        if (!groupsForDevice.includes(selectedGroup)) {
          return false;
        }
      }

      if (selectedDeviceType !== 'all') {
        const credential = findCredentialForDevice(device);
        const deviceType = credential?.device_type ?? '';
        if (deviceType.toLowerCase() !== selectedDeviceType.toLowerCase()) {
          return false;
        }
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
  }, [
    devices,
    deviceGroupsByMac,
    findCredentialForDevice,
    normalizeMac,
    searchTerm,
    selectedDeviceType,
    selectedGroup,
    statusFilter,
  ]);

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

  const sidebarGroupItems = useMemo(() => {
    if (!groups.length) {
      return [];
    }

    const deviceMacs = new Set(
      devices.map((device) => normalizeMac(device.mac)).filter(Boolean)
    );

    return groups
      .map((group) => {
        const members = Array.isArray(group.device_macs)
          ? group.device_macs
          : [];
        const uniqueMembers = new Set(
          members.map((mac) => normalizeMac(mac)).filter(Boolean)
        );

        let count = 0;
        uniqueMembers.forEach((mac) => {
          if (deviceMacs.has(mac)) {
            count += 1;
          }
        });

        return { name: group.group, deviceCount: count };
      })
      .filter((item) => Boolean(item.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [devices, groups, normalizeMac]);

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
    return findCredentialForDevice(selectedDevice);
  }, [selectedDevice, findCredentialForDevice]);

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
        groupOptions={availableGroupNames}
        selectedGroup={selectedGroup}
        onGroupChange={setSelectedGroup}
        deviceTypeOptions={availableDeviceTypes}
        selectedDeviceType={selectedDeviceType}
        onDeviceTypeChange={setSelectedDeviceType}
      />
      <Sidebar
        counts={sidebarCounts}
        selectedStatus={statusFilter}
        onSelectStatus={handleStatusFilterChange}
        groups={sidebarGroupItems}
        selectedGroup={selectedGroup}
        onSelectGroup={(groupName) =>
          setSelectedGroup((current) =>
            current === groupName ? 'all' : groupName
          )
        }
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
            findCredentialForDevice={findCredentialForDevice}
            getProtocolForDevice={getProtocolForDevice}
            onSelectDevice={(device) => setSelectedDevice(device)}
            onRefreshDevice={handleDeviceRefresh}
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
        autoUpdateDeviceInterval={autoUpdateDeviceInterval}
        onAutoUpdateDeviceIntervalChange={setAutoUpdateDeviceInterval}
        autoUpdateMbpsInterval={autoUpdateMbpsInterval}
        onAutoUpdateMbpsIntervalChange={setAutoUpdateMbpsInterval}
        autoUpdateMethod={autoUpdateMethod}
        onAutoUpdateMethodChange={setAutoUpdateMethod}
        onStartAutoUpdate={handleStartAutoUpdate}
        autoUpdateMessage={autoUpdateMessage}
        isStartingAutoUpdate={isStartingAutoUpdate}
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
