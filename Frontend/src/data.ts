import {NetworkDevice, NetworkInterface} from "./App";
export const mockData: NetworkDevice[] = [
  {
    "Mac": "aabb.cc02.b000",
    "hostname": "cis1",
    "interface": [
      {
        "interface": "Ethernet0/0",
        "ip_address": "192.170.0.74",
        "status": "up/up"
      },
      {
        "interface": "Ethernet0/1",
        "ip_address": "unassigned",
        "status": "administratively/down"
      },
      {
        "interface": "Ethernet0/2",
        "ip_address": "unassigned",
        "status": "administratively/down"
      },
      {
        "interface": "Ethernet0/3",
        "ip_address": "unassigned",
        "status": "administratively/down"
      }
    ],
    "last updated at": "30-07-2025 15:10:19"
  },
  {
    "Mac": "Not found",
    "hostname": "Hostname not found",
    "interface": [
      {
        "interface": "%",
        "ip_address": "This",
        "status": "not/authorized"
      }
    ],
    "last updated at": "07-08-2025 10:41:57"
  },
  {
    "Mac": "Not found",
    "hostname": "Hostname not found",
    "interface": [
      {
        "interface": "%",
        "ip_address": "This",
        "status": "not/authorized"
      }
    ],
    "last updated at": { "$date": "2025-08-14T12:44:26.931Z" }
  },
  {
    "Mac": "00a0.c910.5632",
    "hostname": "core-router-01",
    "interface": [
      {
        "interface": "GigabitEthernet0/0",
        "ip_address": "10.1.1.1",
        "status": "up/up"
      },
      {
        "interface": "GigabitEthernet0/1",
        "ip_address": "10.1.2.1",
        "status": "up/up"
      },
      {
        "interface": "Serial0/0/0",
        "ip_address": "172.16.1.1",
        "status": "up/up"
      },
      {
        "interface": "Loopback0",
        "ip_address": "192.168.1.1",
        "status": "up/up"
      }
    ],
    "last updated at": "18-08-2025 09:23:45"
  },
  {
    "Mac": "001b.d512.7890",
    "hostname": "edge-router-02",
    "interface": [
      {
        "interface": "FastEthernet0/0",
        "ip_address": "203.0.113.5",
        "status": "up/up"
      },
      {
        "interface": "FastEthernet0/1",
        "ip_address": "192.168.10.1",
        "status": "up/up"
      },
      {
        "interface": "Serial0/1/0",
        "ip_address": "172.16.2.1",
        "status": "down/down"
      },
      {
        "interface": "Tunnel0",
        "ip_address": "10.10.10.1",
        "status": "up/up"
      }
    ],
    "last updated at": "17-08-2025 14:52:12"
  },
  {
    "Mac": "aabb.cc03.d445",
    "hostname": "branch-rtr-03",
    "interface": [
      {
        "interface": "Ethernet0/0",
        "ip_address": "198.51.100.10",
        "status": "up/up"
      },
      {
        "interface": "Ethernet0/1",
        "ip_address": "192.168.20.1",
        "status": "up/up"
      },
      {
        "interface": "Ethernet0/2",
        "ip_address": "192.168.21.1",
        "status": "up/up"
      },
      {
        "interface": "Ethernet0/3",
        "ip_address": "unassigned",
        "status": "administratively/down"
      }
    ],
    "last updated at": "18-08-2025 08:15:33"
  },
  {
    "Mac": "0050.5692.1234",
    "hostname": "wan-router-04",
    "interface": [
      {
        "interface": "GigabitEthernet0/0/0",
        "ip_address": "209.85.232.100",
        "status": "up/up"
      },
      {
        "interface": "GigabitEthernet0/0/1",
        "ip_address": "10.50.50.1",
        "status": "up/up"
      },
      {
        "interface": "Serial0/2/0",
        "ip_address": "172.31.1.2",
        "status": "up/up"
      },
      {
        "interface": "Loopback1",
        "ip_address": "1.1.1.1",
        "status": "up/up"
      }
    ],
    "last updated at": "18-08-2025 11:42:08"
  },
  {
    "Mac": "cc46.d612.ab89",
    "hostname": "dmz-router-05",
    "interface": [
      {
        "interface": "FastEthernet0/0",
        "ip_address": "172.20.1.1",
        "status": "up/up"
      },
      {
        "interface": "FastEthernet0/1",
        "ip_address": "172.20.2.1",
        "status": "up/up"
      },
      {
        "interface": "FastEthernet1/0",
        "ip_address": "192.168.100.1",
        "status": "down/down"
      },
      {
        "interface": "Vlan10",
        "ip_address": "10.20.10.1",
        "status": "up/up"
      }
    ],
    "last updated at": "16-08-2025 16:28:41"
  },
  {
    "Mac": "001f.9e77.c456",
    "hostname": "lab-router-06",
    "interface": [
      {
        "interface": "Ethernet0/0",
        "ip_address": "10.99.1.1",
        "status": "up/up"
      },
      {
        "interface": "Ethernet0/1",
        "ip_address": "10.99.2.1",
        "status": "up/up"
      },
      {
        "interface": "Ethernet0/2",
        "ip_address": "unassigned",
        "status": "down/down"
      },
      {
        "interface": "Ethernet0/3",
        "ip_address": "unassigned",
        "status": "administratively/down"
      }
    ],
    "last updated at": "15-08-2025 13:07:22"
  },
  {
    "Mac": "44d9.e7f2.5a90",
    "hostname": "backup-rtr-07",
    "interface": [
      {
        "interface": "GigabitEthernet1/0",
        "ip_address": "192.168.254.1",
        "status": "up/up"
      },
      {
        "interface": "GigabitEthernet2/0",
        "ip_address": "10.100.1.1",
        "status": "up/up"
      },
      {
        "interface": "Serial1/0",
        "ip_address": "172.25.1.2",
        "status": "administratively/down"
      },
      {
        "interface": "Loopback0",
        "ip_address": "7.7.7.7",
        "status": "up/up"
      }
    ],
    "last updated at": "18-08-2025 07:45:18"
  },
  {
    "Mac": "001a.2b3c.4d5e",
    "hostname": "access-switch-08",
    "interface": [
      {"interface": "FastEthernet0/1", "ip_address": "10.2.1.10", "status": "up/up"},
      {"interface": "FastEthernet0/2", "ip_address": "10.2.1.11", "status": "up/up"},
      {"interface": "FastEthernet0/3", "ip_address": "10.2.1.12", "status": "up/up"},
      {"interface": "FastEthernet0/4", "ip_address": "10.2.1.13", "status": "up/up"},
      {"interface": "FastEthernet0/5", "ip_address": "10.2.1.14", "status": "down/down"},
      {"interface": "FastEthernet0/6", "ip_address": "10.2.1.15", "status": "up/up"},
      {"interface": "FastEthernet0/7", "ip_address": "10.2.1.16", "status": "up/up"},
      {"interface": "FastEthernet0/8", "ip_address": "unassigned", "status": "administratively/down"},
      {"interface": "FastEthernet0/9", "ip_address": "10.2.1.18", "status": "up/up"},
      {"interface": "FastEthernet0/10", "ip_address": "10.2.1.19", "status": "up/up"},
      {"interface": "FastEthernet0/11", "ip_address": "10.2.1.20", "status": "up/up"},
      {"interface": "FastEthernet0/12", "ip_address": "unassigned", "status": "down/down"},
      {"interface": "FastEthernet0/13", "ip_address": "10.2.1.22", "status": "up/up"},
      {"interface": "FastEthernet0/14", "ip_address": "10.2.1.23", "status": "up/up"},
      {"interface": "FastEthernet0/15", "ip_address": "unassigned", "status": "administratively/down"},
      {"interface": "FastEthernet0/16", "ip_address": "10.2.1.25", "status": "up/up"},
      {"interface": "FastEthernet0/17", "ip_address": "10.2.1.26", "status": "up/up"},
      {"interface": "FastEthernet0/18", "ip_address": "10.2.1.27", "status": "down/down"},
      {"interface": "FastEthernet0/19", "ip_address": "10.2.1.28", "status": "up/up"},
      {"interface": "FastEthernet0/20", "ip_address": "10.2.1.29", "status": "up/up"},
      {"interface": "FastEthernet0/21", "ip_address": "10.2.1.30", "status": "up/up"},
      {"interface": "FastEthernet0/22", "ip_address": "unassigned", "status": "administratively/down"},
      {"interface": "FastEthernet0/23", "ip_address": "10.2.1.32", "status": "up/up"},
      {"interface": "FastEthernet0/24", "ip_address": "10.2.1.33", "status": "up/up"}
    ],
    "last updated at": "18-08-2025 12:30:15"
  },
  {
    "Mac": "5566.7788.99aa",
    "hostname": "dist-router-09",
    "interface": [
      {
        "interface": "GigabitEthernet0/0",
        "ip_address": "10.3.0.1",
        "status": "up/up"
      },
      {
        "interface": "GigabitEthernet0/1",
        "ip_address": "10.3.1.1",
        "status": "up/up"
      },
      {
        "interface": "GigabitEthernet0/2",
        "ip_address": "10.3.2.1",
        "status": "up/up"
      },
      {
        "interface": "Vlan100",
        "ip_address": "192.168.100.1",
        "status": "up/up"
      },
      {
        "interface": "Vlan200",
        "ip_address": "192.168.200.1",
        "status": "up/up"
      }
    ],
    "last updated at": "18-08-2025 10:15:42"
  },
  {
    "Mac": "bbcc.ddee.ff00",
    "hostname": "core-switch-10",
    "interface": [
      {"interface": "GigabitEthernet1/1", "ip_address": "10.5.1.1", "status": "up/up"},
      {"interface": "GigabitEthernet1/2", "ip_address": "10.5.1.2", "status": "up/up"},
      {"interface": "GigabitEthernet1/3", "ip_address": "10.5.1.3", "status": "up/up"},
      {"interface": "GigabitEthernet1/4", "ip_address": "10.5.1.4", "status": "down/down"},
      {"interface": "GigabitEthernet1/5", "ip_address": "10.5.1.5", "status": "up/up"},
      {"interface": "GigabitEthernet1/6", "ip_address": "unassigned", "status": "administratively/down"},
      {"interface": "GigabitEthernet1/7", "ip_address": "10.5.1.7", "status": "up/up"},
      {"interface": "GigabitEthernet1/8", "ip_address": "10.5.1.8", "status": "up/up"},
      {"interface": "GigabitEthernet1/9", "ip_address": "10.5.1.9", "status": "up/up"},
      {"interface": "GigabitEthernet1/10", "ip_address": "10.5.1.10", "status": "up/up"},
      {"interface": "GigabitEthernet1/11", "ip_address": "10.5.1.11", "status": "down/down"},
      {"interface": "GigabitEthernet1/12", "ip_address": "10.5.1.12", "status": "up/up"},
      {"interface": "GigabitEthernet1/13", "ip_address": "10.5.1.13", "status": "up/up"},
      {"interface": "GigabitEthernet1/14", "ip_address": "unassigned", "status": "administratively/down"},
      {"interface": "GigabitEthernet1/15", "ip_address": "10.5.1.15", "status": "up/up"},
      {"interface": "GigabitEthernet1/16", "ip_address": "10.5.1.16", "status": "up/up"},
      {"interface": "GigabitEthernet1/17", "ip_address": "10.5.1.17", "status": "up/up"},
      {"interface": "GigabitEthernet1/18", "ip_address": "10.5.1.18", "status": "down/down"},
      {"interface": "GigabitEthernet1/19", "ip_address": "10.5.1.19", "status": "up/up"},
      {"interface": "GigabitEthernet1/20", "ip_address": "10.5.1.20", "status": "up/up"},
      {"interface": "GigabitEthernet1/21", "ip_address": "10.5.1.21", "status": "up/up"},
      {"interface": "GigabitEthernet1/22", "ip_address": "10.5.1.22", "status": "up/up"},
      {"interface": "GigabitEthernet1/23", "ip_address": "unassigned", "status": "administratively/down"},
      {"interface": "GigabitEthernet1/24", "ip_address": "10.5.1.24", "status": "up/up"}
    ],
    "last updated at": "18-08-2025 11:22:33"
  },
  {
    "Mac": "1122.3344.5566",
    "hostname": "remote-office-11",
    "interface": [
      {
        "interface": "Ethernet0/0",
        "ip_address": "203.0.113.45",
        "status": "up/up"
      },
      {
        "interface": "Ethernet0/1",
        "ip_address": "192.168.50.1",
        "status": "up/up"
      },
      {
        "interface": "Ethernet0/2",
        "ip_address": "192.168.51.1",
        "status": "down/down"
      },
      {
        "interface": "Serial0/0/0",
        "ip_address": "172.30.1.2",
        "status": "up/up"
      }
    ],
    "last updated at": "17-08-2025 09:18:27"
  },
  {
    "Mac": "7788.99aa.bbcc",
    "hostname": "firewall-router-12",
    "interface": [
      {
        "interface": "GigabitEthernet0/0",
        "ip_address": "198.51.100.1",
        "status": "up/up"
      },
      {
        "interface": "GigabitEthernet0/1",
        "ip_address": "10.10.10.1",
        "status": "up/up"
      },
      {
        "interface": "GigabitEthernet0/2",
        "ip_address": "172.16.10.1",
        "status": "up/up"
      },
      {
        "interface": "Management1",
        "ip_address": "192.168.1.100",
        "status": "up/up"
      }
    ],
    "last updated at": "18-08-2025 13:45:19"
  },
  {
    "Mac": "ddee.ff00.1122",
    "hostname": "vpn-concentrator-13",
    "interface": [
      {
        "interface": "FastEthernet0/0",
        "ip_address": "209.85.232.55",
        "status": "up/up"
      },
      {
        "interface": "FastEthernet0/1",
        "ip_address": "10.200.1.1",
        "status": "up/up"
      },
      {
        "interface": "Tunnel1",
        "ip_address": "10.0.1.1",
        "status": "up/up"
      },
      {
        "interface": "Tunnel2",
        "ip_address": "10.0.2.1",
        "status": "up/up"
      },
      {
        "interface": "Tunnel3",
        "ip_address": "10.0.3.1",
        "status": "down/down"
      }
    ],
    "last updated at": "18-08-2025 08:33:52"
  },
  {
    "Mac": "3344.5566.7788",
    "hostname": "datacenter-sw-14",
    "interface": [
      {"interface": "TenGigabitEthernet1/1", "ip_address": "10.10.1.1", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/2", "ip_address": "10.10.1.2", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/3", "ip_address": "10.10.1.3", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/4", "ip_address": "10.10.1.4", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/5", "ip_address": "10.10.1.5", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/6", "ip_address": "10.10.1.6", "status": "down/down"},
      {"interface": "TenGigabitEthernet1/7", "ip_address": "10.10.1.7", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/8", "ip_address": "10.10.1.8", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/9", "ip_address": "10.10.1.9", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/10", "ip_address": "10.10.1.10", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/11", "ip_address": "10.10.1.11", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/12", "ip_address": "unassigned", "status": "administratively/down"},
      {"interface": "TenGigabitEthernet1/13", "ip_address": "10.10.1.13", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/14", "ip_address": "10.10.1.14", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/15", "ip_address": "10.10.1.15", "status": "down/down"},
      {"interface": "TenGigabitEthernet1/16", "ip_address": "10.10.1.16", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/17", "ip_address": "10.10.1.17", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/18", "ip_address": "10.10.1.18", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/19", "ip_address": "10.10.1.19", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/20", "ip_address": "10.10.1.20", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/21", "ip_address": "unassigned", "status": "administratively/down"},
      {"interface": "TenGigabitEthernet1/22", "ip_address": "10.10.1.22", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/23", "ip_address": "10.10.1.23", "status": "up/up"},
      {"interface": "TenGigabitEthernet1/24", "ip_address": "10.10.1.24", "status": "up/up"}
    ],
    "last updated at": "18-08-2025 14:17:08"
  },
  {
    "Mac": "9900.aabb.ccdd",
    "hostname": "wireless-controller-15",
    "interface": [
      {
        "interface": "GigabitEthernet0/0",
        "ip_address": "192.168.1.50",
        "status": "up/up"
      },
      {
        "interface": "GigabitEthernet0/1",
        "ip_address": "10.wifi.1.1",
        "status": "up/up"
      },
      {
        "interface": "Management0",
        "ip_address": "192.168.1.51",
        "status": "up/up"
      },
      {
        "interface": "Vlan10",
        "ip_address": "10.10.wifi.1",
        "status": "up/up"
      }
    ],
    "last updated at": "18-08-2025 06:22:14"
  },
  {
    "Mac": "eeff.0011.2233",
    "hostname": "backup-dc-router-16",
    "interface": [
      {
        "interface": "GigabitEthernet1/0",
        "ip_address": "10.backup.1.1",
        "status": "up/up"
      },
      {
        "interface": "GigabitEthernet2/0",
        "ip_address": "10.backup.2.1",
        "status": "up/up"
      },
      {
        "interface": "Serial0/0",
        "ip_address": "172.backup.1.1",
        "status": "down/down"
      },
      {
        "interface": "Loopback0",
        "ip_address": "16.16.16.16",
        "status": "up/up"
      }
    ],
    "last updated at": "17-08-2025 20:45:33"
  },
  {
    "Mac": "4455.6677.8899",
    "hostname": "isp-gateway-17",
    "interface": [
      {
        "interface": "GigabitEthernet0/0/0",
        "ip_address": "8.8.8.1",
        "status": "up/up"
      },
      {
        "interface": "GigabitEthernet0/0/1",
        "ip_address": "10.isp.1.1",
        "status": "up/up"
      },
      {
        "interface": "Serial0/1/0",
        "ip_address": "172.isp.1.1",
        "status": "up/up"
      },
      {
        "interface": "Tunnel0",
        "ip_address": "10.tunnel.1.1",
        "status": "up/up"
      }
    ],
    "last updated at": "18-08-2025 15:12:45"
  },
  {
    "Mac": "aabb.ccdd.eeff",
    "hostname": "monitoring-router-18",
    "interface": [
      {
        "interface": "FastEthernet0/0",
        "ip_address": "192.168.monitoring.1",
        "status": "up/up"
      },
      {
        "interface": "FastEthernet0/1",
        "ip_address": "10.monitoring.1.1",
        "status": "up/up"
      },
      {
        "interface": "Serial0/0",
        "ip_address": "172.monitoring.1.1",
        "status": "up/up"
      },
      {
        "interface": "Loopback1",
        "ip_address": "18.18.18.18",
        "status": "up/up"
      }
    ],
    "last updated at": "18-08-2025 12:55:28"
  },
  {
    "Mac": "1100.2200.3300",
    "hostname": "test-lab-router-19",
    "interface": [
      {
        "interface": "Ethernet0/0",
        "ip_address": "10.testlab.1.1",
        "status": "up/up"
      },
      {
        "interface": "Ethernet0/1",
        "ip_address": "10.testlab.2.1",
        "status": "down/down"
      },
      {
        "interface": "Ethernet0/2",
        "ip_address": "unassigned",
        "status": "administratively/down"
      },
      {
        "interface": "Ethernet0/3",
        "ip_address": "unassigned",
        "status": "administratively/down"
      }
    ],
    "last updated at": "16-08-2025 11:30:17"
  },
  {
    "Mac": "ff00.1122.3344",
    "hostname": "disaster-recovery-20",
    "interface": [
      {
        "interface": "GigabitEthernet0/0",
        "ip_address": "10.dr.1.1",
        "status": "up/up"
      },
      {
        "interface": "GigabitEthernet0/1",
        "ip_address": "10.dr.2.1",
        "status": "up/up"
      },
      {
        "interface": "Serial0/0/0",
        "ip_address": "172.dr.1.1",
        "status": "administratively/down"
      },
      {
        "interface": "Tunnel0",
        "ip_address": "10.dr.tunnel.1",
        "status": "up/up"
      },
      {
        "interface": "Loopback0",
        "ip_address": "20.20.20.20",
        "status": "up/up"
      }
    ],
    "last updated at": "18-08-2025 16:40:12"
  },
  {
  "Mac": "dead.beef.0000",
  "hostname": "inactive-router-21",
  "interface": [
    {
      "interface": "Ethernet0/0",
      "ip_address": "192.168.99.1",
      "status": "down/down"
    },
    {
      "interface": "Ethernet0/1",
      "ip_address": "unassigned",
      "status": "administratively/down"
    },
    {
      "interface": "Ethernet0/2",
      "ip_address": "unassigned",
      "status": "down/down"
    },
    {
      "interface": "Ethernet0/3",
      "ip_address": "unassigned",
      "status": "administratively/down"
    }
  ],
  "last updated at": "02-09-2025 17:00:00"
}
];