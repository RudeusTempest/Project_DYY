import React from 'react';
import { NetworkDevice, NetworkInterface } from '../types';

type DeviceModalProps = {
  device: NetworkDevice | null;
  isOpen: boolean;
  onClose: () => void;
};

type CopyFeedback = {
  message: string;
  tone: 'success' | 'error';
};

const PortStatus: React.FC<{ interfaces: NetworkInterface[] }> = ({ interfaces }) => {
  const getStatusStr = (p: any): string => {
    const s = p?.status ?? p?.Status;
    return typeof s === 'string' ? s : '';
  };
  const getIp = (p: any): string => {
    const ip = p?.ip_address ?? p?.IP_Address ?? '';
    return typeof ip === 'string' ? ip : String(ip ?? '');
  };
  const hasAssignedIp = (ip: string) => {
    const normalized = ip.trim().toLowerCase();
    return normalized && !['unassigned', 'this', ''].includes(normalized);
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
          const ip = getIp(port);
          let portClass = 'port-inactive';
          if (isActive(s)) {
            portClass = hasAssignedIp(ip) ? 'port-active' : 'port-unauthorized';
          } else if (isUnauthorized(s)) {
            portClass = 'port-unauthorized';
          }
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
  const [copyFeedback, setCopyFeedback] = React.useState<CopyFeedback | null>(null);
  const feedbackTimeout = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (feedbackTimeout.current) {
        window.clearTimeout(feedbackTimeout.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!isOpen && feedbackTimeout.current) {
      window.clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = null;
    }
    if (!isOpen) {
      setCopyFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen || !device) return null;

  const formatLastUpdated = (lastUpdated: string | { $date: string }) => {
    if (typeof lastUpdated === 'string') {
      return lastUpdated;
    }
    return new Date(lastUpdated.$date).toLocaleString();
  };

  const showCopyFeedback = (message: string, tone: 'success' | 'error') => {
    if (feedbackTimeout.current) {
      window.clearTimeout(feedbackTimeout.current);
    }
    setCopyFeedback({ message, tone });
    feedbackTimeout.current = window.setTimeout(() => {
      setCopyFeedback(null);
      feedbackTimeout.current = null;
    }, 3000);
  };

  const copyToClipboard = (text: string) => {
    const clipboard = navigator?.clipboard;
    if (!clipboard?.writeText) {
      showCopyFeedback('Clipboard not supported in this browser', 'error');
      return;
    }

    clipboard
      .writeText(text)
      .then(() => {
        showCopyFeedback('Copied to clipboard', 'success');
      })
      .catch(() => {
        showCopyFeedback('Failed to copy to clipboard', 'error');
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
          {copyFeedback && (
            <div className={`copy-feedback ${copyFeedback.tone}`}>
              {copyFeedback.message}
            </div>
          )}
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

