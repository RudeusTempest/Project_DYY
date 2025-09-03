import React, { forwardRef } from 'react';
import Logo from './Logo';

type HeaderProps = {
  loading: boolean;
  onRefresh: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
};

const Header = forwardRef<HTMLDivElement, HeaderProps>(({ loading, onRefresh, searchTerm, onSearchChange }, ref) => {
  return (
    <div className="app-header" ref={ref}>
      <div className="header-container">
        <div className="header-section">
          <Logo />
          <h1>Network Device Monitor</h1>
          {!loading && (
            <div className="header-search">
              <input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          <button
            onClick={onRefresh}
            className="refresh-button"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default Header;
