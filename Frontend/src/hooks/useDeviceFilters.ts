import { useEffect, useMemo, useState, useCallback } from 'react';
import { type DeviceRecord, type DeviceStatus } from '../api/devices';
import { normalizeMac } from '../utils/deviceUtils';

interface UseDeviceFiltersParams {
  devices: DeviceRecord[];
  deviceGroupsByMac: Record<string, string[]>;
  availableGroupNames: string[];
  availableDeviceTypes: string[];
  unreadAlertsByMac?: Record<string, number>;
}

export type DeviceStatusFilter = DeviceStatus | 'all' | 'unread';

export const useDeviceFilters = ({
  devices,
  deviceGroupsByMac,
  availableGroupNames,
  availableDeviceTypes,
  unreadAlertsByMac,
}: UseDeviceFiltersParams) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<DeviceStatusFilter>('all');

  useEffect(() => {
    if (
      selectedDeviceType !== 'all' &&
      !availableDeviceTypes.includes(selectedDeviceType)
    ) {
      setSelectedDeviceType('all');
    }
  }, [availableDeviceTypes, selectedDeviceType]);

  useEffect(() => {
    if (selectedGroup !== 'all' && !availableGroupNames.includes(selectedGroup)) {
      setSelectedGroup('all');
    }
  }, [availableGroupNames, selectedGroup]);

  const filteredDevices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return devices.filter((device) => {
      const hasUnreadAlerts =
        (unreadAlertsByMac?.[normalizeMac(device.mac)] ?? 0) > 0;

      if (statusFilter === 'unread') {
        if (!hasUnreadAlerts) {
          return false;
        }
      } else if (statusFilter !== 'all' && device.status !== statusFilter) {
        return false;
      }

      if (selectedGroup !== 'all') {
        const groupsForDevice =
          deviceGroupsByMac[normalizeMac(device.mac)] ?? [];
        if (!groupsForDevice.includes(selectedGroup)) {
          return false;
        }
      }

      if (selectedDeviceType !== 'all') {
        const deviceType = device.deviceType ?? '';
        if (deviceType.toLowerCase() !== selectedDeviceType.toLowerCase()) {
          return false;
        }
      }

      if (!term) {
        return true;
      }

      const hostnameMatch = device.hostname.toLowerCase().includes(term);
      const ipMatch = device.primaryIp
        ? device.primaryIp.toLowerCase().includes(term)
        : false;
      return hostnameMatch || ipMatch;
    });
  }, [
    devices,
    deviceGroupsByMac,
    searchTerm,
    selectedDeviceType,
    selectedGroup,
    statusFilter,
    unreadAlertsByMac,
  ]);

  const sidebarCounts = useMemo(() => {
    const counts = {
      total: devices.length,
      active: 0,
      inactive: 0,
      unauthorized: 0,
      unread: 0,
    };

    devices.forEach((device) => {
      const status = device.status;
      if (status === 'active') {
        counts.active += 1;
      } else if (status === 'inactive') {
        counts.inactive += 1;
      } else {
        counts.unauthorized += 1;
      }

      if ((unreadAlertsByMac?.[normalizeMac(device.mac)] ?? 0) > 0) {
        counts.unread += 1;
      }
    });

    return counts;
  }, [devices, unreadAlertsByMac]);

  const handleStatusFilterChange = useCallback(
    (status: DeviceStatusFilter) => {
      setStatusFilter((current) => (current === status ? 'all' : status));
    },
    []
  );

  return {
    searchTerm,
    setSearchTerm,
    selectedGroup,
    setSelectedGroup,
    selectedDeviceType,
    setSelectedDeviceType,
    statusFilter,
    handleStatusFilterChange,
    filteredDevices,
    sidebarCounts,
  };
};
