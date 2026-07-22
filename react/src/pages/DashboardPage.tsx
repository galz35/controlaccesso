import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { DoorOpen, LogOut, Building2, RefreshCw, Users } from 'lucide-react';

export default function DashboardPage() {
  const [hoy, setHoy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/acceso/hoy');
      setHoy(res.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const registrarSalida = async (id: number) => {
    try {
      await api.post(`/acceso/salida/${id}`);
      load();
    } catch {}
  };

  const totalEntradas = hoy.length;
  const totalSalidas = hoy.filter(r => r.fechaSalida).length;
  const dentro = totalEntradas - totalSalidas;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Resumen de accesos</h1>
          <p className="page-header__subtitle">{new Date().toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <a href="/control-acceso/registro" className="btn btn--primary">
          <DoorOpen className="icon icon--sm" /> Registrar acceso
        </a>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="kpi-card kpi-card--red">
          <DoorOpen className="icon--md" style={{ color: 'var(--brand-red)', margin: '0 auto var(--space-2)' }} />
          <div className="kpi-card__value">{totalEntradas}</div>
          <div className="kpi-card__label">Entradas hoy</div>
        </div>
        <div className="kpi-card kpi-card--dark">
          <LogOut className="icon--md" style={{ color: 'var(--brand-black)', margin: '0 auto var(--space-2)' }} />
          <div className="kpi-card__value">{totalSalidas}</div>
          <div className="kpi-card__label">Salidas</div>
        </div>
        <div className="kpi-card kpi-card--green">
          <Building2 className="icon--md" style={{ color: 'var(--success)', margin: '0 auto var(--space-2)' }} />
          <div className="kpi-card__value">{dentro}</div>
          <div className="kpi-card__label">Dentro del edificio</div>
        </div>
      </div>

      {/* Accesos Hoy */}
      <div className="card">
        <div className="card__header">
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            <Users className="icon" style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Accesos de hoy
          </span>
          <button onClick={load} className="btn btn--ghost btn--sm" disabled={loading} aria-label="Recargar">
            <RefreshCw className={`icon icon--sm ${loading ? 'spinner' : ''}`} />
            {loading ? 'Cargando…' : 'Recargar'}
          </button>
        </div>
        <div className="card__body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : hoy.length === 0 ? (
            <div className="empty-state">
              <DoorOpen className="icon--lg" style={{ color: 'var(--gray-300)', margin: '0 auto 8px' }} />
              <p style={{ color: 'var(--gray-500)' }}>No hay accesos registrados hoy</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Tipo</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Cédula</th>
                    <th scope="col">Edificio</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Entrada</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Salida</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {hoy.map(r => (
                    <tr key={r.id}>
                      <td><span className="badge badge--neutral">{r.tipoPersona}</span></td>
                      <td style={{ fontWeight: 600 }}>{r.nombre}</td>
                      <td style={{ color: 'var(--gray-500)' }}>{r.cedula || '-'}</td>
                      <td style={{ color: 'var(--gray-600)' }}>{r.edificio}</td>
                      <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-500)' }}>
                        {new Date(r.fechaEntrada).toLocaleTimeString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {r.fechaSalida ? (
                          <span className="badge badge--neutral">
                            {new Date(r.fechaSalida).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span className="badge badge--success">Dentro</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {!r.fechaSalida && (
                          <button
                            onClick={() => registrarSalida(r.id)}
                            className="btn btn--dark btn--sm"
                          >
                            <LogOut className="icon icon--sm" style={{ marginRight: 4 }} /> Salida
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
