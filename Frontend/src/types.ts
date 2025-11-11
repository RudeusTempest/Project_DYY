export interface NetworkInterface {
  interface: string;
  ip_address: string;
  status: string;
  max_speed?: number;
  mbps_received?: number;
  mbps_sent?: number;
}

export interface NeighborDevice {
  device_id: string;
  local_interface: string;
  port_id?: string;
}

export interface NetworkDevice {
  Mac: string;
  mac?: string;
  hostname: string;
  interface: NetworkInterface[];
  "last updated at": string | { $date: string };
  "raw date"?: string | { $date: string };
  info_neighbors?: NeighborDevice[];
}
