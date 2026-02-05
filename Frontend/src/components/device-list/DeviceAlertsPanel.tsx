import React, { useMemo } from 'react';
import './DeviceAlertsPanel.css';
import { type DeviceRecord } from '../../api/devices';
import { type AlertItem, type AlertSocketStatus } from '../../hooks/useAlerts';
import { normalizeIp, normalizeMac, resolveDeviceIp } from '../../utils/deviceUtils';

interface DeviceAlertsPanelProps {
  alerts: AlertItem[];
  devices: DeviceRecord[];
  socketStatus: AlertSocketStatus;
  socketError: string | null;
  onSelectAlert: (alert: AlertItem) => void;
  onClearAlerts: () => void;
}

const DeviceAlertsPanel: React.FC<DeviceAlertsPanelProps> = ({
  alerts,
  devices,
  socketStatus,
  socketError,
  onSelectAlert,
  onClearAlerts,
}) => {
  const deviceLookup = useMemo(() => {
    const byMac = new Map<string, DeviceRecord>();
    const byIp = new Map<string, DeviceRecord>();

    devices.forEach((device) => {
      const normalizedMac = normalizeMac(device.mac);
      if (normalizedMac) {
        byMac.set(normalizedMac, device);
      }

      const primaryIp = resolveDeviceIp(device);
      if (primaryIp) {
        const normalizedIp = normalizeIp(primaryIp);
        if (normalizedIp) {
          byIp.set(normalizedIp, device);
        }
      }

      device.interfaces.forEach((iface) => {
        const normalizedIp = normalizeIp(iface.ip_address);
        if (normalizedIp && normalizedIp !== 'unassigned' && normalizedIp !== 'unknown') {
          byIp.set(normalizedIp, device);
        }
      });
    });

    return { byMac, byIp };
  }, [devices]);

  const socketLabel = useMemo(() => {
    switch (socketStatus) {
      case 'open':
        return 'Connected';
      case 'connecting':
        return 'Connecting';
      case 'closed':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  }, [socketStatus]);

  const socketStatusClass = useMemo(() => {
    switch (socketStatus) {
      case 'open':
        return 'status-chip--active';
      case 'error':
        return 'status-chip--unauthorized';
      default:
        return 'status-chip--inactive';
    }
  }, [socketStatus]);

  const resolveDeviceForAlert = (alert: AlertItem): DeviceRecord | undefined => {
    const normalizedMac = alert.deviceMac ? normalizeMac(alert.deviceMac) : '';
    if (normalizedMac) {
      const deviceByMac = deviceLookup.byMac.get(normalizedMac);
      if (deviceByMac) {
        return deviceByMac;
      }
    }

    const normalizedIp = alert.deviceIp ? normalizeIp(alert.deviceIp) : '';
    if (normalizedIp) {
      return deviceLookup.byIp.get(normalizedIp);
    }

    return undefined;
  };

  const getDeviceLabel = (device?: DeviceRecord, fallbackIp?: string) => {
    if (device) {
      const ip = resolveDeviceIp(device);
      return ip ? `${device.hostname} (${ip})` : device.hostname;
    }

    return fallbackIp ? `Unknown device (${fallbackIp})` : 'Unknown device';
  };

  return (
    <aside className="device-alerts-panel">
      <div className="device-alerts-panel__card">
        <div className="device-alerts-panel__header">
          <div>
            <h3>Alerts</h3>
            <p className="muted-text">Live white list alerts.</p>
          </div>
          <div className="device-alerts-panel__actions">
            <span className={`status-chip ${socketStatusClass}`}>
              {socketLabel}
            </span>
            <button
              type="button"
              className="inline-button"
              onClick={onClearAlerts}
              disabled={alerts.length === 0}
            >
              Clear
            </button>
          </div>
        </div>
        {socketError && <p className="panel__error">{socketError}</p>}
        {alerts.length === 0 ? (
          <p className="muted-text">No alerts received yet.</p>
        ) : (
          <ul className="device-alerts-panel__list" aria-live="polite">
            {alerts.map((alert) => {
              const device = resolveDeviceForAlert(alert);
              const deviceLabel = getDeviceLabel(device, alert.deviceIp);
              return (
                <li key={alert.id} className="device-alerts-panel__list-item">
                  <button
                    type="button"
                    className="device-alerts-panel__item"
                    onClick={() => onSelectAlert(alert)}
                    disabled={!device}
                    aria-label={
                      device
                        ? `Open white list for ${device.hostname}`
                        : 'Alert has no matching device'
                    }
                  >
                    <span className="device-alerts-panel__item-message">
                      {alert.message}
                    </span>
                    <span className="device-alerts-panel__item-meta">
                      {deviceLabel}
                    </span>
                    <span className="device-alerts-panel__item-time">
                      {alert.receivedAt}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default DeviceAlertsPanel;
