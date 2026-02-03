import React, { useEffect, useState } from 'react';
import '../ViewPanel.css';
import './DeviceDetailsView.css';
import { type DeviceRecord, type ProtocolMethod } from '../../api/devices';
import { resolveDeviceIp } from '../../utils/deviceUtils';
import {
  deviceDetailsTabs,
  type DeviceDetailsStepId,
} from './deviceDetailsTabs';

export type { DeviceDetailsStepId } from './deviceDetailsTabs';

interface DeviceDetailsViewProps {
  device: DeviceRecord | null;
  protocol: ProtocolMethod;
  onProtocolChange: (method: ProtocolMethod) => void;
  onClose: () => void;
  initialStep?: DeviceDetailsStepId;
  onStepChange?: (step: DeviceDetailsStepId, label: string) => void;
}

// Detailed look at a single device with paginated sections to avoid long
// scrolling.
const DeviceDetailsView: React.FC<DeviceDetailsViewProps> = ({
  device,
  protocol,
  onProtocolChange,
  onClose,
  initialStep = 'details',
  onStepChange,
}) => {
  const [activeStep, setActiveStep] = useState<DeviceDetailsStepId>(
    initialStep ?? 'details'
  );

  const getStepLabel = (step: DeviceDetailsStepId) =>
    deviceDetailsTabs.find((config) => config.id === step)?.label ?? step;

  useEffect(() => {
    if (!device) {
      return;
    }

    const nextStep = initialStep ?? 'details';
    setActiveStep(nextStep);
    onStepChange?.(nextStep, getStepLabel(nextStep));
  }, [device, initialStep, onStepChange]);

  const setStep = (step: DeviceDetailsStepId) => {
    setActiveStep(step);
    onStepChange?.(step, getStepLabel(step));
  };

  if (!device) {
    return null;
  }

  const status = device.status;
  const deviceIp = resolveDeviceIp(device);
  const deviceIpLabel = deviceIp || 'Not available';
  const hasDeviceIp = Boolean(deviceIp);
  const currentStepIndex = deviceDetailsTabs.findIndex(
    (step) => step.id === activeStep
  );
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === deviceDetailsTabs.length - 1;

  const goToStep = (direction: 'prev' | 'next') => {
    setActiveStep((prev) => {
      const index = deviceDetailsTabs.findIndex((step) => step.id === prev);
      if (index === -1) {
        return prev;
      }

      const nextIndex =
        direction === 'prev'
          ? Math.max(index - 1, 0)
          : Math.min(index + 1, deviceDetailsTabs.length - 1);

      const nextStep = deviceDetailsTabs[nextIndex].id;
      onStepChange?.(nextStep, getStepLabel(nextStep));
      return nextStep;
    });
  };

  const renderStepContent = () => {
    const activeTab =
      deviceDetailsTabs.find((tab) => tab.id === activeStep) ??
      deviceDetailsTabs[0];

    return activeTab.render({
      device,
      protocol,
      onProtocolChange,
      deviceIpLabel,
      hasDeviceIp,
    });
  };

  return (
    <section className="view-panel details-view">
      <div className="details-header">
        <div className="details-header__row">
          <div className="details-header__title">
            <h2>{device.hostname}</h2>
            <span className={`status-chip status-chip--${status}`}>
              {status}
            </span>
          </div>
          <button
            className="nav-button nav-button--ghost"
            type="button"
            onClick={onClose}
          >
            Back to devices
          </button>
        </div>
        <p className="details-subtitle">
          IP {deviceIpLabel} | MAC {device.mac} | Updated {device.lastUpdatedAt}
        </p>
      </div>

      <div className="details-steps">
        {deviceDetailsTabs.map((step) => {
          const isActive = step.id === activeStep;
          return (
            <button
              key={step.id}
              className={`details-step ${
                isActive ? 'details-step--active' : ''
              }`}
              onClick={() => setStep(step.id)}
              type="button"
            >
              {step.label}
            </button>
          );
        })}
      </div>

      <div className="details-body">{renderStepContent()}</div>

      <div className="details-footer">
        <span className="details-footer__progress">
          Step {currentStepIndex + 1} of {deviceDetailsTabs.length}
        </span>
        <div className="details-footer__actions">
          <button
            className="nav-button nav-button--ghost"
            type="button"
            onClick={onClose}
          >
            Back to devices
          </button>
          <button
            className="nav-button"
            type="button"
            onClick={() => goToStep('prev')}
            disabled={isFirstStep}
          >
            Previous
          </button>
          <button
            className="nav-button nav-button--primary"
            type="button"
            onClick={() => (isLastStep ? onClose() : goToStep('next'))}
          >
            {isLastStep ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default DeviceDetailsView;
