import React from 'react';
import './Modal.css';
import { ProtocolMethod } from '../api/devices';
import { useTheme } from '../theme/ThemeContext';
import type { DeviceViewMode } from './DeviceList';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocol: ProtocolMethod;
  onProtocolChange: (method: ProtocolMethod) => void;
  viewMode: DeviceViewMode;
  onViewModeChange: (mode: DeviceViewMode) => void;
  useMockData: boolean;
  onUseMockDataChange: (enabled: boolean) => void;
  autoUpdateDeviceInterval: number;
  onAutoUpdateDeviceIntervalChange: (value: number) => void;
  autoUpdateMbpsInterval: number;
  onAutoUpdateMbpsIntervalChange: (value: number) => void;
  autoUpdateMethod: ProtocolMethod;
  onAutoUpdateMethodChange: (method: ProtocolMethod) => void;
  onStartAutoUpdate: () => Promise<void> | void;
  autoUpdateMessage: string | null;
  isStartingAutoUpdate: boolean;
}

// Modal that groups together app-wide settings: theme toggle, preferred update
// protocol.
const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  protocol,
  onProtocolChange,
  viewMode,
  onViewModeChange,
  useMockData,
  onUseMockDataChange,
  autoUpdateDeviceInterval,
  onAutoUpdateDeviceIntervalChange,
  autoUpdateMbpsInterval,
  onAutoUpdateMbpsIntervalChange,
  autoUpdateMethod,
  onAutoUpdateMethodChange,
  onStartAutoUpdate,
  autoUpdateMessage,
  isStartingAutoUpdate,
}) => {
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2>Settings</h2>

        <section className="modal-section">
          <h3>Theme</h3>
          <p>
            Toggle between light and dark mode. The selected mode is saved in
            your browser.
          </p>
          <label className="theme-toggle">
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={toggleTheme}
            />
            <span>{theme === 'dark' ? 'Dark mode' : 'Dark mode'}</span>
          </label>
        </section>

        <section className="modal-section">
          <h3>Single Device Update Protocol</h3>
          <p>Choose which protocol the Update button should use.</p>
          <label className="protocol-option">
            <input
              type="radio"
              name="protocol"
              value="snmp"
              checked={protocol === 'snmp'}
              onChange={() => onProtocolChange('snmp')}
            />
            SNMP
          </label>
          <label className="protocol-option">
            <input
              type="radio"
              name="protocol"
              value="cli"
              checked={protocol === 'cli'}
              onChange={() => onProtocolChange('cli')}
            />
            CLI
          </label>
        </section>
        <section className="modal-section">
          <h3>Automatic Updates</h3>
          <p>Kick off the backend job that keeps devices refreshed on a schedule.</p>
          <div
            className="modal-choice-row"
            role="group"
            aria-label="Automatic update protocol"
          >
            <span className="modal-choice-row__label">Protocol</span>
            <div className="modal-choice-row__options">
              <button
                type="button"
                className={`pill-toggle ${autoUpdateMethod === 'snmp' ? 'pill-toggle--active' : ''}`}
                onClick={() => onAutoUpdateMethodChange('snmp')}
              >
                SNMP
              </button>
              <button
                type="button"
                className={`pill-toggle ${autoUpdateMethod === 'cli' ? 'pill-toggle--active' : ''}`}
                onClick={() => onAutoUpdateMethodChange('cli')}
              >
                CLI
              </button>
            </div>
          </div>
          <div className="modal-form">
            <label>
              Device interval (seconds)
              <input
                type="number"
                min="0"
                value={autoUpdateDeviceInterval}
                onChange={(event) =>
                  onAutoUpdateDeviceIntervalChange(
                    Math.max(
                      0,
                      Number.parseInt(event.target.value, 10) || 0
                    )
                  )
                }
              />
            </label>
            <label>
              Mbps interval (seconds)
              <input
                type="number"
                min="0"
                value={autoUpdateMbpsInterval}
                onChange={(event) =>
                  onAutoUpdateMbpsIntervalChange(
                    Math.max(
                      0,
                      Number.parseInt(event.target.value, 10) || 0
                    )
                  )
                }
              />
            </label>
            <button
              type="button"
              onClick={onStartAutoUpdate}
              disabled={isStartingAutoUpdate}
            >
              {isStartingAutoUpdate ? 'Starting…' : 'Start automatic updates'}
            </button>
            {autoUpdateMessage && (
              <p className="modal-message">{autoUpdateMessage}</p>
            )}
          </div>
        </section>
        <section className="modal-section">
          <h3>Device List Layout</h3>
          <p>Switch between gallery cards and a simple list.</p>
          <label className="protocol-option">
            <input
              type="radio"
              name="viewMode"
              value="gallery"
              checked={viewMode === 'gallery'}
              onChange={() => onViewModeChange('gallery')}
            />
            Gallery
          </label>
          <label className="protocol-option">
            <input
              type="radio"
              name="viewMode"
              value="list"
              checked={viewMode === 'list'}
              onChange={() => onViewModeChange('list')}
            />
            List
          </label>
        </section>
        <section className="modal-section">
          <h3>Data Source</h3>
          <p>Show live API results or the bundled mock dataset.</p>
          <label className="protocol-option">
            <input
              type="radio"
              name="dataSource"
              value="api"
              checked={!useMockData}
              onChange={() => onUseMockDataChange(false)}
            />
            API (http://localhost:8000)
          </label>
          <label className="protocol-option">
            <input
              type="radio"
              name="dataSource"
              value="mock"
              checked={useMockData}
              onChange={() => onUseMockDataChange(true)}
            />
            Mock data (local)
          </label>
        </section>
      </div>
    </div>
  );
};

export default SettingsModal;
