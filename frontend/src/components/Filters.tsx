import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { API_BASE_URL } from '../config';
import axios from 'axios';

export const Filters: React.FC = () => {
  const { state, setFilters, clearFilters } = useAppContext();
  const [availableWeeks, setAvailableWeeks] = useState<{ numero: number; label: string; start_date: string; end_date: string }[]>([]);

  useEffect(() => {
    if (!state.fileId) return;
    axios.get(`${API_BASE_URL}/api/weeks/${state.fileId}`)
      .then(res => {
        if (res.data?.semanas) {
          setAvailableWeeks(res.data.semanas);
        }
      })
      .catch(console.error);
  }, [state.fileId]);

  const handleWeekChange = (val: string) => {
    setFilters({ semana: val });
    if (val !== 'todas') {
      const found = availableWeeks.find(w => String(w.numero) === val);
      if (found) {
        setFilters({
          semana: val,
          startDate: found.start_date,
          endDate: found.end_date
        });
      }
    }
  };

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
          <span className="input-label">Filtrar por Semana</span>
          <select 
            className="input-field" 
            value={state.semana || 'todas'} 
            onChange={e => handleWeekChange(e.target.value)}
          >
            <option value="todas">Todas las semanas</option>
            {availableWeeks.map(w => (
              <option key={w.numero} value={String(w.numero)}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <span className="input-label">Día de la Semana</span>
          <select 
            className="input-field" 
            value={state.diaSemana || 'todos'} 
            onChange={e => setFilters({ diaSemana: e.target.value })}
          >
            <option value="todos">Todos los días</option>
            <option value="Lunes">Lunes</option>
            <option value="Martes">Martes</option>
            <option value="Miércoles">Miércoles</option>
            <option value="Jueves">Jueves</option>
            <option value="Viernes">Viernes</option>
            <option value="Sábado">Sábado</option>
            <option value="Domingo">Domingo</option>
          </select>
        </div>

        <div className="input-group">
          <span className="input-label">Fecha Desde</span>
          <input 
            type="date" 
            className="input-field" 
            value={state.startDate} 
            onChange={e => setFilters({ startDate: e.target.value, semana: 'todas' })}
          />
        </div>
        <div className="input-group">
          <span className="input-label">Fecha Hasta</span>
          <input 
            type="date" 
            className="input-field" 
            value={state.endDate} 
            onChange={e => setFilters({ endDate: e.target.value, semana: 'todas' })}
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
          <span className="input-label">Empleado / Apellido</span>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar por nombre o apellido..."
            value={state.empleado} 
            onChange={e => setFilters({ empleado: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};
