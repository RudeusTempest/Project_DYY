import React, { useState } from 'react';
import './Modal.css';
import { addCredential, AddCredentialPayload } from '../api/credentials';
import { ProtocolMethod } from '../api/devices';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceAdded: () => Promise<void> | void;
}

type CredentialFormState = {
  device_type: string;
  ip: string;
  username: string;
  password: string;
  secret: string;
  snmp_password: string;
};

const initialFormState: CredentialFormState = {
  device_type: '',
  ip: '',
  username: '',
  password: '',
  secret: '',
  snmp_password: '',
};

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onDeviceAdded,
}) => {
  const [formState, setFormState] = useState<CredentialFormState>(initialFormState);
  const [method, setMethod] = useState<ProtocolMethod>('snmp');
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
      const payload: AddCredentialPayload = {
        device_type: formState.device_type,
        ip: formState.ip,
        username: formState.username,
        password: formState.password,
      };

      if (formState.secret.trim()) {
        payload.secret = formState.secret;
      }
      if (formState.snmp_password.trim()) {
        payload.snmp_password = formState.snmp_password;
      }

      await addCredential(payload, method);
      setFormState(initialFormState);
      setMethod('snmp');
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
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2>Add Device</h2>
        <p>Fill the credentials below and submit to call /credentials/add_device.</p>
        <div className="modal-choice-row" role="group" aria-label="Discovery method">
          <span className="modal-choice-row__label">Method</span>
          <div className="modal-choice-row__options">
            <button
              type="button"
              className={`pill-toggle ${method === 'snmp' ? 'pill-toggle--active' : ''}`}
              onClick={() => setMethod('snmp')}
            >
              SNMP
            </button>
            <button
              type="button"
              className={`pill-toggle ${method === 'cli' ? 'pill-toggle--active' : ''}`}
              onClick={() => setMethod('cli')}
            >
              CLI
            </button>
          </div>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
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
            Secret (optional)
            <input
              type="password"
              name="secret"
              value={formState.secret}
              onChange={handleInputChange}
            />
          </label>
          <label>
            SNMP Password (optional)
            <input
              type="password"
              name="snmp_password"
              value={formState.snmp_password}
              onChange={handleInputChange}
            />
          </label>
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Add Device'}
          </button>
          {message && <p className="modal-message">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default AddDeviceModal;
