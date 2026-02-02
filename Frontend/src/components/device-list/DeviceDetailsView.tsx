import React, { useEffect, useState } from 'react';
import '../ViewPanel.css';
import './DeviceDetailsView.css';
import { type DeviceRecord, type ProtocolMethod } from '../../api/devices';
import { resolveDeviceIp } from '../../utils/deviceUtils';
import DeviceGroupsTab from './DeviceGroupsTab';

const stepConfig = [
  { id: 'details', label: 'Details' },
  { id: 'interfaces', label: 'Interfaces' },
  { id: 'ports', label: 'Ports' },
  { id: 'groups', label: 'Groups' },
] as const;

export type DeviceDetailsStepId = (typeof stepConfig)[number]['id'];

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
    stepConfig.find((config) => config.id === step)?.label ?? step;

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

  const handleProtocolToggle = () => {
    const nextMethod: ProtocolMethod = protocol === 'snmp' ? 'cli' : 'snmp';
    onProtocolChange(nextMethod);
  };

  const formatCapacity = (iface: DeviceRecord['interfaces'][number]) => {
    const capacity = iface.bandwidth_max_mbps ?? iface.max_speed;
    return capacity !== undefined ? capacity.toLocaleString() : 'N/A';
  };

  const formatLoad = (iface: DeviceRecord['interfaces'][number]) => {
    const makeSegment = (
      label: string,
      current?: number,
      percent?: number
    ) => {
      const parts: string[] = [];
      if (typeof percent === 'number') {
        parts.push(`${percent}%`);
      }
      if (typeof current === 'number') {
        parts.push(current.toLocaleString());
      }
      if (parts.length === 0) {
        return '';
      }
      return `${label} ${parts.join(' / ')}`;
    };

    const rxSegment = makeSegment(
      'RX',
      iface.rxload_current,
      iface.rxload_percent
    );
    const txSegment = makeSegment(
      'TX',
      iface.txload_current,
      iface.txload_percent
    );

    if (rxSegment && txSegment) {
      return `${rxSegment} • ${txSegment}`;
    }
    return rxSegment || txSegment || 'N/A';
  };

  const resolveRateKbps = (rate?: number, fallbackMbps?: number) => {
    if (typeof rate === 'number') {
      return rate;
    }
    if (typeof fallbackMbps === 'number') {
      return Math.round(fallbackMbps * 1000);
    }
    return undefined;
  };

  const formatRates = (iface: DeviceRecord['interfaces'][number]) => {
    const inputRate = resolveRateKbps(
      iface.input_rate_kbps,
      iface.mbps_received
    );
    const outputRate = resolveRateKbps(
      iface.output_rate_kbps,
      iface.mbps_sent
    );

    const inputLabel =
      typeof inputRate === 'number'
        ? `In ${inputRate.toLocaleString()}`
        : '';
    const outputLabel =
      typeof outputRate === 'number'
        ? `Out ${outputRate.toLocaleString()}`
        : '';

    if (inputLabel && outputLabel) {
      return `${inputLabel} / ${outputLabel}`;
    }
    return inputLabel || outputLabel || 'N/A';
  };

  const formatErrors = (iface: DeviceRecord['interfaces'][number]) => {
    const segments = [
      ['CRC', iface.crc_errors],
      ['In', iface.input_errors],
      ['Out', iface.output_errors],
    ].filter(([, value]) => typeof value === 'number');

    if (segments.length === 0) {
      return 'N/A';
    }

    return segments
      .map(([label, value]) => `${label} ${(value as number).toLocaleString()}`)
      .join(' / ');
  };

  const formatMtu = (iface: DeviceRecord['interfaces'][number]) =>
    typeof iface.mtu === 'number' ? iface.mtu.toLocaleString() : 'N/A';

  if (!device) {
    return null;
  }

  const status = device.status;
  const deviceIp = resolveDeviceIp(device);
  const deviceIpLabel = deviceIp || 'Not available';
  const hasDeviceIp = Boolean(deviceIp);
  const currentStepIndex = stepConfig.findIndex(
    (step) => step.id === activeStep
  );
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === stepConfig.length - 1;

  const goToStep = (direction: 'prev' | 'next') => {
    setActiveStep((prev) => {
      const index = stepConfig.findIndex((step) => step.id === prev);
      if (index === -1) {
        return prev;
      }

      const nextIndex =
        direction === 'prev'
          ? Math.max(index - 1, 0)
          : Math.min(index + 1, stepConfig.length - 1);

      const nextStep = stepConfig[nextIndex].id;
      onStepChange?.(nextStep, getStepLabel(nextStep));
      return nextStep;
    });
  };

  const renderCredentialsStep = () => (
    <div className="step-section">
      <div className="panel">
        <h3>Device</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">IP</span>
            <strong className="detail-value">{deviceIpLabel}</strong>
          </div>
          <div className="detail-item">
            <span className="detail-label">MAC</span>
            <strong className="detail-value">{device.mac}</strong>
          </div>
          <div className="detail-item detail-item--status">
            <span className="detail-label">Status</span>
            <span className={`status-chip status-chip--${status}`}>
              {status}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Last updated</span>
            <strong className="detail-value">{device.lastUpdatedAt}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="details-protocol-toggle">
          <div>
            <h3>Update method</h3>
            <p className="details-protocol-toggle__note">
              Applies only to this device.
            </p>
          </div>
          <div className="details-protocol-toggle__actions">
            <span className="details-protocol-toggle__pill">
              {hasDeviceIp
                ? `Using ${protocol.toUpperCase()}`
                : 'No IP available'}
            </span>
            <button
              className="details-protocol-toggle__button"
              type="button"
              onClick={handleProtocolToggle}
              disabled={!hasDeviceIp}
            >
              Switch to {protocol === 'snmp' ? 'CLI' : 'SNMP'}
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Details</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Device type</span>
            <strong className="detail-value">
              {device.deviceType ?? 'Unknown'}
            </strong>
          </div>
          <div className="detail-item">
            <span className="detail-label">MAC</span>
            <strong className="detail-value">{device.mac}</strong>
          </div>
          <div className="detail-item">
            <span className="detail-label">Primary IP</span>
            <strong className="detail-value">{deviceIpLabel}</strong>
          </div>
          <div className="detail-item">
            <span className="detail-label">Last updated</span>
            <strong className="detail-value">{device.lastUpdatedAt}</strong>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInterfacesStep = () => (
    <div className="step-section">
      <div className="panel">
        <h3>Interfaces</h3>
        {device.interfaces.length === 0 ? (
          <p>No interface data available.</p>
        ) : (
          <div className="details-table">
            <div className="details-table__header">
              <span>Name</span>
              <span>IP Address</span>
              <span>Status</span>
              <span>Capacity (Mbps)</span>
              <span>Load (Rx/Tx)</span>
              <span>Rates (Kbps)</span>
              <span>Errors</span>
              <span>MTU</span>
            </div>
            {device.interfaces.map((iface) => (
              <div key={iface.interface} className="details-table__row">
                <span>{iface.interface}</span>
                <span>{iface.ip_address}</span>
                <span>{iface.status}</span>
                <span>{formatCapacity(iface)}</span>
                <span>{formatLoad(iface)}</span>
                <span>{formatRates(iface)}</span>
                <span>{formatErrors(iface)}</span>
                <span>{formatMtu(iface)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPortsStep = () => (
    <div className="step-section">
      <div className="panel">
        <h3>Port Status</h3>
        <div className="port-grid">
          {device.interfaces.map((iface) => {
            const normalizedStatus = iface.status?.toLowerCase?.() ?? '';
            let state: 'active' | 'inactive' | 'unauthorized' = 'inactive';

            if (normalizedStatus.includes('unauth')) {
              state = 'unauthorized';
            } else if (normalizedStatus.includes('up')) {
              state = 'active';
            }

            return (
              <div
                key={`${iface.interface}-square`}
                className={`port-grid__item port-grid__item--${state}`}
              >
                <span>{iface.interface}</span>
                <small>{iface.status}</small>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h3>Neighbors</h3>
        {device.neighbors.length === 0 ? (
          <p>No neighbor information reported.</p>
        ) : (
          <ul className="neighbors-list">
            {device.neighbors.map((neighbor) => (
              <li key={`${neighbor.device_id}-${neighbor.local_interface}`}>
                <strong>{neighbor.device_id}</strong> via {neighbor.local_interface}
                {neighbor.port_id ? ` -> ${neighbor.port_id}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 'interfaces':
        return renderInterfacesStep();
      case 'ports':
        return renderPortsStep();
      case 'groups':
        return <DeviceGroupsTab device={device} />;
      default:
        return renderCredentialsStep();
    }
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
        {stepConfig.map((step) => {
          const isActive = step.id === activeStep;
          return (
            <button
              key={step.id}
              className={`details-step ${isActive ? 'details-step--active' : ''}`}
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
          Step {currentStepIndex + 1} of {stepConfig.length}
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
