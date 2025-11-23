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
            <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
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
      </div>
    </div>
  );
};

export default SettingsModal;
