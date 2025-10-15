import React from 'react';
import { NetworkDevice } from '../types';

type DeviceItemProps = {
  device: NetworkDevice;
  onClick: () => void;
  onRefresh: (ip: string) => void;
  isRefreshing?: boolean;
};

const DeviceItem: React.FC<DeviceItemProps> = ({ device, onClick, onRefresh, isRefreshing }) => {
  const rawPrimaryIP: any = Array.isArray(device.interface) ? device.interface?.[0]?.ip_address : undefined;
  const primaryIP = typeof rawPrimaryIP === 'string' ? rawPrimaryIP : (rawPrimaryIP != null ? String(rawPrimaryIP) : 'No IP');

  const safeInterfaces = Array.isArray(device.interface) ? device.interface : [];
  const activeInterfaces = safeInterfaces.filter(port => typeof port?.status === 'string' && port.status.includes('up/up')).length;
  const totalInterfaces = safeInterfaces.length;

  const getDeviceStatus = () => {
    const hasActivePort = safeInterfaces.some(port => typeof port?.status === 'string' && port.status.includes('up/up'));
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
            Last updated: {formatLastUpdated(device["last updated at"] as any)}
          </div>
        </div>

        <div className="device-status-info">
          <div className={`status ${status.toLowerCase()}`}>
            {status}
          </div>
          <button
            className="refresh-device-button"
            onClick={(e) => {
              e.stopPropagation();
              if (primaryIP && primaryIP !== 'No IP' && primaryIP !== 'unassigned') {
                onRefresh(primaryIP);
              }
            }}
            title="Refresh this device"
            disabled={!!isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceItem;

