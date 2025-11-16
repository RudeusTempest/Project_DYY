import React, { useEffect, useMemo, useState } from 'react';

export type AddDevicePayload = {
  device_type: string;
  ip: string;
  username: string;
  password: string;
  secret?: string;
};

type AddDeviceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AddDevicePayload) => Promise<void>;
};

const initialFormState: AddDevicePayload = {
  device_type: '',
  ip: '',
  username: '',
  password: '',
  secret: '',
};

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formValues, setFormValues] = useState<AddDevicePayload>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormValues(initialFormState);
      setFeedback(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const trimmedValues = useMemo(() => {
    return {
      device_type: formValues.device_type.trim(),
      ip: formValues.ip.trim(),
      username: formValues.username.trim(),
      password: formValues.password.trim(),
      secret: formValues.secret?.trim() ?? '',
    };
  }, [formValues]);

  const handleChange = (field: keyof AddDevicePayload) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requiredFields: Array<keyof AddDevicePayload> = ['device_type', 'ip', 'username', 'password'];
    const missingField = requiredFields.find((field) => !trimmedValues[field]);
    if (missingField) {
      setFeedback({
        tone: 'error',
        message: `Please provide a value for ${missingField.replace(/_/g, ' ')}.`,
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onSubmit(trimmedValues);
      setFeedback({
        tone: 'success',
        message: 'Device added successfully.',
      });
      setFormValues(initialFormState);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to add device. Please try again.';
      setFeedback({
        tone: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content add-device-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Device</h2>
          <button type="button" onClick={handleClose} className="close-button">
            X
          </button>
        </div>
        <form className="modal-body add-device-form" onSubmit={handleSubmit}>
          {feedback && (
            <div className={`form-feedback ${feedback.tone}`}>
              {feedback.message}
            </div>
          )}
          <div className="form-grid">
            <label>
              <span>Device Type</span>
              <input
                type="text"
                name="device_type"
                placeholder="Switch / Router"
                value={formValues.device_type}
                onChange={handleChange('device_type')}
                disabled={isSubmitting}
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>Management IP</span>
              <input
                type="text"
                name="ip"
                placeholder="192.168.1.10"
                value={formValues.ip}
                onChange={handleChange('ip')}
                disabled={isSubmitting}
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>Username</span>
              <input
                type="text"
                name="username"
                placeholder="admin"
                value={formValues.username}
                onChange={handleChange('username')}
                disabled={isSubmitting}
                autoComplete="username"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formValues.password}
                onChange={handleChange('password')}
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              <span>Secret (optional)</span>
              <input
                type="password"
                name="secret"
                placeholder="Secret"
                value={formValues.secret}
                onChange={handleChange('secret')}
                disabled={isSubmitting}
                autoComplete="off"
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="secondary-action-button"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="primary-action-button" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeviceModal;
