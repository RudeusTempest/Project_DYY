import { useCallback, useEffect, useState } from 'react';
import {
  fetchAllDevices,
  fetchDeviceByIp,
  refreshDeviceByIp,
  type DeviceRecord,
  type ProtocolMethod,
} from '../api/devices';
import {
  fetchAllCredentials,
  type CredentialRecord,
} from '../api/credentials';
import { mockCredentials, mockDevices } from '../mockData';

const MOCK_ERROR_MESSAGE =
  'Showing mock data (backend calls disabled).';
const FALLBACK_ERROR_MESSAGE =
  'Using mock data because the API is unavailable or returned no records.';

export const useDeviceData = () => {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [useMockData, setUseMockData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const applyMockData = useCallback(() => {
    setDevices(mockDevices);
    setCredentials(mockCredentials);
  }, []);

  const reloadDevicesAndCredentials = useCallback(
    async (forceMock = useMockData) => {
      if (forceMock) {
        applyMockData();
        setError(MOCK_ERROR_MESSAGE);
        return;
      }

      const [deviceData, credentialData] = await Promise.all([
        fetchAllDevices().catch(() => null),
        fetchAllCredentials().catch(() => null),
      ]);

      const hasDevices = Array.isArray(deviceData) && deviceData.length > 0;
      const hasCredentials =
        Array.isArray(credentialData) && credentialData.length > 0;

      if (hasDevices && hasCredentials) {
        setDevices(deviceData);
        setCredentials(credentialData);
        setError(null);
        return;
      }

      applyMockData();
      setUseMockData(true);
      setError(FALLBACK_ERROR_MESSAGE);
    },
    [applyMockData, useMockData]
  );

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await reloadDevicesAndCredentials();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load initial data.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [reloadDevicesAndCredentials]);

  const handleGlobalRefresh = useCallback(async () => {
    setError(null);
    setIsRefreshing(true);
    try {
      await reloadDevicesAndCredentials();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to refresh devices.'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [reloadDevicesAndCredentials]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const refreshDevice = useCallback(
    async (ip: string, method: ProtocolMethod) => {
      if (!ip) {
        return;
      }
      if (useMockData) {
        setError('Refresh is disabled while showing mock data.');
        return;
      }
      setError(null);

      try {
        await refreshDeviceByIp(ip, method);
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : 'Device refresh failed.'
        );
        return;
      }

      try {
        const updatedDevice = await fetchDeviceByIp(ip);
        if (updatedDevice) {
          setDevices((previous) => {
            const alreadyExists = previous.some(
              (device) =>
                device.primaryIp === ip || device.mac === updatedDevice.mac
            );

            if (alreadyExists) {
              return previous.map((device) =>
                device.primaryIp === ip || device.mac === updatedDevice.mac
                  ? updatedDevice
                  : device
              );
            }

            return [...previous, updatedDevice];
          });
          return;
        }
      } catch {
        // If GET /devices/get_one_record fails we silently move on to the
        // fallback where we reload all devices.
      }

      try {
        const latestDevices = await fetchAllDevices();
        setDevices(latestDevices);
      } catch (fallbackError) {
        setError(
          fallbackError instanceof Error
            ? fallbackError.message
            : 'Unable to refresh device data.'
        );
      }
    },
    [useMockData]
  );

  const handleDeviceAdded = useCallback(async () => {
    setError(null);
    try {
      await reloadDevicesAndCredentials();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to reload devices.'
      );
    }
  }, [reloadDevicesAndCredentials]);

  return {
    devices,
    credentials,
    useMockData,
    isLoading,
    error,
    isRefreshing,
    setUseMockData,
    setError,
    reloadDevicesAndCredentials,
    handleGlobalRefresh,
    refreshDevice,
    handleDeviceAdded,
  };
};
