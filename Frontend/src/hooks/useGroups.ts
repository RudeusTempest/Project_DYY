import { useCallback, useEffect, useMemo, useState } from 'react';
import { type DeviceRecord } from '../api/devices';
import {
  addGroup,
  assignDeviceToGroup,
  deleteDeviceFromGroup,
  deleteGroup,
  fetchAllGroups,
  type GroupWithMembers,
} from '../api/groups';
import {
  getAvailableGroupNames,
  normalizeMac,
} from '../utils/deviceUtils';

interface UseGroupsParams {
  useMockData: boolean;
  devices: DeviceRecord[];
}

export const useGroups = ({ useMockData, devices }: UseGroupsParams) => {
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);

  const loadGroupsWithMembers = useCallback(
    async (silentOnError = true): Promise<GroupWithMembers[]> => {
      try {
        const groupsWithMembers = await fetchAllGroups();
        if (!Array.isArray(groupsWithMembers) || groupsWithMembers.length === 0) {
          return [];
        }

        return groupsWithMembers
          .filter(
            (group): group is GroupWithMembers =>
              Boolean(group && group.group)
          )
          .map((group) => ({
            group: group.group,
            device_macs: Array.isArray(group.device_macs) ? group.device_macs : [],
          }));
      } catch (groupError) {
        console.warn('Failed to load groups', groupError);
        if (!silentOnError) {
          throw groupError instanceof Error
            ? groupError
            : new Error('Failed to load groups');
        }
        return [];
      }
    },
    []
  );

  const ensureGroupActionsAllowed = useCallback(() => {
    if (useMockData) {
      throw new Error('Group management is disabled while showing mock data.');
    }
  }, [useMockData]);

  const refreshGroups = useCallback(
    async (silentOnError = true) => {
      if (useMockData) {
        setGroups([]);
        return;
      }
      const latestGroups = await loadGroupsWithMembers(silentOnError);
      setGroups(latestGroups);
    },
    [loadGroupsWithMembers, useMockData]
  );

  useEffect(() => {
    refreshGroups().catch(() => null);
  }, [refreshGroups]);

  const reloadGroupsOnly = useCallback(async () => {
    ensureGroupActionsAllowed();
    await refreshGroups(false);
  }, [ensureGroupActionsAllowed, refreshGroups]);

  const handleAddGroup = useCallback(
    async (groupName: string, deviceMacs: string[]) => {
      ensureGroupActionsAllowed();
      const cleanName = groupName.trim();
      if (!cleanName) {
        throw new Error('Group name is required.');
      }

      const cleanMacs = deviceMacs
        .map((mac) => mac.trim())
        .filter((mac) => mac.length > 0);

      await addGroup({ group: cleanName, device_macs: cleanMacs });
      await refreshGroups(false);
    },
    [ensureGroupActionsAllowed, refreshGroups]
  );

  const handleAssignDeviceToGroup = useCallback(
    async (groupName: string, deviceMac: string) => {
      ensureGroupActionsAllowed();
      const cleanName = groupName.trim();
      const cleanMac = deviceMac.trim();
      if (!cleanName || !cleanMac) {
        throw new Error('Group name and device MAC are required.');
      }

      await assignDeviceToGroup(cleanMac, cleanName);
      await refreshGroups(false);
    },
    [ensureGroupActionsAllowed, refreshGroups]
  );

  const handleRemoveDeviceFromGroup = useCallback(
    async (groupName: string, deviceMac: string) => {
      ensureGroupActionsAllowed();
      const cleanName = groupName.trim();
      const cleanMac = deviceMac.trim();
      if (!cleanName || !cleanMac) {
        throw new Error('Group name and device MAC are required.');
      }

      await deleteDeviceFromGroup(cleanMac, cleanName);
      await refreshGroups(false);
    },
    [ensureGroupActionsAllowed, refreshGroups]
  );

  const handleDeleteGroup = useCallback(
    async (groupName: string) => {
      ensureGroupActionsAllowed();
      const cleanName = groupName.trim();
      if (!cleanName) {
        throw new Error('Group name is required.');
      }

      await deleteGroup(cleanName);
      await refreshGroups(false);
    },
    [ensureGroupActionsAllowed, refreshGroups]
  );

  const deviceGroupsByMac = useMemo(() => {
    const mapping: Record<string, string[]> = {};

    groups.forEach((group) => {
      const groupName = group.group;
      if (!groupName) {
        return;
      }

      (group.device_macs ?? []).forEach((mac) => {
        const normalizedMac = normalizeMac(mac);
        if (!normalizedMac) {
          return;
        }
        if (!mapping[normalizedMac]) {
          mapping[normalizedMac] = [];
        }
        if (!mapping[normalizedMac].includes(groupName)) {
          mapping[normalizedMac].push(groupName);
        }
      });
    });

    return mapping;
  }, [groups]);

  const sidebarGroupItems = useMemo(() => {
    if (!groups.length) {
      return [];
    }

    const deviceMacs = new Set(
      devices.map((device) => normalizeMac(device.mac)).filter(Boolean)
    );

    return groups
      .map((group) => {
        const members = Array.isArray(group.device_macs)
          ? group.device_macs
          : [];
        const uniqueMembers = new Set(
          members.map((mac) => normalizeMac(mac)).filter(Boolean)
        );

        let count = 0;
        uniqueMembers.forEach((mac) => {
          if (deviceMacs.has(mac)) {
            count += 1;
          }
        });

        return { name: group.group, deviceCount: count };
      })
      .filter((item) => Boolean(item.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [devices, groups]);

  const availableGroupNames = useMemo(
    () => getAvailableGroupNames(groups),
    [groups]
  );

  return {
    groups,
    availableGroupNames,
    deviceGroupsByMac,
    sidebarGroupItems,
    reloadGroupsOnly,
    refreshGroups,
    handleAddGroup,
    handleAssignDeviceToGroup,
    handleRemoveDeviceFromGroup,
    handleDeleteGroup,
  };
};
