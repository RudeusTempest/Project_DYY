import React from 'react';
import './Sidebar.css';
import { type DeviceStatus } from '../api/devices';

interface SidebarCounts {
  total: number;
  active: number;
  inactive: number;
  unauthorized: number;
}

interface SidebarProps {
  counts: SidebarCounts;
  selectedStatus: DeviceStatus | 'all';
  onSelectStatus: (status: DeviceStatus | 'all') => void;
}

// Simple fixed sidebar that displays how many devices fall into each status and
// lets the user filter the list by clicking a status. The parent (App)
// performs the counting and filtering; this component just renders controls.
const Sidebar: React.FC<SidebarProps> = ({
  counts,
  selectedStatus,
  onSelectStatus,
}) => {
  const renderItem = (
    label: string,
    value: number,
    status: DeviceStatus | 'all'
  ) => {
    const variantClass =
      status === 'all' ? 'sidebar__item--total' : `sidebar__item--${status}`;
    const isSelected = selectedStatus === status;

    return (
      <li>
        <button
          type="button"
          className={`sidebar__item ${variantClass} ${
            isSelected ? 'sidebar__item--selected' : ''
          }`}
          onClick={() => onSelectStatus(status)}
          aria-pressed={isSelected}
        >
          <span>{label}</span>
          <strong>{value}</strong>
        </button>
      </li>
    );
  };

  return (
    <aside className="sidebar">
      <h2 className="sidebar__title">Devices</h2>
      <ul className="sidebar__list">
        {renderItem('Total Devices', counts.total, 'all')}
        {renderItem('Active Devices', counts.active, 'active')}
        {renderItem('Inactive Devices', counts.inactive, 'inactive')}
        {renderItem('Unauthorized Devices', counts.unauthorized, 'unauthorized')}
      </ul>
    </aside>
  );
};

export default Sidebar;
