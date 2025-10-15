import React from 'react';
import { NetworkDevice } from '../types';
import DeviceItem from './DeviceItem';

type DeviceListProps = {
  devices: NetworkDevice[];
  onDeviceClick: (device: NetworkDevice) => void;
  onRefreshDevice: (ip: string) => void;
  refreshingIp?: string | null;
  credentialIps?: Set<string>;
};

const DeviceList: React.FC<DeviceListProps> = ({ devices, onDeviceClick, onRefreshDevice, refreshingIp, credentialIps }) => {
  return (
    <div className="devices-list">
      {devices.map((device, index) => (
        (() => {
          const safeInterfaces = Array.isArray(device.interface) ? device.interface : [];
          const candidateIps = safeInterfaces
            .map(p => (typeof p?.ip_address === 'string' ? p.ip_address : null))
            .filter((ip): ip is string => !!ip && ip !== 'unassigned' && ip !== 'This');
          const refreshIp = credentialIps && candidateIps.find(ip => credentialIps.has(ip));
          const primary = candidateIps[0];
          const effectiveIp = refreshIp ?? primary;
          return (
            <DeviceItem
          key={index}
          device={device}
          onClick={() => onDeviceClick(device)}
          onRefresh={onRefreshDevice}
          isRefreshing={effectiveIp === refreshingIp}
          refreshIp={refreshIp}
        />
          );
        })()
      ))}
    </div>
  );
};

export default DeviceList;
