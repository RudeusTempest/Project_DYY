import React, { useState } from 'react';
import './Modal.css';
import { ProtocolMethod } from '../api/devices';
import { useTheme } from '../theme/ThemeContext';
import type { DeviceViewMode } from './DeviceList';
import type { GroupWithMembers } from '../api/groups';

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
  groups: GroupWithMembers[];
  onReloadGroups: () => Promise<void> | void;
  onAddGroup: (groupName: string, deviceMacs: string[]) => Promise<void>;
  onAssignDeviceToGroup: (groupName: string, deviceMac: string) => Promise<void>;
  onRemoveDeviceFromGroup: (groupName: string, deviceMac: string) => Promise<void>;
  onDeleteGroup: (groupName: string) => Promise<void>;
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
  groups,
  onReloadGroups,
  onAddGroup,
  onAssignDeviceToGroup,
  onRemoveDeviceFromGroup,
  onDeleteGroup,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [groupMessage, setGroupMessage] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMacs, setNewGroupMacs] = useState('');
  const [assignGroupName, setAssignGroupName] = useState('');
  const [assignDeviceMac, setAssignDeviceMac] = useState('');
  const [removeGroupName, setRemoveGroupName] = useState('');
  const [removeDeviceMac, setRemoveDeviceMac] = useState('');
  const [deleteGroupName, setDeleteGroupName] = useState('');

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

  const handleGroupAction = async (
    action: () => Promise<void>,
    successMessage: string
  ) => {
    setGroupMessage(null);
    try {
      await action();
      setGroupMessage(successMessage);
    } catch (err) {
      setGroupMessage(
        err instanceof Error ? err.message : 'Group action failed.'
      );
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

        <section className="modal-section">
          <h3>Group Management</h3>
          <p>Manage device groups. Actions will fail if the backend endpoint is unavailable.</p>

          <div className="group-list">
            <div className="group-list__header">
              <span>Groups ({groups.length})</span>
              <button
                type="button"
                className="modal-ghost-button"
                onClick={() =>
                  handleGroupAction(
                    async () => {
                      await onReloadGroups();
                    },
                    'Groups refreshed.'
                  )
                }
              >
                Refresh
              </button>
            </div>
            {groups.length === 0 ? (
              <p className="modal-muted">No groups found.</p>
            ) : (
              <ul className="group-list__items">
                {groups.map((group) => (
                  <li key={group.group} className="group-list__item">
                    <div>
                      <strong>{group.group}</strong>
                      <p className="modal-muted">
                        {group.device_macs?.length ?? 0} device(s)
                      </p>
                    </div>
                    <div className="group-list__chips">
                      {(group.device_macs ?? []).slice(0, 4).map((mac) => (
                        <span key={mac} className="group-chip">
                          {mac}
                        </span>
                      ))}
                      {(group.device_macs ?? []).length > 4 && (
                        <span className="group-chip">
                          +{(group.device_macs ?? []).length - 4} more
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="group-forms">
            <div className="group-form">
              <h4>Add group</h4>
              <div className="modal-form">
                <label>
                  Group name
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(event) => setNewGroupName(event.target.value)}
                    placeholder="e.g., datacenter"
                  />
                </label>
                <label>
                  Device MACs (comma-separated)
                  <input
                    type="text"
                    value={newGroupMacs}
                    onChange={(event) => setNewGroupMacs(event.target.value)}
                    placeholder="aa:bb:cc:dd:ee:ff, 11:22:33:44:55:66"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleGroupAction(
                      async () => {
                        const macs = newGroupMacs
                          .split(',')
                          .map((mac) => mac.trim());
                        await onAddGroup(newGroupName, macs);
                        setNewGroupName('');
                        setNewGroupMacs('');
                      },
                      'Group added.'
                    )
                  }
                >
                  Add group
                </button>
              </div>
            </div>

            <div className="group-form">
              <h4>Assign device to group</h4>
              <div className="modal-form">
                <label>
                  Group name
                  <input
                    type="text"
                    value={assignGroupName}
                    onChange={(event) =>
                      setAssignGroupName(event.target.value)
                    }
                    placeholder="apple"
                  />
                </label>
                <label>
                  Device MAC
                  <input
                    type="text"
                    value={assignDeviceMac}
                    onChange={(event) =>
                      setAssignDeviceMac(event.target.value)
                    }
                    placeholder="50:00:00:04:00:00"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleGroupAction(
                      async () => {
                        await onAssignDeviceToGroup(
                          assignGroupName,
                          assignDeviceMac
                        );
                        setAssignGroupName('');
                        setAssignDeviceMac('');
                      },
                      'Device assigned to group.'
                    )
                  }
                >
                  Assign
                </button>
              </div>
            </div>

            <div className="group-form">
              <h4>Remove device from group</h4>
              <div className="modal-form">
                <label>
                  Group name
                  <input
                    type="text"
                    value={removeGroupName}
                    onChange={(event) =>
                      setRemoveGroupName(event.target.value)
                    }
                    placeholder="apple"
                  />
                </label>
                <label>
                  Device MAC
                  <input
                    type="text"
                    value={removeDeviceMac}
                    onChange={(event) =>
                      setRemoveDeviceMac(event.target.value)
                    }
                    placeholder="50:00:00:04:00:00"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleGroupAction(
                      async () => {
                        await onRemoveDeviceFromGroup(
                          removeGroupName,
                          removeDeviceMac
                        );
                        setRemoveGroupName('');
                        setRemoveDeviceMac('');
                      },
                      'Device removed from group.'
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="group-form">
              <h4>Delete group (pre-wired)</h4>
              <p className="modal-muted">
                Calls the future <code>/groups/delete_group</code> endpoint when
                available.
              </p>
              <div className="modal-form">
                <label>
                  Group name
                  <input
                    type="text"
                    value={deleteGroupName}
                    onChange={(event) =>
                      setDeleteGroupName(event.target.value)
                    }
                    placeholder="apple"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleGroupAction(
                      async () => {
                        await onDeleteGroup(deleteGroupName);
                        setDeleteGroupName('');
                      },
                      'Delete request sent.'
                    )
                  }
                >
                  Delete group
                </button>
              </div>
            </div>
          </div>
          {groupMessage && <p className="modal-message">{groupMessage}</p>}
        </section>
      </div>
    </div>
  );
};

export default SettingsModal;
