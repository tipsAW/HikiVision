import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import { Filters } from '../components/Filters';
import { API_BASE_URL } from '../config';

export const LunchControl: React.FC = () => {
  const { state } = useAppContext();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state.fileId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {
          start_date: state.startDate || undefined,
          end_date: state.endDate || undefined,
          start_time: state.startTime || undefined,
          end_time: state.endTime || undefined,
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

    fetchData();
  }, [state]);

  const getStatusClass = (color: string) => {
    switch(color.toLowerCase()) {
      case 'verde': return 'status-verde';
      case 'naranja': return 'status-naranja';
      case 'amarillo': return 'status-amarillo';
      case 'rojo': return 'status-rojo';
      default: return '';
    }
  };

  if (!state.fileId) {
    return <div style={{ paddingTop: '40px', textAlign: 'center' }}><h2>No hay datos cargados</h2></div>;
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <h1 style={{ marginBottom: '8px' }}>Control de Almuerzo</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Análisis de salidas y regresos estimados basados en el primer y último registro del rango horario seleccionado.
      </p>
      
      <Filters />

      <div className="glass-panel" style={{ padding: '24px' }}>
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
                {data.map((row, idx) => (
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
                {data.length === 0 && (
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
