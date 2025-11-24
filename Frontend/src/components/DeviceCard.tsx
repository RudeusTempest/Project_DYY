import React, { useEffect, useState } from 'react';
import './DeviceCard.css';
import { DeviceRecord, DeviceStatus, ProtocolMethod } from '../api/devices';
import { CredentialRecord } from '../api/credentials';

interface DeviceCardProps {
  device: DeviceRecord;
  credential?: CredentialRecord;
  status: DeviceStatus;
  protocol: ProtocolMethod;
  onSelect: (device: DeviceRecord) => void;
  onRefresh: (ip: string, method?: ProtocolMethod) => Promise<void> | void;
}

// Shows the main snapshot for a single device. Clicking anywhere (except the
// update button) opens the detailed modal.
const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  credential,
  status,
  protocol,
  onSelect,
  onRefresh,
}) => {
  // Prefer the IP reported by the device, otherwise look at the credential.
  const deviceIp = device.primaryIp || credential?.ip;
  const totalInterfaces = device.interfaces.length;
  const upInterfaces = device.interfaces.filter((iface) =>
    iface.status?.toLowerCase?.().includes('up')
  ).length;
  const [updateMethod, setUpdateMethod] = useState<ProtocolMethod>(protocol);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setUpdateMethod(protocol);
  }, [protocol]);

  const handleRefreshClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent the click from bubbling up so it does not open the modal.
    event.stopPropagation();
    if (!deviceIp) {
      return;
    }
    onRefresh(deviceIp, updateMethod);
    setIsSettingsOpen(false);
  };

  const handleSettingsToggle = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    setIsSettingsOpen((previous) => !previous);
  };

  const handleMethodSelect = (
    event: React.MouseEvent<HTMLButtonElement>,
    method: ProtocolMethod
  ) => {
    event.stopPropagation();
    setUpdateMethod(method);
    setIsSettingsOpen(false);
  };

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
        <div className="device-card__header-actions">
          <span
            className={`device-card__status device-card__status--${status}`}
          >
            {status === 'active' && 'Active'}
            {status === 'inactive' && 'Inactive'}
            {status === 'unauthorized' && 'Unauthorized'}
          </span>
          <div className="device-card__settings" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="device-card__settings-button"
              onClick={handleSettingsToggle}
              aria-expanded={isSettingsOpen}
              aria-haspopup="true"
            >
              Settings
            </button>
            {isSettingsOpen && (
              <div className="device-card__settings-menu">
                <p className="device-card__settings-title">Update via</p>
                <button
                  type="button"
                  className={`device-card__settings-option${
                    updateMethod === 'snmp' ? ' is-active' : ''
                  }`}
                  onClick={(event) => handleMethodSelect(event, 'snmp')}
                >
                  SNMP
                </button>
                <button
                  type="button"
                  className={`device-card__settings-option${
                    updateMethod === 'cli' ? ' is-active' : ''
                  }`}
                  onClick={(event) => handleMethodSelect(event, 'cli')}
                >
                  CLI
                </button>
              </div>
            )}
          </div>
        </div>
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

      <button
        className="device-card__update-button"
        disabled={!deviceIp}
        onClick={handleRefreshClick}
      >
        Update ({updateMethod.toUpperCase()})
      </button>
    </div>
  );
};

export default DeviceCard;
