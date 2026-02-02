import React from 'react';
import './DeviceCard.css';
import { DeviceRecord, DeviceStatus, ProtocolMethod } from '../../api/devices';
import { resolveDeviceIp } from '../../utils/deviceUtils';

interface DeviceCardProps {
  device: DeviceRecord;
  status: DeviceStatus;
  protocol: ProtocolMethod;
  onSelect: (device: DeviceRecord) => void;
  onRefresh: (ip: string) => Promise<void> | void;
}

// Shows the main snapshot for a single device. Clicking anywhere (except the
// update button) opens the detailed view.
const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  status,
  protocol,
  onSelect,
  onRefresh,
}) => {
  // Prefer the IP reported by the device, otherwise look at the credential.
  const deviceIp = resolveDeviceIp(device);
  const totalInterfaces = device.interfaces.length;
  const upInterfaces = device.interfaces.filter((iface) =>
    iface.status?.toLowerCase?.().includes('up')
  ).length;

  const handleRefreshClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent the click from bubbling up so it does not open the view.
    event.stopPropagation();
    if (!deviceIp) {
      return;
    }
    onRefresh(deviceIp);
  };

  const statusLabel =
    (status === 'active' && 'Active') ||
    (status === 'inactive' && 'Inactive') ||
    'Unauthorized';

  const statusClass = `device-card__status--${status}`;

  return (
    <div className="device-card" onClick={() => onSelect(device)}>
      <div className="device-card__header">
        <div>
          <h3 className="device-card__name">{device.hostname}</h3>
          <p className="device-card__ip">
            IP:{' '}
            {deviceIp ? (
              <span>{deviceIp}</span>
            ) : (
              <span className="device-card__ip--missing">No IP detected</span>
            )}
          </p>
        </div>
        <span className={`device-card__status ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="device-card__details">
        <div>
          <strong>{totalInterfaces}</strong>
          <span>Interfaces</span>
        </div>
        <div>
          <strong>{upInterfaces}</strong>
          <span>Interfaces Up</span>
        </div>
        <div>
          <span className="device-card__updated-label">Last updated</span>
          <span>{device.lastUpdatedAt}</span>
        </div>
      </div>

      <div className="device-card__actions">
        <button
          className="device-card__update-button"
          disabled={!deviceIp}
          onClick={handleRefreshClick}
        >
          Update ({protocol.toUpperCase()})
        </button>
      </div>
    </div>
  );
};

export default DeviceCard;
