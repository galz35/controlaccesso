import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, Search, X, Building2 } from 'lucide-react';
import { showSuccess, showError } from '../lib/swal';

export default function SalidasPage() {
  const { user } = useAuth();
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch] = useState('');
  const [exitingId, setExitingId] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [ssForm, setSsForm] = useState({ personaId: '', nombrePersona: '', observacion: '' });
  const edificioId = user?.edificioIdDefecto || null;

  const load = useCallback(async () => {
    setLoading(true); setApiError(false);
    try {
      const params: any = {};
      if (edificioId) params.edificioId = String(edificioId);
      const r = await api.get('/acceso/pendientes', { params });
      setPendientes(r.data || []);
    } catch { setApiError(true); }
    setLoading(false);
  }, [edificioId]);

  useEffect(() => { load(); }, [load]);

  const salida = async (r: any) => {
    setExitingId(r.id);
    try { await api.post(`/acceso/salida/${r.id}`); showSuccess('Salida registrada', r.nombre); load(); }
    catch { showError('Error', 'No se pudo registrar la salida'); }
    setExitingId(null);
  };

  const filtrados = search ? pendientes.filter(r =>
    r.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (r.personaId && r.personaId.includes(search))
  ) : pendientes;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title"><LogOut className="icon" /> Registrar Salida</h1>
        <p className="page-header__subtitle" style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          Registrar la salida es opcional. Esta función no controla horario laboral.
        </p>
      </div>

      {edificioId && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
          background: 'var(--white)', borderBottom: '2px solid var(--brand-red)',
          marginBottom: 16, borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
        }}>
          <Building2 className="icon icon--sm" style={{ color: 'var(--brand-red)' }} />
          <strong style={{ fontSize: 14 }}>Edificio:</strong>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--brand-red)' }}>
            Edificio {edificioId}
          </span>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__body" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Search className="icon icon--sm text-muted" />
          <input type="text" className="form-control" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Escanee carnet o busque por nombre…" autoFocus style={{ flex: 1 }} />
          {search && <button onClick={() => setSearch('')} className="btn btn--ghost btn--sm"><X className="icon icon--sm" /></button>}
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <span className="card-title"><LogOut className="icon" /> Entradas sin salida registrada</span>
          <span className="text-muted text-xs">{pendientes.length} persona(s)</span>
        </div>
        <div className="card__body card__body--flush">
          {apiError ? (
            <div className="empty-state"><p className="empty-state__desc">No pudimos consultar los accesos activos.</p><button onClick={load} className="btn btn--primary btn--sm mt-2">Reintentar</button></div>
          ) : loading ? (
            <div className="empty-state"><div className="spinner mx-auto" /></div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <LogOut className="icon--lg empty-state__icon" />
              <p className="empty-state__desc">{search ? 'Sin resultados para esa búsqueda' : 'No hay entradas sin salida registrada'}</p>
              <p className="text-muted text-xs" style={{ marginTop: 4 }}>La salida es opcional; esta lista no confirma presencia actual.</p>
            </div>
          ) : (
            <div className="salida-list">
              {filtrados.map(r => (
                <div key={r.id} className="salida-item" style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)' }}>
                  <div className="flex--1">
                    <div className="font-bold">{r.nombre}</div>
                    <div className="form-hint" style={{ marginTop: 2 }}>
                      Entrada: {new Date(r.fechaEntrada).toLocaleTimeString()} · {r.motivoAcceso || 'Sin motivo'}
                    </div>
                    {r.cedula && <div className="text-xs text-muted" style={{ marginTop: 1 }}>Código: {r.cedula}</div>}
                  </div>
                  <button onClick={() => salida(r)} disabled={exitingId === r.id}
                    className="btn btn--dark btn--sm" style={{ whiteSpace: 'nowrap' }}>
                    {exitingId === r.id ? '…' : <><LogOut className="icon icon--sm" /> Registrar salida</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={() => setShowDialog(true)} className="btn btn--secondary btn--block" style={{ marginTop: 12 }}>
        Registrar salida sin entrada previa
      </button>

      {showDialog && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowDialog(false)}>
          <div className="card" style={{ maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="card__header"><span className="card-title">Registrar salida sin entrada previa</span></div>
            <div className="card__body">
              <div className="form-group">
                <label htmlFor="ss-carnet" className="form-label form-label--required">Carnet o código</label>
                <input id="ss-carnet" type="text" className="form-control" value={ssForm.personaId}
                  onChange={e => setSsForm({ ...ssForm, personaId: e.target.value })} placeholder="Ej: 500708" autoFocus />
              </div>
              <div className="form-group">
                <label htmlFor="ss-nombre" className="form-label form-label--required">Nombre</label>
                <input id="ss-nombre" type="text" className="form-control" value={ssForm.nombrePersona}
                  onChange={e => setSsForm({ ...ssForm, nombrePersona: e.target.value })} placeholder="Nombre completo" />
              </div>
              <div className="form-group">
                <label htmlFor="ss-obs" className="form-label form-label--required">Observación</label>
                <select id="ss-obs" className="form-control" value={ssForm.observacion}
                  onChange={e => setSsForm({ ...ssForm, observacion: e.target.value })}>
                  <option value="">Seleccione una observación…</option>
                  <option value="No se registró la entrada">No se registró la entrada</option>
                  <option value="Entrada registrada en papel">Entrada registrada en papel</option>
                  <option value="Falla temporal del sistema">Falla temporal del sistema</option>
                  <option value="Otro">Otro</option>
                </select>
                {ssForm.observacion === 'Otro' && (
                  <input type="text" className="form-control" style={{ marginTop: 8 }} placeholder="Describa la situación…"
                    onChange={e => setSsForm({ ...ssForm, observacion: e.target.value })} />
                )}
              </div>
              <div className="form-actions">
                <button onClick={async () => {
                  if (!ssForm.personaId || !ssForm.nombrePersona || !ssForm.observacion) { showError('Complete todos los campos'); return; }
                  try {
                    await api.post('/acceso/salida-independiente', {
                      edificioId: Number(edificioId) || 0,
                      personaId: ssForm.personaId.trim(),
                      nombrePersona: ssForm.nombrePersona.trim(),
                      observacion: ssForm.observacion.trim(),
                    });
                    showSuccess('Salida registrada sin entrada previa');
                    setShowDialog(false); setSsForm({ personaId: '', nombrePersona: '', observacion: '' }); load();
                  } catch (err: any) { showError('Error', err?.response?.data?.message || 'Error'); }
                }} className="btn btn--dark" disabled={!edificioId}>Registrar salida sin entrada</button>
                <button type="button" onClick={() => setShowDialog(false)} className="btn btn--secondary">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
