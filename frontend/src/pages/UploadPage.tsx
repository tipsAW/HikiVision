import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { API_BASE_URL } from '../config';

export const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setFileId, setFilters } = useAppContext();
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
      setFileId(response.data.file_id);
      if (response.data.min_date && response.data.max_date) {
        setFilters({
          startDate: response.data.min_date,
          endDate: response.data.max_date,
          semana: 'todas',
          diaSemana: 'todos'
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al subir el archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
      <h1 style={{ marginBottom: '8px' }}>Cargar Datos</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Sube un archivo Excel (.xlsx, .xls) o CSV con las marcaciones del personal.
      </p>
      
      {!result ? (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div 
            className="upload-area" 
            onDragOver={handleDragOver} 
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={48} color="var(--accent-primary)" />
            <h3 style={{ margin: 0 }}>Arrastra y suelta tu archivo aquí</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>o haz clic para seleccionar del equipo</p>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
          
          {file && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ display: 'block' }}>Archivo seleccionado:</strong>
                <span style={{ color: 'var(--accent-secondary)' }}>{file.name}</span>
              </div>
              <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
                {loading ? <div className="loader" /> : 'Procesar Archivo'}
              </button>
            </div>
          )}
          
          {error && (
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--status-red)', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--status-red)' }}>
              <AlertCircle />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', color: 'var(--status-green)' }}>
            <CheckCircle size={32} />
            <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Archivo procesado exitosamente</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div className="kpi-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <span className="kpi-title">Registros Procesados</span>
              <span className="kpi-value">{result.registros_totales}</span>
            </div>
            <div className="kpi-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <span className="kpi-title">Registros Válidos</span>
              <span className="kpi-value" style={{ color: 'var(--status-green)' }}>{result.registros_validos}</span>
            </div>
            <div className="kpi-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <span className="kpi-title">Errores (Descartados)</span>
              <span className="kpi-value" style={{ color: result.registros_error > 0 ? 'var(--status-red)' : 'var(--text-main)' }}>{result.registros_error}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => navigate('/lunch')}>
              Ir a Control de Almuerzo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
