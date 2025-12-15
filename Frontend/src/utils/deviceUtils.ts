import { type DeviceRecord } from '../api/devices';
import { type GroupWithMembers } from '../api/groups';

export const normalizeIp = (ip?: string): string => {
  if (!ip || typeof ip !== 'string') {
    return '';
  }
  return ip.toLowerCase().trim().split('/')[0];
};

export const normalizeMac = (mac?: string): string => {
  if (!mac || typeof mac !== 'string') {
    return '';
  }
  return mac.toLowerCase().replace(/[^a-f0-9]/g, '');
};

export const getAvailableDeviceTypes = (devices: DeviceRecord[]): string[] => {
  const deviceTypes = new Set<string>();
  devices.forEach((device) => {
    if (device.deviceType) {
      deviceTypes.add(device.deviceType);
    }
  });
  return Array.from(deviceTypes).sort((a, b) => a.localeCompare(b));
};

export const getAvailableGroupNames = (
  groups: GroupWithMembers[]
): string[] =>
  groups
    .map((group) => group.group)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

export const resolveDeviceIp = (device: DeviceRecord): string | undefined => {
  if (device.primaryIp) {
    return normalizeIp(device.primaryIp) || undefined;
  }

  const interfaceIp = device.interfaces
    .map((iface) => normalizeIp(iface.ip_address))
    .find((ip) => ip && ip !== 'unassigned' && ip !== 'unknown');

  return interfaceIp || undefined;
};
