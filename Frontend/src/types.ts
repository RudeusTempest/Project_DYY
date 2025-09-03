export interface NetworkInterface {
  interface: string;
  ip_address: string;
  status: string;
}

export interface NetworkDevice {
  Mac: string;
  hostname: string;
  interface: NetworkInterface[];
  "last updated at": string | { $date: string };
}

