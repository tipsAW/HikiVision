import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import { API_BASE_URL } from '../config';
import { Clock, Search, Upload, Download } from 'lucide-react';

export const LunchControl: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const getStatusClass = (color: string) => {
    switch(color?.toLowerCase()) {
      case 'verde': return 'status-verde';
      case 'naranja': return 'status-naranja';
      case 'amarillo': return 'status-amarillo';
      case 'rojo': return 'status-rojo';
      default: return '';
    }
  };

  const filteredData = data.filter(row => 
    !searchTerm || (row.empleado && row.empleado.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExport = () => {
    if (!state.fileId) return;
    window.open(`${API_BASE_URL}/api/export/${state.fileId}?start_time=12:00&end_time=15:00`, '_blank');
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
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '6px 14px', 
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
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Buscar empleado..."
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
                  <th>Fecha</th>
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
                    <td>{row.fecha}</td>
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
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
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
