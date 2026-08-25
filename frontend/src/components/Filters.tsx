import React from 'react';
import { useAppContext } from '../context/AppContext';

export const Filters: React.FC = () => {
  const { state, setFilters, clearFilters } = useAppContext();

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>Filtros</h3>
        <button className="btn btn-secondary" onClick={clearFilters} style={{ padding: '6px 12px', fontSize: '12px' }}>
          Limpiar Filtros
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="input-group">
          <span className="input-label">Fecha Desde</span>
          <input 
            type="date" 
            className="input-field" 
            value={state.startDate} 
            onChange={e => setFilters({ startDate: e.target.value })}
          />
        </div>
        <div className="input-group">
          <span className="input-label">Fecha Hasta</span>
          <input 
            type="date" 
            className="input-field" 
            value={state.endDate} 
            onChange={e => setFilters({ endDate: e.target.value })}
          />
        </div>
        
        <div className="input-group">
          <span className="input-label">Hora Desde</span>
          <input 
            type="time" 
            className="input-field" 
            value={state.startTime} 
            onChange={e => setFilters({ startTime: e.target.value })}
          />
        </div>
        <div className="input-group">
          <span className="input-label">Hora Hasta</span>
          <input 
            type="time" 
            className="input-field" 
            value={state.endTime} 
            onChange={e => setFilters({ endTime: e.target.value })}
          />
        </div>
        
        <div className="input-group">
          <span className="input-label">Empleado</span>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar por nombre..."
            value={state.empleado} 
            onChange={e => setFilters({ empleado: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};
