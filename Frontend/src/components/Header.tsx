import React from 'react';
import './Header.css';
import logoLeft from '../logos/erez-logo.svg';
import logoRight from '../logos/maof-logo.svg';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenSettings: () => void;
  onOpenAddDevice: () => void;
}

// The header stays fixed at the top and exposes the global actions (search and
// settings). Keeping the component small and explicit helps beginners see which
// props flow in from the parent App component.
const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  onOpenSettings,
  onOpenAddDevice,
}) => {
  return (
    <header className="header">
      <div className="header__branding">
        <img
          src={logoLeft}
          alt="Company logo left"
          className="header__logo"
        />
        <span className="header__title">Network Device Monitor</span>
        <img
          src={logoRight}
          alt="Company logo right"
          className="header__logo"
        />
      </div>

      <div className="header__actions">
        <input
          className="header__search"
          type="text"
          placeholder="Search by hostname or IP..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <button className="header__add-device-button" onClick={onOpenAddDevice}>
          Add Device
        </button>
        <button className="header__settings-button" onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    </header>
  );
};

export default Header;
