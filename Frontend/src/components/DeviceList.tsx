import React from 'react';
import './DeviceList.css';
import DeviceCard from './DeviceCard';
import {
  DeviceRecord,
  ProtocolMethod,
} from '../api/devices';
import { CredentialRecord } from '../api/credentials';

export type DeviceViewMode = 'gallery' | 'list';

interface DeviceListProps {
  devices: DeviceRecord[];
  findCredentialForDevice: (
    device: DeviceRecord
  ) => CredentialRecord | undefined;
  getProtocolForDevice: (
    device: DeviceRecord,
    credential?: CredentialRecord
  ) => ProtocolMethod;
  onSelectDevice: (device: DeviceRecord) => void;
  onRefreshDevice: (ip: string) => Promise<void> | void;
  viewMode: DeviceViewMode;
}

// The device list simply handles layout and mapping over DeviceCard components.
// All heavy logic (fetching, status calculation, etc.) happens in App so this
// stays approachable.
const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  findCredentialForDevice,
  getProtocolForDevice,
  onSelectDevice,
  onRefreshDevice,
  viewMode,
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
        {devices.map((device) => {
          const relatedCredential = findCredentialForDevice(device);
          const protocolForDevice = getProtocolForDevice(
            device,
            relatedCredential
          );

          return (
            <DeviceCard
              key={`${device.mac}-${device.hostname}`}
              device={device}
              credential={relatedCredential}
              protocol={protocolForDevice}
              status={device.status}
              onSelect={onSelectDevice}
              onRefresh={onRefreshDevice}
            />
          );
        })}
      </div>
    );
  };

  return <section className="device-list">{renderContent()}</section>;
};

export default DeviceList;
