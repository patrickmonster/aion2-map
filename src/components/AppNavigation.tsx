import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AppNavigation.css';

const AppNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="app-navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🗺️ Aion2 Map
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            지도
          </Link>
          <Link to="/calculator" className={`nav-link ${location.pathname === '/calculator' ? 'active' : ''}`}>
            계산기
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default AppNavigation;
