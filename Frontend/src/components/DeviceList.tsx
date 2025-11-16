import React from 'react';
import { NetworkDevice } from '../types';
import DeviceItem from './DeviceItem';

type DeviceListProps = {
  devices: NetworkDevice[];
  onDeviceClick: (device: NetworkDevice) => void;
  onUpdateDevice: (ip: string) => void;
  updatingIp?: string | null;
  credentialIps?: Set<string>;
};

const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  onDeviceClick,
  onUpdateDevice,
  updatingIp,
  credentialIps,
}) => {
  const normalizeIp = (value: unknown): string | null => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    if (value == null) return null;
    const stringified = String(value).trim();
    return stringified.length ? stringified : null;
  };

  return (
    <div className="devices-list">
      {devices.map((device, index) => {
        const safeInterfaces = Array.isArray(device.interface) ? device.interface : [];
        const candidateIps = safeInterfaces
          .map((port) => normalizeIp(port?.ip_address ?? (port as any)?.IP_Address))
          .filter((ip): ip is string => Boolean(ip));
        const preferredIp = credentialIps ? candidateIps.find((ip) => credentialIps.has(ip)) : undefined;
        const primary = candidateIps[0];
        const effectiveIp = preferredIp ?? primary;
        const deviceKey =
          (device.Mac && device.Mac !== 'Not found' && device.Mac) ||
          device.hostname ||
          primary ||
          `device-${index}`;

        return (
          <DeviceItem
            key={deviceKey}
            device={device}
            onClick={() => onDeviceClick(device)}
            onUpdate={onUpdateDevice}
            isUpdating={Boolean(effectiveIp && effectiveIp === updatingIp)}
            updateIp={preferredIp}
          />
        );
      })}
    </div>
  );
};

export default DeviceList;
