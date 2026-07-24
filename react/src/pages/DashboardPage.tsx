import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DoorOpen, LogOut, RefreshCw, Users, FileText } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [hoy, setHoy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true); setApiError(false);
    try { const res = await api.get('/acceso/hoy'); setHoy(res.data || []); setLastUpdate(new Date()); } catch { setApiError(true); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalEntradas = hoy.length;
  const totalSalidas = hoy.filter(r => r.fechaSalida).length;
  const sinSalida = totalEntradas - totalSalidas;

  const lastUpdateStr = `Actualizado hace ${Math.floor((Date.now() - lastUpdate.getTime()) / 60000)} min`;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title"><DoorOpen /> Resumen de accesos</h1>
          <p className="page-header__subtitle">
            {new Date().toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            <span className="text-muted text-xs" style={{ marginLeft: 8 }}>— {lastUpdateStr}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} className="btn btn--ghost btn--sm" disabled={loading}>
            <RefreshCw className={`icon icon--sm ${loading ? 'icon--spin' : ''}`} /> Actualizar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/control-acceso/reportes')} className="kpi-card kpi-card--red" style={{ cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' }}>
          <DoorOpen className="icon--md kpi-card__icon" />
          <div className="kpi-card__value">{totalEntradas}</div>
          <div className="kpi-card__label">Entradas registradas hoy</div>
        </button>
        <button onClick={() => navigate('/control-acceso/reportes')} className="kpi-card kpi-card--dark" style={{ cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' }}>
          <LogOut className="icon--md kpi-card__icon" />
          <div className="kpi-card__value">{totalSalidas}</div>
          <div className="kpi-card__label">Salidas registradas</div>
        </button>
        <button onClick={() => navigate('/control-acceso/salidas')} className="kpi-card kpi-card--green" style={{ cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' }}>
          <Users className="icon--md kpi-card__icon" />
          <div className="kpi-card__value">{sinSalida}</div>
          <div className="kpi-card__label">Entradas sin salida registrada</div>
        </button>
      </div>

      <div className="card">
        <div className="card__header">
          <span className="card-title"><DoorOpen className="icon" /> Movimientos de hoy</span>
        </div>
        <div className="card__body card__body--flush">
          {apiError ? (
            <div className="empty-state">
              <p className="empty-state__desc">No pudimos actualizar. Se muestran los últimos datos disponibles.</p>
              <button onClick={load} className="btn btn--primary btn--sm mt-2">Reintentar</button>
            </div>
          ) : loading ? (
            <div className="empty-state"><div className="spinner mx-auto" /></div>
          ) : hoy.length === 0 ? (
            <div className="empty-state">
              <DoorOpen className="icon--lg empty-state__icon" />
              <p className="empty-state__desc">No hay movimientos registrados hoy</p>
              <button onClick={() => navigate('/control-acceso/registro')} className="btn btn--primary btn--sm mt-2">
                <DoorOpen className="icon icon--sm" /> Registrar entrada
              </button>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-2) 0' }}>
              {hoy.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--gray-100)' }}>
                  <div className="flex--1">
                    <div className="font-bold">{r.nombre}</div>
                    <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                      {r.motivoAcceso || '—'} · {r.tipoPersona}
                      {r.edificio ? ` · ${r.edificio}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <div>{new Date(r.fechaEntrada).toLocaleTimeString()}</div>
                    <div style={{ color: r.fechaSalida ? 'var(--success)' : 'var(--gray-400)' }}>
                      {r.fechaSalida ? `Salida ${new Date(r.fechaSalida).toLocaleTimeString()}` : 'Sin salida registrada'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/control-acceso/registro')} className="btn btn--primary" style={{ flex: 1, justifyContent: 'center' }}>
          <DoorOpen className="icon icon--sm" /> Registrar entrada
        </button>
        <button onClick={() => navigate('/control-acceso/salidas')} className="btn btn--dark" style={{ flex: 1, justifyContent: 'center' }}>
          <LogOut className="icon icon--sm" /> Registrar salida
        </button>
        <button onClick={() => navigate('/control-acceso/reportes')} className="btn btn--secondary" style={{ flex: 1, justifyContent: 'center' }}>
          <FileText className="icon icon--sm" /> Ver reporte de hoy
        </button>
      </div>
    </div>
  );
}
