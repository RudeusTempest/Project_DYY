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

const DeviceList: React.FC<DeviceListProps> = ({ devices, onDeviceClick, onUpdateDevice, updatingIp, credentialIps }) => {
  return (
    <div className="devices-list">
      {devices.map((device, index) => (
        (() => {
          const safeInterfaces = Array.isArray(device.interface) ? device.interface : [];
          const candidateIps = safeInterfaces
            .map(p => (typeof p?.ip_address === 'string' ? p.ip_address : null))
            .filter((ip): ip is string => typeof ip === 'string' && ip.trim().length > 0);
          const preferredIp = credentialIps && candidateIps.find(ip => credentialIps.has(ip));
          const primary = candidateIps[0];
          const effectiveIp = preferredIp ?? primary;
          return (
            <DeviceItem
          key={index}
          device={device}
          onClick={() => onDeviceClick(device)}
          onUpdate={onUpdateDevice}
          isUpdating={effectiveIp === updatingIp}
          updateIp={preferredIp}
        />
          );
        })()
      ))}
    </div>
  );
};

export default DeviceList;
