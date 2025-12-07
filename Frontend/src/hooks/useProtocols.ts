import { useCallback, useMemo, useState } from 'react';
import { type CredentialRecord } from '../api/credentials';
import {
  startProgram,
  type DeviceRecord,
  type ProtocolMethod,
} from '../api/devices';
import { resolveDeviceIp } from '../utils/deviceUtils';

const DEFAULT_DEVICE_INTERVAL = 3600;
const DEFAULT_MBPS_INTERVAL = 0;
const DEFAULT_AUTO_METHOD: ProtocolMethod = 'snmp';

export const useProtocols = () => {
  const [protocol, setProtocol] = useState<ProtocolMethod>('snmp');
  const [deviceProtocolOverrides, setDeviceProtocolOverrides] = useState<
    Record<string, ProtocolMethod>
  >({});
  const [autoUpdateDeviceInterval, setAutoUpdateDeviceInterval] =
    useState<number>(DEFAULT_DEVICE_INTERVAL);
  const [autoUpdateMbpsInterval, setAutoUpdateMbpsInterval] =
    useState<number>(DEFAULT_MBPS_INTERVAL);
  const [autoUpdateMethod, setAutoUpdateMethod] =
    useState<ProtocolMethod>(DEFAULT_AUTO_METHOD);
  const [autoUpdateMessage, setAutoUpdateMessage] = useState<string | null>(
    null
  );
  const [isStartingAutoUpdate, setIsStartingAutoUpdate] = useState(false);

  const getProtocolForDevice = useCallback(
    (device: DeviceRecord, credential?: CredentialRecord): ProtocolMethod => {
      const deviceIp = resolveDeviceIp(device, credential);
      if (deviceIp && deviceProtocolOverrides[deviceIp]) {
        return deviceProtocolOverrides[deviceIp];
      }
      return protocol;
    },
    [deviceProtocolOverrides, protocol]
  );

  const handleDeviceProtocolChange = useCallback(
    (
      device: DeviceRecord,
      credential: CredentialRecord | undefined,
      method: ProtocolMethod
    ) => {
      const deviceIp = resolveDeviceIp(device, credential);
      if (!deviceIp) {
        return;
      }
      setDeviceProtocolOverrides((previous) => ({
        ...previous,
        [deviceIp]: method,
      }));
    },
    []
  );

  const handleStartAutoUpdate = useCallback(async () => {
    setAutoUpdateMessage(null);
    setIsStartingAutoUpdate(true);
    try {
      await startProgram(
        autoUpdateDeviceInterval,
        autoUpdateMbpsInterval,
        autoUpdateMethod
      );
      setAutoUpdateMessage('Automatic updates started.');
    } catch (startError) {
      setAutoUpdateMessage(
        startError instanceof Error
          ? startError.message
          : 'Failed to start automatic updates.'
      );
    } finally {
      setIsStartingAutoUpdate(false);
    }
  }, [autoUpdateDeviceInterval, autoUpdateMbpsInterval, autoUpdateMethod]);

  const protocolState = useMemo(
    () => ({
      protocol,
      setProtocol,
      deviceProtocolOverrides,
      getProtocolForDevice,
      handleDeviceProtocolChange,
    }),
    [deviceProtocolOverrides, getProtocolForDevice, handleDeviceProtocolChange, protocol]
  );

  const autoUpdateState = useMemo(
    () => ({
      autoUpdateDeviceInterval,
      setAutoUpdateDeviceInterval,
      autoUpdateMbpsInterval,
      setAutoUpdateMbpsInterval,
      autoUpdateMethod,
      setAutoUpdateMethod,
      autoUpdateMessage,
      isStartingAutoUpdate,
      handleStartAutoUpdate,
    }),
    [
      autoUpdateDeviceInterval,
      autoUpdateMessage,
      autoUpdateMethod,
      autoUpdateMbpsInterval,
      handleStartAutoUpdate,
      isStartingAutoUpdate,
    ]
  );

  return { ...protocolState, ...autoUpdateState };
};
