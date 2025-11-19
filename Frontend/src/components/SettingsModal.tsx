import React, { useState } from 'react';
import './SettingsModal.css';
import { ProtocolMethod } from '../api/devices';
import { addCredential, AddCredentialPayload } from '../api/credentials';
import { useTheme } from '../theme/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocol: ProtocolMethod;
  onProtocolChange: (method: ProtocolMethod) => void;
  onDeviceAdded: () => Promise<void> | void;
}

const initialFormState: AddCredentialPayload = {
  device_type: '',
  ip: '',
  username: '',
  password: '',
  secret: '',
};

// Modal that groups together app-wide settings: theme toggle, preferred update
// protocol, and the form for onboarding new devices (calls
// /credentials/add_device).
const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  protocol,
  onProtocolChange,
  onDeviceAdded,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [formState, setFormState] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await addCredential(formState);
      setFormState(initialFormState);
      await onDeviceAdded();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Failed to add device.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <button className="settings-close" onClick={onClose}>
          ×
        </button>
        <h2>Settings</h2>

        <section className="settings-section">
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

        <section className="settings-section">
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

        <section className="settings-section">
          <h3>Add Device</h3>
          <p>Fill the credentials below and submit to call /credentials/add_device.</p>
          <form className="settings-form" onSubmit={handleSubmit}>
            <label>
              Device Type
              <input
                name="device_type"
                value={formState.device_type}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              IP Address
              <input
                name="ip"
                value={formState.ip}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Username
              <input
                name="username"
                value={formState.username}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                value={formState.password}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Secret
              <input
                type="password"
                name="secret"
                value={formState.secret}
                onChange={handleInputChange}
                required
              />
            </label>
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Add Device'}
            </button>
            {message && <p className="settings-message">{message}</p>}
          </form>
        </section>
      </div>
    </div>
  );
};

export default SettingsModal;
