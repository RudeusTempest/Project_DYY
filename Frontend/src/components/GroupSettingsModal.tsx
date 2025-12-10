import React, { useEffect, useState } from 'react';
import './Modal.css';
import type { GroupWithMembers } from '../api/groups';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: GroupWithMembers[];
  onReloadGroups: () => Promise<void> | void;
  onAddGroup: (groupName: string, deviceMacs: string[]) => Promise<void>;
  onAssignDeviceToGroup: (groupName: string, deviceMac: string) => Promise<void>;
  onRemoveDeviceFromGroup: (groupName: string, deviceMac: string) => Promise<void>;
  onDeleteGroup: (groupName: string) => Promise<void>;
}

const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  isOpen,
  onClose,
  groups,
  onReloadGroups,
  onAddGroup,
  onAssignDeviceToGroup,
  onRemoveDeviceFromGroup,
  onDeleteGroup,
}) => {
  const [groupMessage, setGroupMessage] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMacs, setNewGroupMacs] = useState('');
  const [assignGroupName, setAssignGroupName] = useState('');
  const [assignDeviceMac, setAssignDeviceMac] = useState('');
  const [removeGroupName, setRemoveGroupName] = useState('');
  const [removeDeviceMac, setRemoveDeviceMac] = useState('');
  const [deleteGroupName, setDeleteGroupName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGroupMessage(null);
    }
  }, [isOpen]);

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
        <h2>Group Management</h2>
        <p className="modal-muted">
          Manage device groups. Actions will fail if the backend endpoint is unavailable.
        </p>

        <section className="modal-section">
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

export default GroupSettingsModal;
