import React from 'react';
import './Sidebar.css';

interface SidebarCounts {
  total: number;
  active: number;
  inactive: number;
  unauthorized: number;
}

interface SidebarProps {
  counts: SidebarCounts;
}

// Simple fixed sidebar that displays how many devices fall into each status.
// The parent (App) performs the actual counting so this component only cares
// about display logic.
const Sidebar: React.FC<SidebarProps> = ({ counts }) => {
  return (
    <aside className="sidebar">
      <h2 className="sidebar__title">Devices</h2>
      <ul className="sidebar__list">
        <li className="sidebar__item sidebar__item--total">
          <span>Total Devices</span>
          <strong>{counts.total}</strong>
        </li>
        <li className="sidebar__item sidebar__item--active">
          <span>Active Devices</span>
          <strong>{counts.active}</strong>
        </li>
        <li className="sidebar__item sidebar__item--inactive">
          <span>Inactive Devices</span>
          <strong>{counts.inactive}</strong>
        </li>
        <li className="sidebar__item sidebar__item--unauthorized">
          <span>Unauthorized Devices</span>
          <strong>{counts.unauthorized}</strong>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
