import React, { useEffect } from 'react';
import './DeviceDetailsModal.css';
import {
  DeviceRecord,
  deriveDeviceStatus,
  ProtocolMethod,
} from '../api/devices';
import { CredentialRecord } from '../api/credentials';

interface DeviceDetailsModalProps {
  device: DeviceRecord | null;
  credential?: CredentialRecord;
  protocol: ProtocolMethod;
  onProtocolChange: (method: ProtocolMethod) => void;
  onClose: () => void;
}

// Detailed look at a single device. It shows interfaces, neighbors, a simple
// port grid, and credential information when available.
const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  device,
  credential,
  protocol,
  onProtocolChange,
  onClose,
}) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !device) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [device, onClose]);

  if (!device) {
    return null;
  }

  const status = deriveDeviceStatus(device);
  const deviceIp = device.primaryIp || credential?.ip;
  const deviceIpLabel = deviceIp || 'Not available';
  const hasDeviceIp = Boolean(deviceIp);

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleProtocolToggle = () => {
    const nextMethod: ProtocolMethod = protocol === 'snmp' ? 'cli' : 'snmp';
    onProtocolChange(nextMethod);
  };

  const formatCapacity = (iface: DeviceRecord['interfaces'][number]) => {
    const capacity = iface.bandwidth_max_mbps ?? iface.max_speed;
    return capacity !== undefined ? capacity.toLocaleString() : 'N/A';
  };

  const formatLoad = (iface: DeviceRecord['interfaces'][number]) => {
    const makeSegment = (
      label: string,
      current?: number,
      percent?: number
    ) => {
      const parts: string[] = [];
      if (typeof percent === 'number') {
        parts.push(`${percent}%`);
      }
      if (typeof current === 'number') {
        parts.push(current.toLocaleString());
      }
      if (parts.length === 0) {
        return '';
      }
      return `${label} ${parts.join(' / ')}`;
    };

    const rxSegment = makeSegment('RX', iface.rxload_current, iface.rxload_percent);
    const txSegment = makeSegment('TX', iface.txload_current, iface.txload_percent);

    if (rxSegment && txSegment) {
      return `${rxSegment} • ${txSegment}`;
    }
    return rxSegment || txSegment || 'N/A';
  };

  const resolveRateKbps = (rate?: number, fallbackMbps?: number) => {
    if (typeof rate === 'number') {
      return rate;
    }
    if (typeof fallbackMbps === 'number') {
      return Math.round(fallbackMbps * 1000);
    }
    return undefined;
  };

  const formatRates = (iface: DeviceRecord['interfaces'][number]) => {
    const inputRate = resolveRateKbps(
      iface.input_rate_kbps,
      iface.mbps_received
    );
    const outputRate = resolveRateKbps(
      iface.output_rate_kbps,
      iface.mbps_sent
    );

    const inputLabel =
      typeof inputRate === 'number'
        ? `In ${inputRate.toLocaleString()}`
        : '';
    const outputLabel =
      typeof outputRate === 'number'
        ? `Out ${outputRate.toLocaleString()}`
        : '';

    if (inputLabel && outputLabel) {
      return `${inputLabel} / ${outputLabel}`;
    }
    return inputLabel || outputLabel || 'N/A';
  };

  const formatErrors = (iface: DeviceRecord['interfaces'][number]) => {
    const segments = [
      ['CRC', iface.crc_errors],
      ['In', iface.input_errors],
      ['Out', iface.output_errors],
    ].filter(([, value]) => typeof value === 'number');

    if (segments.length === 0) {
      return 'N/A';
    }

    return segments
      .map(([label, value]) => `${label} ${(value as number).toLocaleString()}`)
      .join(' / ');
  };

  const formatMtu = (iface: DeviceRecord['interfaces'][number]) =>
    typeof iface.mtu === 'number' ? iface.mtu.toLocaleString() : 'N/A';

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2>{device.hostname}</h2>
        <p>
          <strong>IP:</strong> {deviceIpLabel}
        </p>
        <p>
          <strong>MAC:</strong> {device.mac}
        </p>
        <p>
          <strong>Status:</strong> {status}
        </p>
        <p>
          <strong>Last updated:</strong> {device.lastUpdatedAt}
        </p>
        <div className="modal-protocol-toggle">
          <div>
            <h3>Update method</h3>
            <p className="modal-protocol-toggle__note">
              Applies only to this device.
            </p>
          </div>
          <div className="modal-protocol-toggle__actions">
            <span className="modal-protocol-toggle__pill">
              {hasDeviceIp
                ? `Using ${protocol.toUpperCase()}`
                : 'No IP available'}
            </span>
            <button
              className="modal-protocol-toggle__button"
              onClick={handleProtocolToggle}
              disabled={!hasDeviceIp}
            >
              Switch to {protocol === 'snmp' ? 'CLI' : 'SNMP'}
            </button>
          </div>
        </div>

        {credential && (
          <div className="modal-section">
            <h3>Credentials</h3>
            <p>
              <strong>Device type:</strong> {credential.device_type}
            </p>
            <p>
              <strong>Username:</strong> {credential.username}
            </p>
          </div>
        )}

        <div className="modal-section">
          <h3>Interfaces</h3>
          <div className="modal-table">
            <div className="modal-table__header">
              <span>Name</span>
              <span>IP Address</span>
              <span>Status</span>
              <span>Capacity (Mbps)</span>
              <span>Load (Rx/Tx)</span>
              <span>Rates (Kbps)</span>
              <span>Errors</span>
              <span>MTU</span>
            </div>
            {device.interfaces.map((iface) => (
              <div key={iface.interface} className="modal-table__row">
                <span>{iface.interface}</span>
                <span>{iface.ip_address}</span>
                <span>{iface.status}</span>
                <span>{formatCapacity(iface)}</span>
                <span>{formatLoad(iface)}</span>
                <span>{formatRates(iface)}</span>
                <span>{formatErrors(iface)}</span>
                <span>{formatMtu(iface)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <h3>Port Status Grid</h3>
          <div className="port-grid">
            {device.interfaces.map((iface) => {
              const normalizedStatus = iface.status?.toLowerCase?.() ?? '';
              let state: 'active' | 'inactive' | 'unauthorized' = 'inactive';

              if (normalizedStatus.includes('unauth')) {
                state = 'unauthorized';
              } else if (normalizedStatus.includes('up')) {
                state = 'active';
              }

              return (
                <div
                  key={`${iface.interface}-square`}
                  className={`port-grid__item port-grid__item--${state}`}
                >
                  <span>{iface.interface}</span>
                  <small>{iface.status}</small>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-section">
          <h3>Neighbors</h3>
          {device.neighbors.length === 0 ? (
            <p>No neighbor information reported.</p>
          ) : (
            <ul className="neighbors-list">
              {device.neighbors.map((neighbor) => (
                <li key={`${neighbor.device_id}-${neighbor.local_interface}`}>
                  <strong>{neighbor.device_id}</strong> via{' '}
                  {neighbor.local_interface}
                  {neighbor.port_id ? ` → ${neighbor.port_id}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailsModal;
