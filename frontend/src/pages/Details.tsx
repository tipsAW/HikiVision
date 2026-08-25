import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import { Filters } from '../components/Filters';
import { API_BASE_URL } from '../config';

export const Details: React.FC = () => {
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
        const response = await axios.get(`${API_BASE_URL}/api/details/${state.fileId}`, { params });
        setData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state]);

  if (!state.fileId) {
    return <div style={{ paddingTop: '40px', textAlign: 'center' }}><h2>No hay datos cargados</h2></div>;
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <h1 style={{ marginBottom: '24px' }}>Detalle de Marcaciones</h1>
      
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
                  <th>Fecha</th>
                  <th>Empleado</th>
                  <th>Área</th>
                  <th>Hora</th>
                  <th>Nº Marcación Día</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.fecha}</td>
                    <td style={{ fontWeight: 500 }}>{row.nombre_empleado}</td>
                    <td>{row.area}</td>
                    <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{row.hora}</td>
                    <td>Marcación {row.numero_marcacion}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No se encontraron registros
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
