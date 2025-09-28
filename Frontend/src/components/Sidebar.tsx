import React from 'react';
import { NetworkDevice } from '../types';

type SidebarProps = {
  devices: NetworkDevice[];
  usingMockData: boolean;
  loading: boolean;
};

const Sidebar: React.FC<SidebarProps> = ({ devices, usingMockData, loading }) => {
  const stats = devices.reduce(
    (acc, device) => {
      acc.total++;

      const interfaces = Array.isArray(device.interface) ? device.interface : [];
      const hasActivePort = interfaces.some(port => typeof port?.status === 'string' && port.status.includes('up/up'));
      if (device.hostname === "Hostname not found") {
        acc.unauthorized++;
      } else if (hasActivePort) {
        acc.active++;
      } else {
        acc.inactive++;
      }

      return acc;
    },
    { total: 0, active: 0, inactive: 0, unauthorized: 0 }
  );

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <h3>Device Monitor</h3>

        {usingMockData && !loading && (
          <div className="sidebar-mock-banner">
            <p>Using mock data - API unavailable</p>
          </div>
        )}

        {/* Search moved to header */}

        <div className="sidebar-separator"></div>

        <div className="stat-item total">
          <div className="stat-label">Total Devices</div>
          <div className="stat-value">{stats.total}</div>
        </div>

        <div className="stat-item active">
          <div className="stat-label">Active</div>
          <div className="stat-value">{stats.active}</div>
        </div>

        <div className="stat-item inactive">
          <div className="stat-label">Inactive</div>
          <div className="stat-value">{stats.inactive}</div>
        </div>

        <div className="stat-item unauthorized">
          <div className="stat-label">Unauthorized</div>
          <div className="stat-value">{stats.unauthorized}</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
