import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShieldAlert, Sparkles, Code, History } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo-link">
          <div className="logo-icon-wrapper">
            <ShieldAlert size={22} className="logo-shield" />
            <Sparkles size={12} className="logo-sparkle" />
          </div>
          <span className="logo-text">Guard<span className="purple-text">AI</span></span>
        </Link>
        
        <div className="nav-links">
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end
          >
            Home
          </NavLink>
          <NavLink 
            to="/analyze" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Code size={16} />
            Analyze
          </NavLink>
          <NavLink 
            to="/history" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <History size={16} />
            History
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
