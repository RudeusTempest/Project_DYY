import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type DeviceRecord } from '../../../api/devices';
import {
  addGroup,
  assignDeviceToGroup,
  deleteDeviceFromGroup,
  fetchAllGroups,
  type GroupWithMembers,
} from '../../../api/groups';
import { normalizeMac } from '../../../utils/deviceUtils';

interface DeviceTabGroupsProps {
  device: DeviceRecord;
}

// Standalone tab that manages group membership for a single device.
const DeviceTabGroups: React.FC<DeviceTabGroupsProps> = ({
  device,
}) => {
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    'add' | 'remove' | 'create' | null
  >(null);
  const [selectedGroupToAdd, setSelectedGroupToAdd] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  const loadGroups = useCallback(
    async (showErrors = true) => {
      setGroupsLoading(true);
      if (showErrors) {
        setGroupsError(null);
      }

      try {
        const latestGroups = await fetchAllGroups();
        setGroups(latestGroups);
      } catch (error) {
        if (showErrors) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unable to load groups for this device.';
          setGroupsError(message);
        }
      } finally {
        setGroupsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setGroups([]);
    setSelectedGroupToAdd('');
    setNewGroupName('');
    setPendingAction(null);
    setGroupsError(null);
    loadGroups();
  }, [device.mac, loadGroups]);

  const normalizedDeviceMac = useMemo(
    () => normalizeMac(device.mac),
    [device.mac]
  );

  const memberGroups = useMemo(() => {
    if (!normalizedDeviceMac) {
      return [];
    }

    return groups
      .filter((group) =>
        (group.device_macs ?? []).some(
          (mac) => normalizeMac(mac) === normalizedDeviceMac
        )
      )
      .map((group) => group.group)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [groups, normalizedDeviceMac]);

  const availableGroups = useMemo(() => {
    const available = groups
      .map((group) => group.group)
      .filter(Boolean)
      .filter((name) => !memberGroups.includes(name));

    return Array.from(new Set(available)).sort((a, b) => a.localeCompare(b));
  }, [groups, memberGroups]);

  const runGroupAction = useCallback(
    async (
      actionType: 'add' | 'remove' | 'create',
      action: () => Promise<void>
    ) => {
      setPendingAction(actionType);
      setGroupsError(null);

      try {
        await action();
        await loadGroups();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Group action failed.';
        setGroupsError(message);
      } finally {
        setPendingAction(null);
      }
    },
    [loadGroups]
  );

  const handleAddToGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = selectedGroupToAdd.trim();

    if (!cleanName) {
      setGroupsError('Select a group to add this device.');
      return;
    }

    await runGroupAction('add', async () => {
      await assignDeviceToGroup(device.mac, cleanName);
    });
    setSelectedGroupToAdd('');
  };

  const handleRemoveFromGroup = async (groupName: string) => {
    const cleanName = groupName.trim();
    if (!cleanName) {
      return;
    }

    await runGroupAction('remove', async () => {
      await deleteDeviceFromGroup(device.mac, cleanName);
    });
  };

  const handleCreateGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = newGroupName.trim();

    if (!cleanName) {
      setGroupsError('Group name is required.');
      return;
    }

    await runGroupAction('create', async () => {
      await addGroup({ group: cleanName, device_macs: [device.mac] });
    });
    setNewGroupName('');
  };

  return (
    <div className="step-section">
      <div className="panel">
        <div className="panel__header-row">
          <h3>Group membership</h3>
          <button
            type="button"
            className="inline-button"
            onClick={() => loadGroups()}
            disabled={groupsLoading}
          >
            {groupsLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="muted-text">
          Add or remove this device from groups. The MAC address is filled in automatically.
        </p>
        {groupsError && <p className="panel__error">{groupsError}</p>}
        {groupsLoading ? (
          <p className="muted-text">Loading groups...</p>
        ) : groupsError && groups.length === 0 ? (
          <p className="muted-text">Unable to load groups right now.</p>
        ) : memberGroups.length === 0 ? (
          <p className="muted-text">This device is not in any groups yet.</p>
        ) : (
          <div className="group-chip-row">
            {memberGroups.map((groupName) => (
              <span key={groupName} className="group-chip">
                <span className="group-chip__label">{groupName}</span>
                <button
                  type="button"
                  className="group-chip__remove"
                  onClick={() => handleRemoveFromGroup(groupName)}
                  disabled={pendingAction === 'remove'}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Add to existing group</h3>
        <form className="group-form" onSubmit={handleAddToGroup}>
          <select
            value={selectedGroupToAdd}
            onChange={(event) => setSelectedGroupToAdd(event.target.value)}
            disabled={
              groupsLoading ||
              pendingAction === 'add' ||
              availableGroups.length === 0
            }
          >
            <option value="">Select a group</option>
            {availableGroups.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="nav-button nav-button--primary"
            disabled={
              !selectedGroupToAdd ||
              groupsLoading ||
              pendingAction === 'add'
            }
          >
            {pendingAction === 'add' ? 'Adding...' : 'Add'}
          </button>
        </form>
        {!groupsLoading && availableGroups.length === 0 && (
          <p className="muted-text">
            No other groups available. Create one below.
          </p>
        )}
      </div>

      <div className="panel">
        <h3>Create and add</h3>
        <form className="group-form" onSubmit={handleCreateGroup}>
          <input
            type="text"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            placeholder="New group name"
            disabled={groupsLoading || pendingAction === 'create'}
          />
          <button
            type="submit"
            className="nav-button"
            disabled={
              !newGroupName.trim() ||
              groupsLoading ||
              pendingAction === 'create'
            }
          >
            {pendingAction === 'create' ? 'Creating...' : 'Create + add'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeviceTabGroups;
