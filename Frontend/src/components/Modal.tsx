import React from 'react';
import { NetworkDevice, NetworkInterface } from '../types';

type DeviceModalProps = {
  device: NetworkDevice | null;
  isOpen: boolean;
  onClose: () => void;
};

const PortStatus: React.FC<{ interfaces: NetworkInterface[] }> = ({ interfaces }) => {
  return (
    <div className="port-status">
      <h4>Port Status</h4>
      <div className="ports-grid">
        {interfaces.map((port, index) => {
          const isActive = port.status.includes('up/up');
          const isUnauthorized = port.status.includes('not/authorized');

          let portClass = 'port-inactive';
          if (isActive) portClass = 'port-active';
          if (isUnauthorized) portClass = 'port-unauthorized';

          return (
            <div
              key={index}
              className={`port ${portClass}`}
              title={`${port.interface}: ${port.status}`}
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
                {device.interface.map((port, index) => (
                  <div key={index} className="interface-item">
                    <div>
                      <strong>{port.interface}:</strong>
                    </div>
                    <div>
                      IP: {port.ip_address}
                      {port.ip_address !== 'unassigned' && port.ip_address !== 'This' && (
                        <button onClick={() => copyToClipboard(port.ip_address)} className="copy-button">
                          Copy
                        </button>
                      )}
                    </div>
                    <div>Status: {port.status}</div>
                  </div>
                ))}
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

