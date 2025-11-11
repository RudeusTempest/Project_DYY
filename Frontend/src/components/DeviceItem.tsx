import React from 'react';
import { NetworkDevice } from '../types';

type DeviceItemProps = {
  device: NetworkDevice;
  onClick: () => void;
  onUpdate: (ip: string) => void;
  isUpdating?: boolean;
  updateIp?: string | null;
};

const getMacAddress = (device: NetworkDevice): string => {
  const rawMac = (device as any)?.Mac ?? (device as any)?.mac;
  if (typeof rawMac === 'string') {
    const trimmed = rawMac.trim();
    if (trimmed.length > 0 && trimmed.toLowerCase() !== 'not found') {
      return trimmed;
    }
  }
  return 'Not found';
};

const DeviceItem: React.FC<DeviceItemProps> = ({ device, onClick, onUpdate, isUpdating, updateIp }) => {
  const rawPrimaryIP: any = Array.isArray(device.interface) ? device.interface?.[0]?.ip_address : undefined;
  const primaryIP = typeof rawPrimaryIP === 'string' ? rawPrimaryIP : (rawPrimaryIP != null ? String(rawPrimaryIP) : 'No IP');
  const macAddress = getMacAddress(device);

  const safeInterfaces = Array.isArray(device.interface) ? device.interface : [];
  const getStatusStr = (port: any) => {
    const s = (port && (port.status ?? port.Status)) as unknown;
    return typeof s === 'string' ? s : '';
  };
  const activeInterfaces = safeInterfaces.filter(port => getStatusStr(port).toLowerCase().replace(/\s+/g, '')
    .includes('up/up')).length;
  const totalInterfaces = safeInterfaces.length;

  const getDeviceStatus = () => {
    const hasActivePort = safeInterfaces.some(port => getStatusStr(port).toLowerCase().replace(/\s+/g, '')
      .includes('up/up'));
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
            <span className="mac-address">{macAddress}</span>
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
            className="update-device-button"
            onClick={(e) => {
              e.stopPropagation();
              const ip = updateIp ?? primaryIP;
              onUpdate(ip);
            }}
            title="Update this device"
            disabled={!!isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceItem;

