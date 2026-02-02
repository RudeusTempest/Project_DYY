import React, { useCallback, useMemo, useState } from 'react';
import './App.css';
import Header from './components/header/Header';
import Sidebar from './components/sidebar/Sidebar';
import { type DeviceViewMode } from './components/device-list/DeviceList';
import { type DeviceDetailsStepId } from './components/device-list/DeviceDetailsView';
import MainView, { type MainViewState } from './components/main-view/MainView';
import SubHeader from './components/sub-header/SubHeader';
import { type DeviceRecord } from './api/devices';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { useDeviceData } from './hooks/useDeviceData';
import { useGroups } from './hooks/useGroups';
import { useProtocols } from './hooks/useProtocols';
import { useDeviceFilters } from './hooks/useDeviceFilters';
import { getAvailableDeviceTypes } from './utils/deviceUtils';

const deviceStepLabels: Record<DeviceDetailsStepId, string> = {
  details: 'Details',
  interfaces: 'Interfaces',
  ports: 'Ports',
  groups: 'Groups',
};

const AppContent: React.FC = () => {
  const [mainView, setMainView] = useState<MainViewState>({ type: 'devices' });
  const [viewMode, setViewMode] = useState<DeviceViewMode>('gallery');
  const { theme } = useTheme();

  const {
    devices,
    isLoading,
    error,
    isRefreshing,
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

  const availableDeviceTypes = useMemo(
    () => getAvailableDeviceTypes(devices),
    [devices]
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
  } = useGroups({ devices });

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
  });

  const selectedDeviceProtocol = useMemo(() => {
    if (mainView.type !== 'device') {
      return protocol;
    }
    return getProtocolForDevice(mainView.device);
  }, [getProtocolForDevice, mainView, protocol]);

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([refreshAllDevices(), refreshGroups()]);
  }, [refreshAllDevices, refreshGroups]);

  const handleDeviceRefresh = useCallback(
    (ip: string) => {
      const methodToUse = deviceProtocolOverrides[ip] ?? protocol;
      return refreshDevice(ip, methodToUse);
    },
    [deviceProtocolOverrides, protocol, refreshDevice]
  );

  const goToDevices = useCallback(() => {
    setMainView({ type: 'devices' });
  }, []);

  const handleSelectDevice = useCallback((device: DeviceRecord) => {
    setMainView({ type: 'device', device, section: 'details' });
  }, []);

  const handleDeviceStepChange = useCallback(
    (stepId: DeviceDetailsStepId, label: string) => {
      setMainView((current) =>
        current.type === 'device'
          ? { ...current, section: stepId, sectionLabel: label }
          : current
      );
    },
    []
  );

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; onClick?: () => void }[] = [
      {
        label: 'Devices',
        onClick: mainView.type !== 'devices' ? goToDevices : undefined,
      },
    ];

    switch (mainView.type) {
      case 'device':
        crumbs.push(
          { label: mainView.device.hostname },
          {
            label:
              mainView.sectionLabel ??
              deviceStepLabels[mainView.section] ??
              'Details',
          }
        );
        break;
      case 'settings':
        crumbs.push({ label: 'Settings' });
        break;
      case 'addDevice':
        crumbs.push({ label: 'Add Device' });
        break;
      case 'groups':
        crumbs.push({ label: 'Manage Groups' });
        break;
      default:
        break;
    }

    return crumbs;
  }, [goToDevices, mainView]);

  const statusMessages = (
    <>
      {isLoading && <div className="loading-state">Loading devices…</div>}
      {!isLoading && isRefreshing && (
        <div className="loading-state">Refreshing devices…</div>
      )}
      {error && <div className="error-state">{error}</div>}
    </>
  );

  return (
    <div className={`app app--${theme}`}>
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefreshAll={handleRefreshAll}
        isRefreshing={isRefreshing}
        isLoading={isLoading}
        onOpenSettings={() => setMainView({ type: 'settings' })}
        onOpenAddDevice={() => setMainView({ type: 'addDevice' })}
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
        onOpenGroupSettings={() => setMainView({ type: 'groups' })}
      />

      <main className="main-content">
        <SubHeader items={breadcrumbs} />
        <div className="content-body">
          {statusMessages}
          <MainView
            view={mainView}
            isLoading={isLoading}
            filteredDevices={filteredDevices}
            viewMode={viewMode}
            getProtocolForDevice={getProtocolForDevice}
            onSelectDevice={handleSelectDevice}
            onRefreshDevice={handleDeviceRefresh}
            selectedDeviceProtocol={selectedDeviceProtocol}
            onDeviceStepChange={handleDeviceStepChange}
            onDeviceProtocolChange={handleDeviceProtocolChange}
            onCloseView={goToDevices}
            protocol={protocol}
            onProtocolChange={setProtocol}
            onViewModeChange={setViewMode}
            autoUpdateDeviceInterval={autoUpdateDeviceInterval}
            onAutoUpdateDeviceIntervalChange={setAutoUpdateDeviceInterval}
            autoUpdateMbpsInterval={autoUpdateMbpsInterval}
            onAutoUpdateMbpsIntervalChange={setAutoUpdateMbpsInterval}
            autoUpdateMethod={autoUpdateMethod}
            onAutoUpdateMethodChange={setAutoUpdateMethod}
            onStartAutoUpdate={handleStartAutoUpdate}
            autoUpdateMessage={autoUpdateMessage}
            isStartingAutoUpdate={isStartingAutoUpdate}
            onDeviceAdded={handleDeviceAdded}
            groups={groups}
            onReloadGroups={reloadGroupsOnly}
            onAddGroup={handleAddGroup}
            onAssignDeviceToGroup={handleAssignDeviceToGroup}
            onRemoveDeviceFromGroup={handleRemoveDeviceFromGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;
