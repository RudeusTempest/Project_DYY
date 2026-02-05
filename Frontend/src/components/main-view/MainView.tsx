import React from 'react';
import DeviceList, { type DeviceViewMode } from '../device-list/DeviceList';
import DeviceAlertsPanel from '../device-list/DeviceAlertsPanel';
import DeviceDetailsView, {
  type DeviceDetailsStepId,
} from '../device-list/DeviceDetailsView';
import SettingsView from '../header/SettingsView';
import AddDeviceView from '../header/AddDeviceView';
import GroupSettingsView from '../sidebar/GroupSettingsView';
import { type DeviceRecord, type ProtocolMethod } from '../../api/devices';
import type { GroupWithMembers } from '../../api/groups';
import { type AlertItem, type AlertSocketStatus } from '../../hooks/useAlerts';

export type MainViewState =
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

interface MainViewProps {
  view: MainViewState;
  isLoading: boolean;
  devices: DeviceRecord[];
  filteredDevices: DeviceRecord[];
  viewMode: DeviceViewMode;
  getProtocolForDevice: (device: DeviceRecord) => ProtocolMethod;
  onSelectDevice: (device: DeviceRecord) => void;
  onRefreshDevice: (ip: string) => Promise<void> | void;
  unreadAlertsByMac: Record<string, number>;
  alerts: AlertItem[];
  alertsByDevice: Record<string, AlertItem[]>;
  socketStatus: AlertSocketStatus;
  socketError: string | null;
  onSelectAlert: (alert: AlertItem) => void;
  onClearAlerts: () => void;
  onClearAlertsForDevice: (deviceMac: string) => void;
  selectedDeviceProtocol: ProtocolMethod;
  onDeviceStepChange: (stepId: DeviceDetailsStepId, label: string) => void;
  onDeviceProtocolChange: (device: DeviceRecord, method: ProtocolMethod) => void;
  onCloseView: () => void;
  protocol: ProtocolMethod;
  onProtocolChange: (method: ProtocolMethod) => void;
  onViewModeChange: (mode: DeviceViewMode) => void;
  autoUpdateDeviceInterval: number;
  onAutoUpdateDeviceIntervalChange: (value: number) => void;
  autoUpdateMbpsInterval: number;
  onAutoUpdateMbpsIntervalChange: (value: number) => void;
  autoUpdateMethod: ProtocolMethod;
  onAutoUpdateMethodChange: (method: ProtocolMethod) => void;
  onStartAutoUpdate: () => Promise<void> | void;
  autoUpdateMessage: string | null;
  isStartingAutoUpdate: boolean;
  onDeviceAdded: () => Promise<void> | void;
  groups: GroupWithMembers[];
  onReloadGroups: () => Promise<void> | void;
  onAddGroup: (groupName: string, deviceMacs: string[]) => Promise<void>;
  onAssignDeviceToGroup: (groupName: string, deviceMac: string) => Promise<void>;
  onRemoveDeviceFromGroup: (groupName: string, deviceMac: string) => Promise<void>;
  onDeleteGroup: (groupName: string) => Promise<void>;
}

const MainView: React.FC<MainViewProps> = ({
  view,
  isLoading,
  devices,
  filteredDevices,
  viewMode,
  getProtocolForDevice,
  onSelectDevice,
  onRefreshDevice,
  unreadAlertsByMac,
  alerts,
  alertsByDevice,
  socketStatus,
  socketError,
  onSelectAlert,
  onClearAlerts,
  onClearAlertsForDevice,
  selectedDeviceProtocol,
  onDeviceStepChange,
  onDeviceProtocolChange,
  onCloseView,
  protocol,
  onProtocolChange,
  onViewModeChange,
  autoUpdateDeviceInterval,
  onAutoUpdateDeviceIntervalChange,
  autoUpdateMbpsInterval,
  onAutoUpdateMbpsIntervalChange,
  autoUpdateMethod,
  onAutoUpdateMethodChange,
  onStartAutoUpdate,
  autoUpdateMessage,
  isStartingAutoUpdate,
  onDeviceAdded,
  groups,
  onReloadGroups,
  onAddGroup,
  onAssignDeviceToGroup,
  onRemoveDeviceFromGroup,
  onDeleteGroup,
}) => {
  switch (view.type) {
    case 'devices':
      if (isLoading) {
        return null;
      }

      return (
        <>
          <DeviceList
            devices={filteredDevices}
            getProtocolForDevice={getProtocolForDevice}
            onSelectDevice={onSelectDevice}
            onRefreshDevice={onRefreshDevice}
            viewMode={viewMode}
            unreadAlertsByMac={unreadAlertsByMac}
          />
          <DeviceAlertsPanel
            alerts={alerts}
            devices={devices}
            socketStatus={socketStatus}
            socketError={socketError}
            onSelectAlert={onSelectAlert}
            onClearAlerts={onClearAlerts}
          />
        </>
      );
    case 'device':
      return (
        <DeviceDetailsView
          device={view.device}
          protocol={selectedDeviceProtocol}
          initialStep={view.section}
          onStepChange={onDeviceStepChange}
          onProtocolChange={(method) =>
            onDeviceProtocolChange(view.device, method)
          }
          onClose={onCloseView}
          alertsByDevice={alertsByDevice}
          socketStatus={socketStatus}
          socketError={socketError}
          onClearAlertsForDevice={onClearAlertsForDevice}
        />
      );
    case 'settings':
      return (
        <SettingsView
          onClose={onCloseView}
          protocol={protocol}
          onProtocolChange={onProtocolChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          autoUpdateDeviceInterval={autoUpdateDeviceInterval}
          onAutoUpdateDeviceIntervalChange={onAutoUpdateDeviceIntervalChange}
          autoUpdateMbpsInterval={autoUpdateMbpsInterval}
          onAutoUpdateMbpsIntervalChange={onAutoUpdateMbpsIntervalChange}
          autoUpdateMethod={autoUpdateMethod}
          onAutoUpdateMethodChange={onAutoUpdateMethodChange}
          onStartAutoUpdate={onStartAutoUpdate}
          autoUpdateMessage={autoUpdateMessage}
          isStartingAutoUpdate={isStartingAutoUpdate}
        />
      );
    case 'addDevice':
      return (
        <AddDeviceView onClose={onCloseView} onDeviceAdded={onDeviceAdded} />
      );
    case 'groups':
      return (
        <GroupSettingsView
          onClose={onCloseView}
          groups={groups}
          onReloadGroups={onReloadGroups}
          onAddGroup={onAddGroup}
          onAssignDeviceToGroup={onAssignDeviceToGroup}
          onRemoveDeviceFromGroup={onRemoveDeviceFromGroup}
          onDeleteGroup={onDeleteGroup}
        />
      );
    default:
      return null;
  }
};

export default MainView;
