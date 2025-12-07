import React, { useCallback, useMemo, useState } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DeviceList, { type DeviceViewMode } from './components/DeviceList';
import DeviceDetailsModal from './components/DeviceDetailsModal';
import SettingsModal from './components/SettingsModal';
import AddDeviceModal from './components/AddDeviceModal';
import { type DeviceRecord } from './api/devices';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { useDeviceData } from './hooks/useDeviceData';
import { useGroups } from './hooks/useGroups';
import { useProtocols } from './hooks/useProtocols';
import { useDeviceFilters } from './hooks/useDeviceFilters';
import {
  buildCredentialMap,
  findCredentialForDevice as findCredentialForDeviceUtil,
  getAvailableDeviceTypes,
} from './utils/deviceUtils';

const AppContent: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceRecord | null>(
    null
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [viewMode, setViewMode] = useState<DeviceViewMode>('gallery');
  const { theme } = useTheme();

  const {
    devices,
    credentials,
    useMockData,
    isLoading,
    error,
    isRefreshing,
    setUseMockData,
    reloadDevicesAndCredentials,
    handleGlobalRefresh: refreshAllDevices,
    refreshDevice,
    handleDeviceAdded,
  } = useDeviceData();

  const {
    protocol,
    setProtocol,
    deviceProtocolOverrides,
    getProtocolForDevice,
    handleDeviceProtocolChange,
    autoUpdateDeviceInterval,
    setAutoUpdateDeviceInterval,
    autoUpdateMbpsInterval,
    setAutoUpdateMbpsInterval,
    autoUpdateMethod,
    setAutoUpdateMethod,
    autoUpdateMessage,
    isStartingAutoUpdate,
    handleStartAutoUpdate,
  } = useProtocols();

  const credentialMap = useMemo(
    () => buildCredentialMap(credentials),
    [credentials]
  );

  const findCredentialForDevice = useCallback(
    (device: DeviceRecord) =>
      findCredentialForDeviceUtil(device, credentialMap),
    [credentialMap]
  );

  const availableDeviceTypes = useMemo(
    () => getAvailableDeviceTypes(credentials),
    [credentials]
  );

  const {
    groups,
    availableGroupNames,
    deviceGroupsByMac,
    sidebarGroupItems,
    reloadGroupsOnly,
    refreshGroups,
    handleAddGroup,
    handleAssignDeviceToGroup,
    handleRemoveDeviceFromGroup,
    handleDeleteGroup,
  } = useGroups({ useMockData, devices });

  const {
    searchTerm,
    setSearchTerm,
    selectedGroup,
    setSelectedGroup,
    selectedDeviceType,
    setSelectedDeviceType,
    statusFilter,
    handleStatusFilterChange,
    filteredDevices,
    sidebarCounts,
  } = useDeviceFilters({
    devices,
    deviceGroupsByMac,
    availableGroupNames,
    availableDeviceTypes,
    findCredentialForDevice,
  });

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
  }, [
    credentialForSelectedDevice,
    getProtocolForDevice,
    protocol,
    selectedDevice,
  ]);

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([refreshAllDevices(), refreshGroups()]);
  }, [refreshAllDevices, refreshGroups]);

  const handleMockToggle = useCallback(
    async (enabled: boolean) => {
      setUseMockData(enabled);
      await reloadDevicesAndCredentials(enabled);
    },
    [reloadDevicesAndCredentials, setUseMockData]
  );

  const handleDeviceRefresh = useCallback(
    (ip: string) => {
      const methodToUse = deviceProtocolOverrides[ip] ?? protocol;
      return refreshDevice(ip, methodToUse);
    },
    [deviceProtocolOverrides, protocol, refreshDevice]
  );

  return (
    <div className={`app app--${theme}`}>
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefreshAll={handleRefreshAll}
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
        groups={groups}
        onReloadGroups={reloadGroupsOnly}
        onAddGroup={handleAddGroup}
        onAssignDeviceToGroup={handleAssignDeviceToGroup}
        onRemoveDeviceFromGroup={handleRemoveDeviceFromGroup}
        onDeleteGroup={handleDeleteGroup}
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
