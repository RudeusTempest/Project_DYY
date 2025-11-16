import React, { useMemo } from 'react';
import { NetworkDevice, NetworkInterface } from '../types';

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
  const macAddress = getMacAddress(device);

  const interfaceSnapshot = useMemo(() => {
    const safeInterfaces: NetworkInterface[] = Array.isArray(device.interface) ? device.interface : [];
    let activeInterfaces = 0;
    const candidateIps: string[] = [];

    safeInterfaces.forEach((port) => {
      const statusValue = typeof (port?.status ?? (port as any)?.Status) === 'string' ? (port?.status ?? (port as any)?.Status) : '';
      const normalizedStatus = statusValue.toLowerCase().replace(/\s+/g, '');
      if (normalizedStatus.includes('up/up')) {
        activeInterfaces++;
      }
      const ipValue = port?.ip_address ?? (port as any)?.IP_Address ?? (port as any)?.ip;
      if (ipValue == null) return;
      const ipString = typeof ipValue === 'string' ? ipValue : String(ipValue);
      const trimmed = ipString.trim();
      if (trimmed.length > 0) {
        candidateIps.push(trimmed);
      }
    });

    let primaryIp = candidateIps[0];
    if (!primaryIp) {
      const fallbackValue = safeInterfaces[0]?.ip_address ?? (safeInterfaces[0] as any)?.IP_Address;
      if (typeof fallbackValue === 'string') {
        primaryIp = fallbackValue;
      } else if (fallbackValue != null) {
        primaryIp = String(fallbackValue);
      }
    }
    if (!primaryIp) {
      primaryIp = 'No IP';
    }

    const status =
      device.hostname === 'Hostname not found'
        ? 'Unauthorized'
        : activeInterfaces > 0
        ? 'Active'
        : 'Inactive';

    return {
      totalInterfaces: safeInterfaces.length,
      activeInterfaces,
      primaryIp,
      status,
    };
  }, [device.hostname, device.interface]);
  const { totalInterfaces, activeInterfaces, primaryIp, status } = interfaceSnapshot;

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
            <span className="ip-address">{primaryIp}</span>
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
                const ip = updateIp ?? primaryIp;
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

