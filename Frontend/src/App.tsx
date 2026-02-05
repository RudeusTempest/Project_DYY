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
import { useAlerts, type AlertItem } from './hooks/useAlerts';
import {
  getAvailableDeviceTypes,
  normalizeIp,
  normalizeMac,
  resolveDeviceIp,
} from './utils/deviceUtils';

const deviceStepLabels: Record<DeviceDetailsStepId, string> = {
  details: 'Details',
  config: 'Config',
  interfaces: 'Interfaces',
  ports: 'Ports',
  groups: 'Groups',
  'white-list': 'White list',
};

const AppContent: React.FC = () => {
  const [mainView, setMainView] = useState<MainViewState>({ type: 'devices' });
  const [viewMode, setViewMode] = useState<DeviceViewMode>('gallery');
  const { theme } = useTheme();
  const isDevicesView = mainView.type === 'devices';

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

  const {
    alerts,
    alertsByDevice,
    unreadByDevice,
    socketStatus,
    socketError,
    clearAlerts,
    clearAlertsForDevice,
    markDeviceAlertsRead,
  } = useAlerts(devices);

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
    unreadAlertsByMac: unreadByDevice,
  });

  const selectedDeviceProtocol = useMemo(() => {
    if (mainView.type !== 'device') {
      return protocol;
    }
    return getProtocolForDevice(mainView.device);
  }, [getProtocolForDevice, mainView, protocol]);

  const deviceLookup = useMemo(() => {
    const byMac = new Map<string, DeviceRecord>();
    const byIp = new Map<string, DeviceRecord>();

    devices.forEach((device) => {
      const normalizedMac = normalizeMac(device.mac);
      if (normalizedMac) {
        byMac.set(normalizedMac, device);
      }

      const primaryIp = resolveDeviceIp(device);
      if (primaryIp) {
        const normalizedIp = normalizeIp(primaryIp);
        if (normalizedIp) {
          byIp.set(normalizedIp, device);
        }
      }

      device.interfaces.forEach((iface) => {
        const normalizedIp = normalizeIp(iface.ip_address);
        if (normalizedIp && normalizedIp !== 'unassigned' && normalizedIp !== 'unknown') {
          byIp.set(normalizedIp, device);
        }
      });
    });

    return { byMac, byIp };
  }, [devices]);

  const findDeviceForAlert = useCallback(
    (alert: AlertItem) => {
      const normalizedMac = alert.deviceMac
        ? normalizeMac(alert.deviceMac)
        : '';
      if (normalizedMac) {
        const deviceByMac = deviceLookup.byMac.get(normalizedMac);
        if (deviceByMac) {
          return deviceByMac;
        }
      }

      const normalizedIp = alert.deviceIp ? normalizeIp(alert.deviceIp) : '';
      if (normalizedIp) {
        return deviceLookup.byIp.get(normalizedIp);
      }

      return undefined;
    },
    [deviceLookup]
  );

  const handleAlertSelect = useCallback(
    (alert: AlertItem) => {
      const device = findDeviceForAlert(alert);
      if (!device) {
        return;
      }
      markDeviceAlertsRead(device.mac);
      setMainView({
        type: 'device',
        device,
        section: 'white-list',
        sectionLabel: deviceStepLabels['white-list'],
      });
    },
    [findDeviceForAlert, markDeviceAlertsRead]
  );

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

      if (stepId === 'white-list' && mainView.type === 'device') {
        markDeviceAlertsRead(mainView.device.mac);
      }
    },
    [mainView, markDeviceAlertsRead]
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
        <SubHeader
          items={breadcrumbs}
          className={isDevicesView ? 'sub-header--with-rightbar' : undefined}
        />
        <div
          className={`content-body${
            isDevicesView ? ' content-body--devices' : ''
          }`}
        >
          {statusMessages}
          <MainView
            view={mainView}
            isLoading={isLoading}
            devices={devices}
            filteredDevices={filteredDevices}
            viewMode={viewMode}
            getProtocolForDevice={getProtocolForDevice}
            onSelectDevice={handleSelectDevice}
            onRefreshDevice={handleDeviceRefresh}
            unreadAlertsByMac={unreadByDevice}
            alerts={alerts}
            alertsByDevice={alertsByDevice}
            socketStatus={socketStatus}
            socketError={socketError}
            onSelectAlert={handleAlertSelect}
            onClearAlerts={clearAlerts}
            onClearAlertsForDevice={clearAlertsForDevice}
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
