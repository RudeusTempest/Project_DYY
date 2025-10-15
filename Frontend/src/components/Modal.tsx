import React from 'react';
import { NetworkDevice, NetworkInterface } from '../types';

type DeviceModalProps = {
  device: NetworkDevice | null;
  isOpen: boolean;
  onClose: () => void;
};

const PortStatus: React.FC<{ interfaces: NetworkInterface[] }> = ({ interfaces }) => {
  const getStatusStr = (p: any): string => {
    const s = p?.status ?? p?.Status;
    return typeof s === 'string' ? s : '';
  };

  const isActive = (s: string) => s.toLowerCase().replace(/\s+/g, '').includes('up/up');
  const isUnauthorized = (s: string) => {
    const n = s.toLowerCase().replace(/\s+/g, '');
    return n.includes('not/authorized') || n.includes('notauthorized');
  };

  return (
    <div className="port-status">
      <h4>Port Status</h4>
      <div className="ports-grid">
        {interfaces.map((port, index) => {
          const s = getStatusStr(port);
          let portClass = 'port-inactive';
          if (isActive(s)) portClass = 'port-active';
          if (isUnauthorized(s)) portClass = 'port-unauthorized';
          const name = (port as any)?.interface ?? (port as any)?.Interface ?? `Port ${index + 1}`;
          return (
            <div
              key={index}
              className={`port ${portClass}`}
              title={`${name}: ${s || 'unknown'}`}
            >
              {index + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DeviceModal: React.FC<DeviceModalProps> = ({ device, isOpen, onClose }) => {
  if (!isOpen || !device) return null;

  const formatLastUpdated = (lastUpdated: string | { $date: string }) => {
    if (typeof lastUpdated === 'string') {
      return lastUpdated;
    }
    return new Date(lastUpdated.$date).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert(`Copied: ${text}`);
      })
      .catch(() => {
        alert('Failed to copy to clipboard');
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Device Details</h2>
          <button onClick={onClose} className="close-button">X</button>
        </div>

        <div className="modal-body">
          <div className="device-details">
            <div className="detail-section">
              <h3>Device Information</h3>
              <div className="detail-item">
                <strong>Hostname:</strong> {device.hostname}
              </div>
              <div className="detail-item">
                <strong>MAC Address:</strong> {device.Mac}
                {device.Mac !== 'Not found' && (
                  <button onClick={() => copyToClipboard(device.Mac)} className="copy-button">
                    Copy
                  </button>
                )}
              </div>
              <div className="detail-item">
                <strong>Last Updated:</strong> {formatLastUpdated(device['last updated at'])}
              </div>
            </div>

            <div className="detail-section">
              <h3>Interface Details</h3>
              <div className="interfaces">
                {device.interface.map((port: any, index: number) => {
                  const name = port?.interface ?? port?.Interface ?? `Port ${index + 1}`;
                  const ip = port?.ip_address ?? port?.IP_Address ?? 'unassigned';
                  const status = typeof (port?.status ?? port?.Status) === 'string' ? (port?.status ?? port?.Status) : 'unknown';
                  const canCopy = ip !== 'unassigned' && ip !== 'This';
                  return (
                    <div key={index} className="interface-item">
                      <div>
                        <strong>{name}:</strong>
                      </div>
                      <div>
                        IP: {ip}
                        {canCopy && (
                          <button onClick={() => copyToClipboard(ip)} className="copy-button">
                            Copy
                          </button>
                        )}
                      </div>
                      <div>Status: {status}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <PortStatus interfaces={device.interface} />
        </div>
      </div>
    </div>
  );
};

export default DeviceModal;

