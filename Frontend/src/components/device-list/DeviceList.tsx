import React from 'react';
import './DeviceList.css';
import DeviceCard from './DeviceCard';
import {
  DeviceRecord,
  ProtocolMethod,
} from '../../api/devices';
import { normalizeMac } from '../../utils/deviceUtils';

export type DeviceViewMode = 'gallery' | 'list';

interface DeviceListProps {
  devices: DeviceRecord[];
  getProtocolForDevice: (
    device: DeviceRecord
  ) => ProtocolMethod;
  onSelectDevice: (device: DeviceRecord) => void;
  onRefreshDevice: (ip: string) => Promise<void> | void;
  viewMode: DeviceViewMode;
  unreadAlertsByMac?: Record<string, number>;
}

// The device list simply handles layout and mapping over DeviceCard components.
// All heavy logic (fetching, status calculation, etc.) happens in App so this
// stays approachable.
const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  getProtocolForDevice,
  onSelectDevice,
  onRefreshDevice,
  viewMode,
  unreadAlertsByMac,
}) => {
  const renderContent = () => {
    if (devices.length === 0) {
      return (
        <p className="device-list__empty">
          No devices found. Try adjusting your search or refresh the data.
        </p>
      );
    }

    const containerClass =
      viewMode === 'gallery' ? 'device-list__grid' : 'device-list__list';

    return (
      <div className={containerClass}>
        {devices.map((device) => (
          <DeviceCard
            key={`${device.mac}-${device.hostname}`}
            device={device}
            protocol={getProtocolForDevice(device)}
            status={device.status}
            onSelect={onSelectDevice}
            onRefresh={onRefreshDevice}
            unreadAlerts={
              unreadAlertsByMac?.[normalizeMac(device.mac)] ?? 0
            }
          />
        ))}
      </div>
    );
  };

  return <section className="device-list">{renderContent()}</section>;
};

export default DeviceList;
