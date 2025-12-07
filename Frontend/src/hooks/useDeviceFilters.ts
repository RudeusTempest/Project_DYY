import { useEffect, useMemo, useState, useCallback } from 'react';
import { type CredentialRecord } from '../api/credentials';
import { type DeviceRecord, type DeviceStatus } from '../api/devices';
import { normalizeMac } from '../utils/deviceUtils';

interface UseDeviceFiltersParams {
  devices: DeviceRecord[];
  deviceGroupsByMac: Record<string, string[]>;
  availableGroupNames: string[];
  availableDeviceTypes: string[];
  findCredentialForDevice: (
    device: DeviceRecord
  ) => CredentialRecord | undefined;
}

export const useDeviceFilters = ({
  devices,
  deviceGroupsByMac,
  availableGroupNames,
  availableDeviceTypes,
  findCredentialForDevice,
}: UseDeviceFiltersParams) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');

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
      if (statusFilter !== 'all' && device.status !== statusFilter) {
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
        const credential = findCredentialForDevice(device);
        const deviceType = credential?.device_type ?? '';
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
    findCredentialForDevice,
    searchTerm,
    selectedDeviceType,
    selectedGroup,
    statusFilter,
  ]);

  const sidebarCounts = useMemo(() => {
    const counts = {
      total: devices.length,
      active: 0,
      inactive: 0,
      unauthorized: 0,
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
    });

    return counts;
  }, [devices]);

  const handleStatusFilterChange = useCallback(
    (status: DeviceStatus | 'all') => {
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
