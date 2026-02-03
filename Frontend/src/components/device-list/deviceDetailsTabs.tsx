import React from 'react';
import { type DeviceRecord, type ProtocolMethod } from '../../api/devices';
import DeviceTabDetails from './tabs/deviceTabDetails';
import DeviceTabInterfaces from './tabs/deviceTabInterfaces';
import DeviceTabPorts from './tabs/deviceTabPorts';
import DeviceTabGroups from './tabs/deviceTabGroups';

export interface DeviceDetailsTabContext {
  device: DeviceRecord;
  protocol: ProtocolMethod;
  onProtocolChange: (method: ProtocolMethod) => void;
  deviceIpLabel: string;
  hasDeviceIp: boolean;
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
] as const;

export type DeviceDetailsStepId = (typeof deviceDetailsTabs)[number]['id'];
