import React from 'react';
import './Sidebar.css';
import { type DeviceStatus } from '../api/devices';

interface SidebarCounts {
  total: number;
  active: number;
  inactive: number;
  unauthorized: number;
}

export interface SidebarGroup {
  name: string;
  deviceCount: number;
}

interface SidebarProps {
  counts: SidebarCounts;
  selectedStatus: DeviceStatus | 'all';
  onSelectStatus: (status: DeviceStatus | 'all') => void;
  groups: SidebarGroup[];
  selectedGroup: string;
  onSelectGroup: (groupName: string) => void;
  onOpenGroupSettings: () => void;
}

// Simple fixed sidebar that displays how many devices fall into each status and
// lets the user filter the list by clicking a status. The parent (App)
// performs the counting and filtering; this component just renders controls.
const Sidebar: React.FC<SidebarProps> = ({
  counts,
  selectedStatus,
  onSelectStatus,
  groups,
  selectedGroup,
  onSelectGroup,
  onOpenGroupSettings,
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

  const renderGroupItem = (group: SidebarGroup) => {
    const isSelected = group.name === selectedGroup;
    return (
      <li key={group.name}>
        <button
          type="button"
          className={`sidebar__group-item ${
            isSelected ? 'sidebar__group-item--selected' : ''
          }`}
          onClick={() => onSelectGroup(group.name)}
          aria-pressed={isSelected}
        >
          <span>{group.name}</span>
          <strong>{group.deviceCount}</strong>
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

      <div className="sidebar__section-header">
        <h3 className="sidebar__section-title">Groups</h3>
        <button
          type="button"
          className="sidebar__section-action"
          onClick={onOpenGroupSettings}
          aria-label="Manage groups"
        >
          Manage
        </button>
      </div>
      {groups.length === 0 ? (
        <p className="sidebar__empty">No groups available</p>
      ) : (
        <ul className="sidebar__group-list">
          {groups.map((group) => renderGroupItem(group))}
        </ul>
      )}
    </aside>
  );
};

export default Sidebar;
