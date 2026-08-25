import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, List, Upload } from 'lucide-react';

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
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/persons" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Personas</span>
        </NavLink>
        <NavLink to="/lunch" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Clock size={20} />
          <span>Control Almuerzo</span>
        </NavLink>
        <NavLink to="/details" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <List size={20} />
          <span>Detalle</span>
        </NavLink>
      </div>
    </div>
  );
};
