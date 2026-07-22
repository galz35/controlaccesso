import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { DoorOpen, LogOut, Building2, RefreshCw, Users } from 'lucide-react';

export default function DashboardPage() {
  const [hoy, setHoy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/acceso/hoy'); setHoy(res.data || []); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const registrarSalida = async (id: number) => {
    try { await api.post(`/acceso/salida/${id}`); load(); } catch {}
  };

  const totalEntradas = hoy.length;
  const totalSalidas = hoy.filter(r => r.fechaSalida).length;
  const dentro = totalEntradas - totalSalidas;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Resumen de accesos</h1>
          <p className="page-header__subtitle">{new Date().toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <a href="/control-acceso/registro" className="btn btn--primary"><DoorOpen className="icon icon--sm" /> Registrar acceso</a>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card--red"><DoorOpen className="icon--md kpi-card__icon" /><div className="kpi-card__value">{totalEntradas}</div><div className="kpi-card__label">Entradas hoy</div></div>
        <div className="kpi-card kpi-card--dark"><LogOut className="icon--md kpi-card__icon" /><div className="kpi-card__value">{totalSalidas}</div><div className="kpi-card__label">Salidas</div></div>
        <div className="kpi-card kpi-card--green"><Building2 className="icon--md kpi-card__icon" /><div className="kpi-card__value">{dentro}</div><div className="kpi-card__label">Dentro del edificio</div></div>
      </div>

      <div className="card">
        <div className="card__header">
          <span className="font-bold" style={{ fontSize: 16 }}><Users className="icon v-middle" /> Accesos de hoy</span>
          <button onClick={load} className="btn btn--ghost btn--sm" disabled={loading}><RefreshCw className={`icon icon--sm ${loading ? 'spinner' : ''}`} />{loading ? 'Cargando…' : 'Recargar'}</button>
        </div>
        <div className="card__body card__body--flush">
          {loading ? (
            <div className="empty-state"><div className="spinner mx-auto" /></div>
          ) : hoy.length === 0 ? (
            <div className="empty-state"><DoorOpen className="icon--lg empty-state__icon" /><p className="empty-state__desc">No hay accesos registrados hoy</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr>
                  <th scope="col">Tipo</th><th scope="col">Nombre</th><th scope="col">Cédula</th><th scope="col">Edificio</th>
                  <th scope="col" className="text-center">Entrada</th><th scope="col" className="text-center">Salida</th><th scope="col" className="text-center">Acción</th>
                </tr></thead>
                <tbody>
                  {hoy.map(r => (
                    <tr key={r.id}>
                      <td><span className="badge badge--neutral">{r.tipoPersona}</span></td>
                      <td className="font-bold">{r.nombre}</td>
                      <td className="text-muted text-xs">{r.cedula || '-'}</td>
                      <td className="text-muted text-xs">{r.edificio}</td>
                      <td className="text-center text-xs">{new Date(r.fechaEntrada).toLocaleTimeString()}</td>
                      <td className="text-center">{r.fechaSalida ? <span className="badge badge--neutral">{new Date(r.fechaSalida).toLocaleTimeString()}</span> : <span className="badge badge--success">Dentro</span>}</td>
                      <td className="text-center">{!r.fechaSalida && <button onClick={() => registrarSalida(r.id)} className="btn btn--dark btn--sm"><LogOut className="icon icon--sm" /> Salida</button>}</td>
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
