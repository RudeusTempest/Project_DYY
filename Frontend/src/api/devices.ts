// All device-related API helpers live in this file so the rest of the UI can
// stay very small and readable. Because this project targets beginners we keep
// everything extremely explicit and add comments describing every single type
// and network request.

export type ProtocolMethod = 'snmp' | 'cli';

// Every physical / logical interface on the device.
export interface DeviceInterface {
  interface: string;
  ip_address: string;
  status: string;
  max_speed?: number;
  mbps_received?: number;
  mbps_sent?: number;
  bandwidth_max_mbps?: number;
  txload_current?: number;
  txload_percent?: number;
  rxload_current?: number;
  rxload_percent?: number;
  input_rate_kbps?: number;
  output_rate_kbps?: number;
  mtu?: number;
  crc_errors?: number;
  input_errors?: number;
  output_errors?: number;
}

// Data about neighboring devices learned from CDP/LLDP.
export interface DeviceNeighbor {
  device_id: string;
  local_interface: string;
  port_id?: string;
}

// This is the normalized version of the backend device record that the rest of
// the React code consumes. We flatten field names that contain spaces and add a
// "primaryIp" helper so components do not have to keep recalculating it.
export interface DeviceRecord {
  mac: string;
  hostname: string;
  interfaces: DeviceInterface[];
  neighbors: DeviceNeighbor[];
  lastUpdatedAt: string;
  rawDate?: string;
  primaryIp?: string;
}

export type DeviceStatus = 'active' | 'inactive' | 'unauthorized';

const API_BASE_URL = 'http://localhost:8000';

const toNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

// Small helper that turns whatever the backend sends into a clean interface
// object. This keeps undefined/null safeguards in one place.
const normalizeInterface = (
  rawInterface: any,
  index: number
): DeviceInterface => {
  // Accept both lower/upper-case keys because different platforms serialize
  // interface fields differently.
  const rawName =
    rawInterface?.interface ??
    rawInterface?.Interface ??
    rawInterface?.name;
  const fallbackName = `Interface ${index + 1}`;
  const name = typeof rawName === 'string' ? rawName : fallbackName;

  const rawIp =
    rawInterface?.ip_address ??
    rawInterface?.IP_Address ??
    rawInterface?.ip ??
    rawInterface?.['IP Address'];

  const ip =
    typeof rawIp === 'string' && rawIp.length > 0 ? rawIp : 'unassigned';

  const rawStatus = rawInterface?.status ?? rawInterface?.Status;

  const status =
    typeof rawStatus === 'string' ? rawStatus : 'Unknown';

  const normalized: DeviceInterface = {
    interface: name,
    ip_address: ip,
    status,
  };

  const bandwidthDetails = rawInterface?.bandwidth ?? {};

  const bandwidthMax = toNumber(bandwidthDetails?.bandwidth_max_mbps);
  if (bandwidthMax !== undefined) {
    normalized.bandwidth_max_mbps = bandwidthMax;
  }

  const maxSpeed = toNumber(rawInterface?.max_speed) ?? bandwidthMax;
  if (maxSpeed !== undefined) {
    normalized.max_speed = maxSpeed;
  }

  const rx = toNumber(rawInterface?.mbps_received);
  if (rx !== undefined) {
    normalized.mbps_received = rx;
  }

  const tx = toNumber(rawInterface?.mbps_sent);
  if (tx !== undefined) {
    normalized.mbps_sent = tx;
  }

  const rxLoadCurrent = toNumber(bandwidthDetails?.rxload_current);
  if (rxLoadCurrent !== undefined) {
    normalized.rxload_current = rxLoadCurrent;
  }

  const rxLoadPercent = toNumber(bandwidthDetails?.rxload_percent);
  if (rxLoadPercent !== undefined) {
    normalized.rxload_percent = rxLoadPercent;
  }

  const txLoadCurrent = toNumber(bandwidthDetails?.txload_current);
  if (txLoadCurrent !== undefined) {
    normalized.txload_current = txLoadCurrent;
  }

  const txLoadPercent = toNumber(bandwidthDetails?.txload_percent);
  if (txLoadPercent !== undefined) {
    normalized.txload_percent = txLoadPercent;
  }

  const inputRateKbps =
    toNumber(bandwidthDetails?.input_rate_kbps) ??
    (rx !== undefined ? rx * 1000 : undefined);
  if (inputRateKbps !== undefined) {
    normalized.input_rate_kbps = inputRateKbps;
  }

  const outputRateKbps =
    toNumber(bandwidthDetails?.output_rate_kbps) ??
    (tx !== undefined ? tx * 1000 : undefined);
  if (outputRateKbps !== undefined) {
    normalized.output_rate_kbps = outputRateKbps;
  }

  const mtu = toNumber(bandwidthDetails?.mtu);
  if (mtu !== undefined) {
    normalized.mtu = mtu;
  }

  const crcErrors = toNumber(bandwidthDetails?.crc_errors);
  if (crcErrors !== undefined) {
    normalized.crc_errors = crcErrors;
  }

  const inputErrors = toNumber(bandwidthDetails?.input_errors);
  if (inputErrors !== undefined) {
    normalized.input_errors = inputErrors;
  }

  const outputErrors = toNumber(bandwidthDetails?.output_errors);
  if (outputErrors !== undefined) {
    normalized.output_errors = outputErrors;
  }

  return normalized;
};

