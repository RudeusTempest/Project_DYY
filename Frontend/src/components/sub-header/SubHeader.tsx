import React from 'react';
import './SubHeader.css';

export interface SubHeaderItem {
  label: string;
  onClick?: () => void;
}

interface SubHeaderProps {
  items: SubHeaderItem[];
}

const SubHeader: React.FC<SubHeaderProps> = ({ items }) => (
  <div className="sub-header">
    <nav className="sub-header__breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {index > 0 && <span className="sub-header__separator">&gt;</span>}
          {item.onClick ? (
            <button
              type="button"
              className="sub-header__link"
              onClick={item.onClick}
            >
              {item.label}
            </button>
          ) : (
            <span className="sub-header__label">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  </div>
);

export default SubHeader;
