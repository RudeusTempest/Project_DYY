import React from 'react';
import { type DeviceRecord } from '../../../api/devices';

interface DeviceTabInterfacesProps {
  device: DeviceRecord;
}

const formatCapacity = (iface: DeviceRecord['interfaces'][number]) => {
  const capacity = iface.bandwidth_max_mbps ?? iface.max_speed;
  return capacity !== undefined ? capacity.toLocaleString() : 'N/A';
};

const formatLoad = (iface: DeviceRecord['interfaces'][number]) => {
  const makeSegment = (label: string, current?: number, percent?: number) => {
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

  const rxSegment = makeSegment(
    'RX',
    iface.rxload_current,
    iface.rxload_percent
  );
  const txSegment = makeSegment(
    'TX',
    iface.txload_current,
    iface.txload_percent
  );

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
  const inputRate = resolveRateKbps(iface.input_rate_kbps, iface.mbps_received);
  const outputRate = resolveRateKbps(iface.output_rate_kbps, iface.mbps_sent);

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

const DeviceTabInterfaces: React.FC<DeviceTabInterfacesProps> = ({
  device,
}) => (
  <div className="step-section">
    <div className="panel">
      <h3>Interfaces</h3>
      {device.interfaces.length === 0 ? (
        <p>No interface data available.</p>
      ) : (
        <div className="details-table">
          <div className="details-table__header">
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
            <div key={iface.interface} className="details-table__row">
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
      )}
    </div>
  </div>
);

export default DeviceTabInterfaces;
