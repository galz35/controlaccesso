import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DoorOpen, LogOut, Building2, RefreshCw, Users, X, Camera } from 'lucide-react';
import { showSuccess, showError } from '../lib/swal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [hoy, setHoy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [exitingId, setExitingId] = useState<number | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const BASE_URL = import.meta.env.VITE_API_URL || '';
  const photoUrl = (url: string) => url.startsWith('http') ? url : `${BASE_URL}${url}`;

  const load = useCallback(async () => {
    setLoading(true); setApiError(false);
    try { const res = await api.get('/acceso/hoy'); setHoy(res.data || []); } catch { setApiError(true); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const registrarSalida = async (r: any) => {
    const confirm = window.confirm(`¿Registrar salida de ${r.nombre}? (${r.edificio} - ${new Date(r.fechaEntrada).toLocaleTimeString()})`);
    if (!confirm) return;
    setExitingId(r.id);
    try { await api.post(`/acceso/salida/${r.id}`); showSuccess('Salida registrada', r.nombre); load(); }
    catch { showError('Error', 'No se pudo registrar la salida'); }
    setExitingId(null);
  };

  const totalEntradas = hoy.length;
  const totalSalidas = hoy.filter(r => r.fechaSalida).length;
  const dentro = totalEntradas - totalSalidas;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title"><DoorOpen /> Resumen de accesos</h1>
          <p className="page-header__subtitle">{new Date().toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={() => navigate('/control-acceso/registro')} className="btn btn--primary"><DoorOpen className="icon icon--sm" /> Registrar acceso</button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card--red"><DoorOpen className="icon--md kpi-card__icon" /><div className="kpi-card__value">{totalEntradas}</div><div className="kpi-card__label">Entradas hoy</div></div>
        <div className="kpi-card kpi-card--dark"><LogOut className="icon--md kpi-card__icon" /><div className="kpi-card__value">{totalSalidas}</div><div className="kpi-card__label">Salidas</div></div>
        <div className="kpi-card kpi-card--green"><Building2 className="icon--md kpi-card__icon" /><div className="kpi-card__value">{dentro}</div><div className="kpi-card__label">Sin salida registrada</div></div>
      </div>

      <div className="card">
        <div className="card__header">
          <span className="card-title"><Users className="icon" /> Accesos de hoy</span>
          <button onClick={load} className="btn btn--ghost btn--sm" disabled={loading}>
            <RefreshCw className={`icon icon--sm ${loading ? 'icon--spin' : ''}`} /> {loading ? 'Cargando…' : 'Recargar'}
          </button>
        </div>
        <div className="card__body card__body--flush">
          {apiError ? (
            <div className="empty-state"><p className="empty-state__desc">No pudimos consultar los accesos.</p><button onClick={load} className="btn btn--primary btn--sm mt-2">Reintentar</button></div>
          ) : loading ? (
            <div className="empty-state"><div className="spinner mx-auto" /></div>
          ) : hoy.length === 0 ? (
            <div className="empty-state"><DoorOpen className="icon--lg empty-state__icon" /><p className="empty-state__desc">No hay accesos registrados hoy</p></div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="table-wrapper access-table-desktop">
                <table className="table">
                  <caption className="visually-hidden">Accesos registrados hoy</caption>
                  <thead><tr>
                    <th scope="col">Tipo</th><th scope="col">Nombre</th><th scope="col">Cédula</th><th scope="col">Edificio</th>
                    <th scope="col" className="text-center">Foto</th>
                    <th scope="col" className="text-center">Entrada</th><th scope="col" className="text-center">Salida</th><th scope="col" className="text-center">Acción</th>
                  </tr></thead>
                  <tbody>
                    {hoy.map(r => (
                      <tr key={r.id}>
                        <td><span className="badge badge--neutral">{r.tipoPersona}</span></td>
                        <td className="font-bold">{r.nombre}</td>
                        <td className="text-muted text-xs">{r.cedula || '-'}</td>
                        <td className="text-muted text-xs">{r.edificio}</td>
                        <td className="text-center">{r.fotoUrl ? <button onClick={() => setFotoPreview(r.fotoUrl)} className="btn btn--ghost btn--sm btn--icon" aria-label="Ver foto"><Camera className="icon icon--sm" /></button> : '-'}</td>
                        <td className="text-center text-xs">{new Date(r.fechaEntrada).toLocaleTimeString()}</td>
                        <td className="text-center">{r.fechaSalida ? <span className="badge badge--neutral">{new Date(r.fechaSalida).toLocaleTimeString()}</span> : <span className="badge badge--neutral">Sin salida</span>}</td>
                        <td className="text-center">{!r.fechaSalida && (
                          <button onClick={() => registrarSalida(r)} disabled={exitingId === r.id} className="btn btn--dark btn--sm">
                            {exitingId === r.id ? '…' : <><LogOut className="icon icon--sm" /> Salida</>}
                          </button>
                        )}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="access-cards-mobile" style={{ padding: 'var(--space-3)' }}>
                {hoy.map(r => (
                  <div key={r.id} className="access-card">
                    <div className="access-card__header">
                      <div>
                        <div className="access-card__name">{r.nombre}</div>
                        <span className="badge badge--neutral">{r.tipoPersona}</span>
                      </div>
                      <div className="access-card__badge">{r.fechaSalida ? <span className="badge badge--neutral">Salió</span> : <span className="badge badge--neutral">Sin salida</span>}</div>
                    </div>
                    <div className="access-card__details">{r.edificio} {r.cedula ? `· ${r.cedula}` : ''}</div>
                    <div className="access-card__time">
                      <span>Entrada: {new Date(r.fechaEntrada).toLocaleTimeString()}</span>
                      {r.fechaSalida && <span>Salida: {new Date(r.fechaSalida).toLocaleTimeString()}</span>}
                    </div>
                    {!r.fechaSalida && (
                      <button onClick={() => registrarSalida(r)} disabled={exitingId === r.id} className="btn btn--dark btn--block btn--sm">
                        {exitingId === r.id ? 'Registrando…' : <><LogOut className="icon icon--sm" /> Registrar Salida</>}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Foto Preview Modal */}
      {fotoPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setFotoPreview(null)}>
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
            <button onClick={() => setFotoPreview(null)} className="btn btn--primary btn--sm"><X className="icon icon--sm" /> Cerrar</button>
          </div>
          <img src={photoUrl(fotoPreview)} alt="Foto de acceso"
            style={{ maxWidth: '90%', maxHeight: '85%', borderRadius: 8, objectFit: 'contain' }}
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
