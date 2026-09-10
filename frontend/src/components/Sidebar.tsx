import React from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, Upload } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        Marcaciones
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Upload size={20} />
          <span>Cargar Datos</span>
        </NavLink>
        <NavLink to="/lunch" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Clock size={20} />
          <span>Control Almuerzo</span>
        </NavLink>
      </div>
    </div>
  );
};
