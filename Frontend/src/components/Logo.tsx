import React from 'react';

const Logo: React.FC = () => {
  return (
    <svg
      className="app-logo"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="App Logo"
      role="img"
    >
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="10" fill="url(#g)" />
      <g fill="#fff" opacity="0.95">
        <circle cx="16" cy="24" r="4" />
        <circle cx="32" cy="14" r="3" />
        <circle cx="32" cy="34" r="3" />
        <path d="M16 24 L32 14 M16 24 L32 34" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export default Logo;

