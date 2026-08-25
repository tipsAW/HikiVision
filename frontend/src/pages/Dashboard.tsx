import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, FileText, PlusCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { Filters } from '../components/Filters';
import { API_BASE_URL } from '../config';

export const Dashboard: React.FC = () => {
  const { state } = useAppContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.fileId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          start_date: state.startDate || undefined,
          end_date: state.endDate || undefined,
          start_time: state.startTime || undefined,
          end_time: state.endTime || undefined,
          empleado: state.empleado || undefined,
          area: state.area || undefined
        };
        const response = await axios.get(`${API_BASE_URL}/api/dashboard/${state.fileId}`, { params });
        setData(response.data);
      } catch (err: any) {
        setError("Error al cargar datos del dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state]);

  if (!state.fileId) {
    return (
      <div style={{ paddingTop: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>No hay datos cargados</h2>
        <p>Por favor ve a la sección "Cargar Datos" y sube un archivo Excel primero.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <h1 style={{ marginBottom: '24px' }}>Dashboard Resumen</h1>
      
      <Filters />

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-red)', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="loader" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : data ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div className="kpi-card glass-panel" style={{ position: 'relative' }}>
              <span className="kpi-title">Personas Únicas</span>
              <span className="kpi-value" style={{ color: 'var(--accent-primary)' }}>{data.kpis.personas_unicas}</span>
              <Users className="kpi-icon" size={32} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Registradas en el periodo</span>
            </div>
            
            <div className="kpi-card glass-panel" style={{ position: 'relative' }}>
              <span className="kpi-title">Total Registros</span>
              <span className="kpi-value">{data.kpis.total_registros}</span>
              <FileText className="kpi-icon" size={32} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Marcaciones válidas</span>
            </div>
            
            <div className="kpi-card glass-panel" style={{ position: 'relative' }}>
              <span className="kpi-title">Registros Adicionales</span>
              <span className="kpi-value">{data.kpis.registros_adicionales}</span>
              <PlusCircle className="kpi-icon" size={32} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Marcaciones extra</span>
            </div>
            
            <div className="kpi-card glass-panel" style={{ position: 'relative' }}>
              <span className="kpi-title">Incompletos (1 Reg)</span>
              <span className="kpi-value" style={{ color: 'var(--status-orange)' }}>{data.kpis.un_registro}</span>
              <AlertTriangle className="kpi-icon" size={32} color="var(--status-orange)" />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Personas con un solo registro / día</span>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>Personas por Día</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.graficos.personas_por_dia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="dia" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                    <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-surface)', border: 'none', borderRadius: '8px', color: 'white' }}
                      itemStyle={{ color: 'var(--accent-primary)' }}
                    />
                    <Bar dataKey="cantidad" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>Marcaciones por Hora (Total)</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.graficos.marcaciones_por_hora} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                    <YAxis dataKey="hora_bloque" type="category" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} width={100} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-surface)', border: 'none', borderRadius: '8px', color: 'white' }}
                      itemStyle={{ color: 'var(--status-green)' }}
                    />
                    <Bar dataKey="cantidad" fill="var(--status-green)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
