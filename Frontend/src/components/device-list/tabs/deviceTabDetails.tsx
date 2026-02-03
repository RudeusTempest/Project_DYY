import React from 'react';
import { type DeviceRecord, type ProtocolMethod } from '../../../api/devices';

interface DeviceTabDetailsProps {
  device: DeviceRecord;
  protocol: ProtocolMethod;
  onProtocolChange: (method: ProtocolMethod) => void;
  deviceIpLabel: string;
  hasDeviceIp: boolean;
}

const DeviceTabDetails: React.FC<DeviceTabDetailsProps> = ({
  device,
  protocol,
  onProtocolChange,
  deviceIpLabel,
  hasDeviceIp,
}) => {
  const status = device.status;

  const handleProtocolToggle = () => {
    const nextMethod: ProtocolMethod = protocol === 'snmp' ? 'cli' : 'snmp';
    onProtocolChange(nextMethod);
  };

  return (
    <div className="step-section">
      <div className="panel">
        <h3>Device</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">IP</span>
            <strong className="detail-value">{deviceIpLabel}</strong>
          </div>
          <div className="detail-item">
            <span className="detail-label">MAC</span>
            <strong className="detail-value">{device.mac}</strong>
          </div>
          <div className="detail-item detail-item--status">
            <span className="detail-label">Status</span>
            <span className={`status-chip status-chip--${status}`}>
              {status}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Last updated</span>
            <strong className="detail-value">{device.lastUpdatedAt}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="details-protocol-toggle">
          <div>
            <h3>Update method</h3>
            <p className="details-protocol-toggle__note">
              Applies only to this device.
            </p>
          </div>
          <div className="details-protocol-toggle__actions">
            <span className="details-protocol-toggle__pill">
              {hasDeviceIp
                ? `Using ${protocol.toUpperCase()}`
                : 'No IP available'}
            </span>
            <button
              className="details-protocol-toggle__button"
              type="button"
              onClick={handleProtocolToggle}
              disabled={!hasDeviceIp}
            >
              Switch to {protocol === 'snmp' ? 'CLI' : 'SNMP'}
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Details</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Device type</span>
            <strong className="detail-value">
              {device.deviceType ?? 'Unknown'}
            </strong>
          </div>
          <div className="detail-item">
            <span className="detail-label">MAC</span>
            <strong className="detail-value">{device.mac}</strong>
          </div>
          <div className="detail-item">
            <span className="detail-label">Primary IP</span>
            <strong className="detail-value">{deviceIpLabel}</strong>
          </div>
          <div className="detail-item">
            <span className="detail-label">Last updated</span>
            <strong className="detail-value">{device.lastUpdatedAt}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceTabDetails;
