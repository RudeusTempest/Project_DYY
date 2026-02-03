import React from 'react';
import { type DeviceRecord } from '../../../api/devices';

interface DeviceTabPortsProps {
  device: DeviceRecord;
}

const DeviceTabPorts: React.FC<DeviceTabPortsProps> = ({
  device,
}) => (
  <div className="step-section">
    <div className="panel">
      <h3>Port Status</h3>
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

    <div className="panel">
      <h3>Neighbors</h3>
      {device.neighbors.length === 0 ? (
        <p>No neighbor information reported.</p>
      ) : (
        <ul className="neighbors-list">
          {device.neighbors.map((neighbor) => (
            <li key={`${neighbor.device_id}-${neighbor.local_interface}`}>
              <strong>{neighbor.device_id}</strong> via{' '}
              {neighbor.local_interface}
              {neighbor.port_id ? ` -> ${neighbor.port_id}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

export default DeviceTabPorts;
