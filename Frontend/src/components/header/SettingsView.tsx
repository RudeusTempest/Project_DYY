import React from 'react';
import '../ViewPanel.css';
import { type ProtocolMethod } from '../../api/devices';
import { useTheme } from '../../theme/ThemeContext';
import type { DeviceViewMode } from '../device-list/DeviceList';

interface SettingsViewProps {
  onClose: () => void;
  protocol: ProtocolMethod;
  onProtocolChange: (method: ProtocolMethod) => void;
  viewMode: DeviceViewMode;
  onViewModeChange: (mode: DeviceViewMode) => void;
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

// View that groups together app-wide settings: theme toggle, preferred update
// protocol.
const SettingsView: React.FC<SettingsViewProps> = ({
  onClose,
  protocol,
  onProtocolChange,
  viewMode,
  onViewModeChange,
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

  return (
    <section className="view-panel">
      <div className="view-panel__header">
        <div>
          <h2>Settings</h2>
        </div>
        <button
          type="button"
          className="view-panel__back-button"
          onClick={onClose}
        >
          Back to devices
        </button>
      </div>

      <section className="view-panel__section">
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

      <section className="view-panel__section">
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
      <section className="view-panel__section">
        <h3>Automatic Updates</h3>
        <p>Kick off the backend job that keeps devices refreshed on a schedule.</p>
        <div
          className="view-panel__choice-row"
          role="group"
          aria-label="Automatic update protocol"
        >
          <span className="view-panel__choice-label">Protocol</span>
          <div className="view-panel__choice-options">
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
        <div className="view-panel__form">
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
            <p className="view-panel__message">{autoUpdateMessage}</p>
          )}
        </div>
      </section>
      <section className="view-panel__section">
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
    </section>
  );
};

export default SettingsView;
