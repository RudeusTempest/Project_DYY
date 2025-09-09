import React from 'react';
import { NetworkDevice } from '../types';

type DeviceListProps = {
  devices: NetworkDevice[];
  onDeviceClick: (device: NetworkDevice) => void;
};

const DeviceListItem: React.FC<{ device: NetworkDevice; onClick: () => void }> = ({ device, onClick }) => {
  const primaryIP = device.interface[0]?.ip_address || 'No IP';

  const activeInterfaces = device.interface.filter(port => port.status.includes('up/up')).length;
  const totalInterfaces = device.interface.length;

  const getDeviceStatus = () => {
    const hasActivePort = device.interface.some(port => port.status.includes('up/up'));
    if (device.hostname === "Hostname not found") return 'Unauthorized';
    return hasActivePort ? 'Active' : 'Inactive';
  };

  const status = getDeviceStatus();

  const formatLastUpdated = (lastUpdated: string | { $date: string }) => {
    if (typeof lastUpdated === 'string') {
      return lastUpdated;
    }
    return new Date(lastUpdated.$date).toLocaleString();
  };

  return (
    <div onClick={onClick} className={`device-list-item ${status.toLowerCase()}`}>
      <div className="device-list-content">
        <div className="device-primary-info">
          <h3>{device.hostname}</h3>
          <div className="device-meta">
            <span className="ip-address">{primaryIP}</span>
            <span className="mac-address">{device.Mac}</span>
          </div>
        </div>

        <div className="device-secondary-info">
          <div className="interface-count">
            <span className="active-count">{activeInterfaces}</span>
            <span className="separator">/</span>
            <span className="total-count">{totalInterfaces}</span>
            <span className="label">Interfaces</span>
          </div>
          <div className="last-updated">
            Last updated: {formatLastUpdated(device["last updated at"])}
          </div>
        </div>

        <div className="device-status-info">
          <div className={`status ${status.toLowerCase()}`}>
            {status}
          </div>
        </div>
      </div>
    </div>
  );
};

const DeviceList: React.FC<DeviceListProps> = ({ devices, onDeviceClick }) => {
  return (
    <div className="devices-list">
      {devices.map((device, index) => (
        <DeviceListItem key={index} device={device} onClick={() => onDeviceClick(device)} />
      ))}
    </div>
  );
};

export default DeviceList;

