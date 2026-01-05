import { useCallback, useEffect, useState } from 'react';
import {
  fetchAllDevices,
  fetchDeviceByIp,
  refreshDeviceByIp,
  type DeviceRecord,
  type ProtocolMethod,
} from '../api/devices';

const API_ERROR_MESSAGE =
  'Unable to load devices from the API. Start the backend and try again.';

export const useDeviceData = () => {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const reloadDevicesAndCredentials = useCallback(
    async () => {
      const deviceData = await fetchAllDevices().catch(() => null);

      const hasDevices = Array.isArray(deviceData) && deviceData.length > 0;

      if (hasDevices) {
        setDevices(deviceData);
        setError(null);
        return;
      }

      // API call failed or returned no data: surface an error so the user can
      // fix the backend instead of silently showing stale data.
      setDevices([]);
      setError(API_ERROR_MESSAGE);
    },
    []
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
    []
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
    isLoading,
    error,
    isRefreshing,
    setError,
    reloadDevicesAndCredentials,
    handleGlobalRefresh,
    refreshDevice,
    handleDeviceAdded,
  };
};
