import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import { API_BASE_URL } from '../config';
import { Clock, Search, Upload, Download, Calendar } from 'lucide-react';

export const LunchControl: React.FC = () => {
  const { state, setFilters } = useAppContext();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState<{ numero: number; label: string; start_date: string; end_date: string }[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('todas');
  const [selectedDay, setSelectedDay] = useState<string>('todos');

  // Load available weeks from backend
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

  const fetchData = async () => {
    if (!state.fileId) return;
    setLoading(true);
    try {
      const params = {
        start_date: state.startDate || undefined,
        end_date: state.endDate || undefined,
        start_time: '12:00',
        end_time: '15:00',
        empleado: state.empleado || undefined,
        area: state.area || undefined
      };
      const response = await axios.get(`${API_BASE_URL}/api/lunch/${state.fileId}`, { params });
      setData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [state.fileId, state.startDate, state.endDate, state.empleado, state.area]);

  const handleWeekChange = (val: string) => {
    setSelectedWeek(val);
    if (val !== 'todas') {
      const found = availableWeeks.find(w => String(w.numero) === val);
      if (found) {
        setFilters({
          startDate: found.start_date,
          endDate: found.end_date
        });
      }
    }
  };

  const getStatusClass = (color: string) => {
    switch(color?.toLowerCase()) {
      case 'verde': return 'status-verde';
      case 'naranja': return 'status-naranja';
      case 'amarillo': return 'status-amarillo';
      case 'rojo': return 'status-rojo';
      default: return '';
    }
  };

  const filteredData = data.filter(row => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || 
      (row.empleado && row.empleado.toLowerCase().includes(term)) ||
      (row.apellido && row.apellido.toLowerCase().includes(term));

    const matchesDay = selectedDay === 'todos' || 
      (row.dia_semana && row.dia_semana.toLowerCase() === selectedDay.toLowerCase());

    const matchesWeek = selectedWeek === 'todas' || 
      (row.numero_semana && String(row.numero_semana) === String(selectedWeek));

    return matchesSearch && matchesDay && matchesWeek;
  });

  const handleExport = () => {
    if (!state.fileId) return;
    const start = state.startDate || '';
    const end = state.endDate || '';
    window.open(`${API_BASE_URL}/api/export/${state.fileId}?start_date=${start}&end_date=${end}&start_time=12:00&end_time=15:00`, '_blank');
  };

  if (!state.fileId) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px' }}>
          <Clock size={48} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '12px' }}>No hay datos cargados</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Para visualizar el Control de Almuerzo, por favor carga un archivo Excel con las marcaciones.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} />
            <span>Cargar Archivo Excel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Control de Almuerzo</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Análisis de salidas y regresos estimados (Horario estándar de almuerzo: 12:00 PM a 15:00 PM)
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Week selector */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            padding: '6px 12px', 
            borderRadius: '10px', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            fontSize: '13px' 
          }}>
            <Calendar size={16} color="var(--accent-primary)" />
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Semana:</span>
            <select 
              value={selectedWeek} 
              onChange={e => handleWeekChange(e.target.value)}
              className="input-field" 
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', background: 'rgba(0,0,0,0.3)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <option value="todas">Todas las semanas</option>
              {availableWeeks.map(w => (
                <option key={w.numero} value={String(w.numero)}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          {/* Day of week selector */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            padding: '6px 12px', 
            borderRadius: '10px', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            fontSize: '13px' 
          }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Día:</span>
            <select 
              value={selectedDay} 
              onChange={e => setSelectedDay(e.target.value)}
              className="input-field" 
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', background: 'rgba(0,0,0,0.3)', color: 'var(--text-main)', cursor: 'pointer' }}
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

          {/* Date range picker */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            padding: '6px 12px', 
            borderRadius: '10px', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            fontSize: '13px' 
          }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Desde:</span>
            <input 
              type="date" 
              value={state.startDate}
              onChange={e => {
                setSelectedWeek('todas');
                setFilters({ startDate: e.target.value });
              }}
              className="input-field" 
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', background: 'rgba(0,0,0,0.2)' }} 
            />
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Hasta:</span>
            <input 
              type="date" 
              value={state.endDate}
              onChange={e => {
                setSelectedWeek('todas');
                setFilters({ endDate: e.target.value });
              }}
              className="input-field" 
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', background: 'rgba(0,0,0,0.2)' }} 
            />
          </div>

          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '8px 14px', 
            borderRadius: '20px', 
            background: 'rgba(59, 130, 246, 0.15)', 
            color: 'var(--accent-primary)',
            fontSize: '13px',
            fontWeight: 600,
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <Clock size={16} />
            12:00 PM - 15:00 PM
          </span>

          <button 
            className="btn btn-secondary" 
            onClick={handleExport}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
            title="Exportar reporte Excel"
          >
            <Download size={16} />
            <span>Exportar</span>
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
            title="Cargar otro archivo"
          >
            <Upload size={16} />
            <span>Cambiar Archivo</span>
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Buscar por empleado o apellido..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '38px', width: '100%' }}
            />
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Mostrando <strong>{filteredData.length}</strong> {filteredData.length === 1 ? 'registro' : 'registros'}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="loader" />
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Apellido</th>
                  <th>Fecha</th>
                  <th>Día</th>
                  <th>Salida Estimada</th>
                  <th>Regreso Estimado</th>
                  <th>Tiempo Fuera</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{row.empleado}</td>
                    <td style={{ fontWeight: 500, color: 'var(--accent-secondary)' }}>{row.apellido || '-'}</td>
                    <td>{row.fecha}</td>
                    <td>
                      <span style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        color: 'var(--text-muted)' 
                      }}>
                        {row.dia_semana || '-'}
                      </span>
                    </td>
                    <td>{row.salida_estimada}</td>
                    <td>{row.regreso_estimado}</td>
                    <td>
                      {row.tiempo_fuera_minutos ? (
                        <span style={{ fontWeight: 600 }}>{row.tiempo_fuera_minutos} min</span>
                      ) : '--'}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(row.color)}`}>
                        {row.estado}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No hay registros para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
