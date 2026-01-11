import React, { useCallback, useMemo, useState } from 'react';
import './App.css';
import Header from './components/header/Header';
import Sidebar from './components/sidebar/Sidebar';
import DeviceList, { type DeviceViewMode } from './components/device-list/DeviceList';
import DeviceDetailsModal, { type DeviceDetailsStepId } from './components/device-list/DeviceDetailsModal';
import SettingsModal from './components/header/SettingsModal';
import AddDeviceModal from './components/header/AddDeviceModal';
import GroupSettingsModal from './components/sidebar/GroupSettingsModal';
import { type DeviceRecord } from './api/devices';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { useDeviceData } from './hooks/useDeviceData';
import { useGroups } from './hooks/useGroups';
import { useProtocols } from './hooks/useProtocols';
import { useDeviceFilters } from './hooks/useDeviceFilters';
import { getAvailableDeviceTypes } from './utils/deviceUtils';

type MainView =
  | { type: 'devices' }
  | {
      type: 'device';
      device: DeviceRecord;
      section: DeviceDetailsStepId;
      sectionLabel?: string;
    }
  | { type: 'settings' }
  | { type: 'addDevice' }
  | { type: 'groups' };

const deviceStepLabels: Record<DeviceDetailsStepId, string> = {
  details: 'Details',
  interfaces: 'Interfaces',
  ports: 'Ports',
  groups: 'Groups',
};

const AppContent: React.FC = () => {
  const [mainView, setMainView] = useState<MainView>({ type: 'devices' });
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

  const renderBreadcrumbs = () => (
    <div className="breadcrumbs">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={`${crumb.label}-${index}`}>
          {index > 0 && <span className="breadcrumbs__separator">→</span>}
          {crumb.onClick ? (
            <button
              type="button"
              className="breadcrumbs__link"
              onClick={crumb.onClick}
            >
              {crumb.label}
            </button>
          ) : (
            <span className="breadcrumbs__label">{crumb.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const statusMessages = (
    <>
      {isLoading && <div className="loading-state">Loading devices…</div>}
      {!isLoading && isRefreshing && (
        <div className="loading-state">Refreshing devices…</div>
      )}
      {error && <div className="error-state">{error}</div>}
    </>
  );

  const renderMainView = () => {
    switch (mainView.type) {
      case 'device':
        return (
          <DeviceDetailsModal
            variant="inline"
            device={mainView.device}
            protocol={selectedDeviceProtocol}
            initialStep={mainView.section}
            onStepChange={handleDeviceStepChange}
            onProtocolChange={(method) =>
              handleDeviceProtocolChange(mainView.device, method)
            }
            onClose={goToDevices}
          />
        );
      case 'settings':
        return (
          <SettingsModal
            variant="inline"
            isOpen
            onClose={goToDevices}
            protocol={protocol}
            onProtocolChange={setProtocol}
            viewMode={viewMode}
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
          />
        );
      case 'addDevice':
        return (
          <AddDeviceModal
            variant="inline"
            isOpen
            onClose={goToDevices}
            onDeviceAdded={handleDeviceAdded}
          />
        );
      case 'groups':
        return (
          <GroupSettingsModal
            variant="inline"
            isOpen
            onClose={goToDevices}
            groups={groups}
            onReloadGroups={reloadGroupsOnly}
            onAddGroup={handleAddGroup}
            onAssignDeviceToGroup={handleAssignDeviceToGroup}
            onRemoveDeviceFromGroup={handleRemoveDeviceFromGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        );
      default:
        if (isLoading) {
          return null;
        }

        return (
          <DeviceList
            devices={filteredDevices}
            getProtocolForDevice={getProtocolForDevice}
            onSelectDevice={handleSelectDevice}
            onRefreshDevice={handleDeviceRefresh}
            viewMode={viewMode}
          />
        );
    }
  };

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
        <div className="content-header">{renderBreadcrumbs()}</div>
        <div className="content-body">
          {statusMessages}
          {renderMainView()}
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
