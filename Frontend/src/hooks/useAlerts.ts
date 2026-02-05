import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getWhiteListSocketUrl } from '../api/whiteList';
import { type DeviceRecord } from '../api/devices';
import { normalizeIp, normalizeMac, resolveDeviceIp } from '../utils/deviceUtils';

export type AlertSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

export interface AlertItem {
  id: string;
  message: string;
  receivedAt: string;
  receivedAtMs: number;
  deviceMac?: string;
  deviceIp?: string;
}

const MAX_ALERTS = 120;
const MAX_ALERTS_PER_DEVICE = 40;

const buildDeviceMacByIp = (devices: DeviceRecord[]) => {
  const map: Record<string, string> = {};

  devices.forEach((device) => {
    const normalizedMac = normalizeMac(device.mac);
    if (!normalizedMac) {
      return;
    }

    const primaryIp = resolveDeviceIp(device);
    if (primaryIp) {
      const normalizedIp = normalizeIp(primaryIp);
      if (normalizedIp) {
        map[normalizedIp] = normalizedMac;
      }
    }

    device.interfaces.forEach((iface) => {
      const normalizedIp = normalizeIp(iface.ip_address);
      if (normalizedIp && normalizedIp !== 'unassigned' && normalizedIp !== 'unknown') {
        map[normalizedIp] = normalizedMac;
      }
    });
  });

  return map;
};

const parseAlertPayload = (payload: unknown) => {
  let raw: Record<string, unknown> | null = null;

  if (typeof payload === 'string') {
    try {
      raw = JSON.parse(payload) as Record<string, unknown>;
    } catch {
      raw = null;
    }
  } else if (payload && typeof payload === 'object') {
    raw = payload as Record<string, unknown>;
  }

  const message =
    (raw?.Alert as string | undefined) ??
    (raw?.alert as string | undefined) ??
    (raw?.message as string | undefined) ??
    (typeof payload === 'string' ? payload : 'White list alert received.');

  const deviceMac =
    (raw?.device_mac as string | undefined) ??
    (raw?.deviceMac as string | undefined) ??
    (raw?.mac as string | undefined) ??
    (raw?.mac_address as string | undefined);

  const deviceIp =
    (raw?.device_ip as string | undefined) ??
    (raw?.deviceIp as string | undefined) ??
    (raw?.ip as string | undefined);

  return { message, deviceMac, deviceIp };
};

export const useAlerts = (devices: DeviceRecord[]) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsByDevice, setAlertsByDevice] = useState<
    Record<string, AlertItem[]>
  >({});
  const [unreadByDevice, setUnreadByDevice] = useState<
    Record<string, number>
  >({});
  const [socketAttempt, setSocketAttempt] = useState(0);
  const [socketStatus, setSocketStatus] = useState<AlertSocketStatus>(
    'connecting'
  );
  const [socketError, setSocketError] = useState<string | null>(null);

  const deviceMacByIp = useMemo(() => buildDeviceMacByIp(devices), [devices]);
  const deviceMacByIpRef = useRef(deviceMacByIp);

  useEffect(() => {
    deviceMacByIpRef.current = deviceMacByIp;
  }, [deviceMacByIp]);

  useEffect(() => {
    let isActive = true;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let reconnectScheduled = false;

    const scheduleReconnect = () => {
      if (reconnectScheduled) {
        return;
      }
      reconnectScheduled = true;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        if (isActive) {
          setSocketAttempt((previous) => previous + 1);
        }
      }, 5000);
    };

    const handleAlertMessage = (payload: unknown) => {
      if (!isActive) {
        return;
      }

      const { message, deviceMac, deviceIp } = parseAlertPayload(payload);
      const normalizedIp = deviceIp ? normalizeIp(deviceIp) : '';
      const normalizedMac = normalizeMac(deviceMac);
      const resolvedMac =
        normalizedMac ||
        (normalizedIp ? deviceMacByIpRef.current[normalizedIp] : undefined);

      const receivedAtMs = Date.now();
      const receivedAt = new Date(receivedAtMs).toLocaleString();

      const alertItem: AlertItem = {
        id: `alert-${receivedAtMs}-${Math.random().toString(16).slice(2)}`,
        message,
        receivedAt,
        receivedAtMs,
        deviceMac: resolvedMac || undefined,
        deviceIp: normalizedIp || deviceIp,
      };

      setAlerts((previous) => {
        const next = [alertItem, ...previous];
        return next.slice(0, MAX_ALERTS);
      });

      if (resolvedMac) {
        setAlertsByDevice((previous) => {
          const nextList = [
            alertItem,
            ...(previous[resolvedMac] ?? []),
          ].slice(0, MAX_ALERTS_PER_DEVICE);

          return {
            ...previous,
            [resolvedMac]: nextList,
          };
        });

        setUnreadByDevice((previous) => ({
          ...previous,
          [resolvedMac]: (previous[resolvedMac] ?? 0) + 1,
        }));
      }
    };

    setSocketStatus('connecting');
    setSocketError(null);

    try {
      socket = new WebSocket(getWhiteListSocketUrl());

      socket.onopen = () => {
        if (!isActive) {
          return;
        }
        setSocketStatus('open');
      };

      socket.onmessage = (event) => {
        handleAlertMessage(event.data);
      };

      socket.onerror = () => {
        if (!isActive) {
          return;
        }
        setSocketStatus('error');
        setSocketError('WebSocket error while listening for alerts.');
        scheduleReconnect();
      };

      socket.onclose = () => {
        if (!isActive) {
          return;
        }
        setSocketStatus('closed');
        scheduleReconnect();
      };
    } catch {
      setSocketStatus('error');
      setSocketError('Unable to open white list alert socket.');
      scheduleReconnect();
    }

    return () => {
      isActive = false;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [socketAttempt]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setAlertsByDevice({});
    setUnreadByDevice({});
  }, []);

  const clearAlertsForDevice = useCallback((mac: string) => {
    const normalizedMac = normalizeMac(mac);
    if (!normalizedMac) {
      return;
    }

    setAlerts((previous) =>
      previous.filter((alert) => normalizeMac(alert.deviceMac) !== normalizedMac)
    );

    setAlertsByDevice((previous) => {
      if (!(normalizedMac in previous)) {
        return previous;
      }
      const next = { ...previous };
      delete next[normalizedMac];
      return next;
    });

    setUnreadByDevice((previous) => {
      if (!(normalizedMac in previous)) {
        return previous;
      }
      const next = { ...previous };
      delete next[normalizedMac];
      return next;
    });
  }, []);

  const markDeviceAlertsRead = useCallback((mac: string) => {
    const normalizedMac = normalizeMac(mac);
    if (!normalizedMac) {
      return;
    }

    setUnreadByDevice((previous) => {
      if (!previous[normalizedMac]) {
        return previous;
      }
      return {
        ...previous,
        [normalizedMac]: 0,
      };
    });
  }, []);

  return {
    alerts,
    alertsByDevice,
    unreadByDevice,
    socketStatus,
    socketError,
    clearAlerts,
    clearAlertsForDevice,
    markDeviceAlertsRead,
  };
};
