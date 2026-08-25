import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Filters } from '../components/Filters';
import { API_BASE_URL } from '../config';

export const Persons: React.FC = () => {
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
        const response = await axios.get(`${API_BASE_URL}/api/persons/${state.fileId}`, { params });
        setData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state]);

  const handleExport = async () => {
    if (!state.fileId) return;
    try {
      const params = new URLSearchParams({
        start_date: state.startDate || '',
        end_date: state.endDate || '',
        start_time: state.startTime || '',
        end_time: state.endTime || '',
        empleado: state.empleado || '',
        area: state.area || ''
      });
      window.open(`${API_BASE_URL}/api/export/${state.fileId}?${params.toString()}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (!state.fileId) {
    return <div style={{ paddingTop: '40px', textAlign: 'center' }}><h2>No hay datos cargados</h2></div>;
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Personas</h1>
        <button className="btn btn-primary" onClick={handleExport}>
          <Download size={18} /> Exportar Reporte
        </button>
      </div>
      
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
                  <th>Área</th>
                  <th>Primer Registro</th>
                  <th>Último Registro</th>
                  <th>Nº Registros</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{row.nombre_empleado}</td>
                    <td>{row.area}</td>
                    <td>{row.primer_registro}</td>
                    <td>{row.ultimo_registro}</td>
                    <td>
                      <span className="status-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                        {row.num_registros}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No se encontraron personas con los filtros actuales
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
