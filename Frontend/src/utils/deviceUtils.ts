import { type DeviceRecord } from '../api/devices';
import { type CredentialRecord } from '../api/credentials';
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

export const buildCredentialMap = (
  credentials: CredentialRecord[]
): Record<string, CredentialRecord> => {
  const map: Record<string, CredentialRecord> = {};
  credentials.forEach((credential) => {
    if (credential.ip) {
      const key = normalizeIp(credential.ip);
      if (key) {
        map[key] = credential;
      }
    }
  });
  return map;
};

export const getAvailableDeviceTypes = (
  credentials: CredentialRecord[]
): string[] => {
  const deviceTypes = new Set<string>();
  credentials.forEach((credential) => {
    if (credential.device_type) {
      deviceTypes.add(credential.device_type);
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

export const findCredentialForDevice = (
  device: DeviceRecord,
  credentialMap: Record<string, CredentialRecord>
): CredentialRecord | undefined => {
  const primaryKey = normalizeIp(device.primaryIp);
  if (primaryKey && credentialMap[primaryKey]) {
    return credentialMap[primaryKey];
  }

  const interfaceKey = device.interfaces
    .map((iface) => normalizeIp(iface.ip_address))
    .find((key) => key && credentialMap[key]);

  if (interfaceKey) {
    return credentialMap[interfaceKey];
  }

  return undefined;
};

export const resolveDeviceIp = (
  device: DeviceRecord,
  credential?: CredentialRecord
): string | undefined => device.primaryIp || credential?.ip;
