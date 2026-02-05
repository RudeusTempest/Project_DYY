import React from 'react';
import { type DeviceRecord, type ProtocolMethod } from '../../api/devices';
import { type AlertItem, type AlertSocketStatus } from '../../hooks/useAlerts';
import DeviceTabDetails from './tabs/deviceTabDetails';
import DeviceTabConfigDiffs from './tabs/deviceTabConfigDiffs';
import DeviceTabInterfaces from './tabs/deviceTabInterfaces';
import DeviceTabPorts from './tabs/deviceTabPorts';
import DeviceTabGroups from './tabs/deviceTabGroups';
import DeviceTabWhiteList from './tabs/deviceTabWhiteList';

export interface DeviceDetailsTabContext {
  device: DeviceRecord;
  protocol: ProtocolMethod;
  onProtocolChange: (method: ProtocolMethod) => void;
  deviceIpLabel: string;
  hasDeviceIp: boolean;
  alerts: AlertItem[];
  socketStatus: AlertSocketStatus;
  socketError: string | null;
  onClearAlerts: () => void;
}

export const deviceDetailsTabs = [
  {
    id: 'details',
    label: 'Details',
    render: (context: DeviceDetailsTabContext) => (
      <DeviceTabDetails
        device={context.device}
        protocol={context.protocol}
        onProtocolChange={context.onProtocolChange}
        deviceIpLabel={context.deviceIpLabel}
        hasDeviceIp={context.hasDeviceIp}
      />
    ),
  },
  {
    id: 'config',
    label: 'Config',
    render: (context: DeviceDetailsTabContext) => (
      <DeviceTabConfigDiffs
        device={context.device}
        deviceIpLabel={context.deviceIpLabel}
        hasDeviceIp={context.hasDeviceIp}
      />
    ),
  },
  {
    id: 'interfaces',
    label: 'Interfaces',
    render: (context: DeviceDetailsTabContext) => (
      <DeviceTabInterfaces device={context.device} />
    ),
  },
  {
    id: 'ports',
    label: 'Ports',
    render: (context: DeviceDetailsTabContext) => (
      <DeviceTabPorts device={context.device} />
    ),
  },
  {
    id: 'groups',
    label: 'Groups',
    render: (context: DeviceDetailsTabContext) => (
      <DeviceTabGroups device={context.device} />
    ),
  },
  {
    id: 'white-list',
    label: 'White list',
    render: (context: DeviceDetailsTabContext) => (
      <DeviceTabWhiteList
        device={context.device}
        alerts={context.alerts}
        socketStatus={context.socketStatus}
        socketError={context.socketError}
        onClearAlerts={context.onClearAlerts}
      />
    ),
  },
] as const;

export type DeviceDetailsStepId = (typeof deviceDetailsTabs)[number]['id'];