// Same idea for neighbors – keep the parsing code separate from the UI so the
// components remain easy to read.
const normalizeNeighbor = (rawNeighbor: any, index: number): DeviceNeighbor => {
  const deviceId =
    typeof rawNeighbor?.device_id === 'string'
      ? rawNeighbor.device_id || `Neighbor ${index + 1}`
      : `Neighbor ${index + 1}`;
  const localInterface =
    typeof rawNeighbor?.local_interface === 'string'
      ? rawNeighbor.local_interface || 'Unknown interface'
      : 'Unknown interface';

  const neighbor: DeviceNeighbor = {
    device_id: deviceId,
    local_interface: localInterface,
  };

  if (typeof rawNeighbor?.port_id === 'string' && rawNeighbor.port_id.length) {
    neighbor.port_id = rawNeighbor.port_id;
  }

  return neighbor;
};

// The backend uses keys like "last updated at" with spaces; this function
// creates a much easier to consume object.
const normalizeDeviceRecord = (rawDevice: any): DeviceRecord => {
  const interfacesArray: DeviceInterface[] = Array.isArray(rawDevice?.interface)
    ? rawDevice.interface.map((iface: any, idx: number) =>
        normalizeInterface(iface, idx)
      )
    : [];

  const neighborsArray: DeviceNeighbor[] = Array.isArray(
    rawDevice?.info_neighbors
  )
    ? rawDevice.info_neighbors.map((neighbor: any, idx: number) =>
        normalizeNeighbor(neighbor, idx)
      )
    : [];

  const lastUpdated =
    typeof rawDevice?.['last updated at'] === 'string'
      ? rawDevice['last updated at']
      : typeof rawDevice?.lastUpdated === 'string'
      ? rawDevice.lastUpdated
      : 'Unknown';

  const rawDateValue =
    typeof rawDevice?.['raw date'] === 'string'
      ? rawDevice['raw date']
      : typeof rawDevice?.raw_date === 'string'
      ? rawDevice.raw_date
      : undefined;

  // Primary IP: first interface that has a real IP assigned. If none exist,
  // fall back to the backend field if it exists.
  const primaryInterface = interfacesArray.find((iface) => {
    const ip = iface.ip_address?.toLowerCase?.() ?? '';
    return ip.length > 0 && ip !== 'unassigned' && ip !== 'unknown';
  });

  const primaryIp =
    primaryInterface?.ip_address ||
    (typeof rawDevice?.ip === 'string' ? rawDevice.ip : undefined);

  return {
    mac: typeof rawDevice?.mac === 'string' ? rawDevice.mac : 'Unknown MAC',
    hostname:
      typeof rawDevice?.hostname === 'string'
        ? rawDevice.hostname
        : 'Unnamed device',
    interfaces: interfacesArray,
    neighbors: neighborsArray,
    lastUpdatedAt: lastUpdated,
    rawDate: rawDateValue,
    primaryIp,
  };
};

// Fetch helpers --------------------------------------------------------------

export const fetchAllDevices = async (): Promise<DeviceRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/devices/get_all`);
  if (!response.ok) {
    throw new Error('Unable to load device list');
  }

  const json = await response.json();
  if (!Array.isArray(json)) {
    return [];
  }

  return json.map((device) => normalizeDeviceRecord(device));
};

export const fetchDeviceByIp = async (
  ip: string
): Promise<DeviceRecord | null> => {
  const response = await fetch(
    `${API_BASE_URL}/devices/get_one_record?ip=${encodeURIComponent(ip)}`
  );

  if (!response.ok) {
    // The caller needs to know whether this failed so it can fall back to a
    // /devices/get_all call, so we throw here instead of swallowing the error.
    throw new Error(`Device ${ip} could not be fetched (${response.status})`);
  }

  const json = await response.json();
  if (Array.isArray(json) && json.length > 0) {
    return normalizeDeviceRecord(json[0]);
  }
  return null;
};

export const refreshDeviceByIp = async (
  ip: string,
  method: ProtocolMethod
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/devices/refresh_one?ip=${encodeURIComponent(
      ip
    )}&method=${method}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Refresh failed for ${ip} (${response.status}): ${detail ?? ''}`
    );
  }
};

export const startProgram = async (
  deviceInterval: number,
  mbpsInterval: number,
  method: ProtocolMethod,
  timeoutMs = 8000
): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${API_BASE_URL}/devices/start_program?device_interval=${deviceInterval}&mbps_interval=${mbpsInterval}&method=${method}`,
      { method: 'PUT', signal: controller.signal }
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Program start failed (${response.status}): ${detail ?? ''}`
      );
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

// Shared helper that assigns a status string so both the sidebar and cards can
// show consistent colors. The logic is intentionally simple:
// 1. If any interface mentions "unauth" we treat the device as unauthorized.
// 2. Else if any interface mentions "up" we treat it as active.
// 3. Otherwise it is inactive.
export const deriveDeviceStatus = (device: DeviceRecord): DeviceStatus => {
  const statuses = device.interfaces.map((iface) =>
    iface.status?.toLowerCase?.() ?? ''
  );

  if (statuses.some((status) => status.includes('unauth'))) {
    return 'unauthorized';
  }

  if (
    statuses.some(
      (status) => status.includes('up/up') || status === 'up' || status === 'up/up '
    ) ||
    statuses.some(
      (status) =>
        status.includes('up') && !status.includes('down') && !status.includes('shut')
    )
  ) {
    return 'active';
  }

  return 'inactive';
};
