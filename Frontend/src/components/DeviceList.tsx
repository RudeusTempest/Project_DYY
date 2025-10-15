import React from 'react';
import { NetworkDevice } from '../types';
import DeviceItem from './DeviceItem';

type DeviceListProps = {
  devices: NetworkDevice[];
  onDeviceClick: (device: NetworkDevice) => void;
  onRefreshDevice: (ip: string) => void;
  refreshingIp?: string | null;
};

const DeviceList: React.FC<DeviceListProps> = ({ devices, onDeviceClick, onRefreshDevice, refreshingIp }) => {
  return (
    <div className="devices-list">
      {devices.map((device, index) => (
        <DeviceItem
          key={index}
          device={device}
          onClick={() => onDeviceClick(device)}
          onRefresh={onRefreshDevice}
          isRefreshing={(Array.isArray(device.interface) ? device.interface[0]?.ip_address : undefined) === refreshingIp}
        />
      ))}
    </div>
  );
};

export default DeviceList;
