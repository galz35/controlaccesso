import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { Search, DoorOpen, LogOut, Camera, X, Loader2, GraduationCap } from 'lucide-react';
import { showSuccess, showError } from '../lib/swal';

const TIPOS = [
  { value: 'EMPLEADO', label: 'Colaborador' },
  { value: 'PROVEEDOR', label: 'Proveedor' },
  { value: 'INSTRUCTOR_EXTERNO', label: 'Facilitador Externo' },
  { value: 'INSTRUCTOR_INTERNO', label: 'Facilitador Interno' },
  { value: 'VISITANTE', label: 'Visitante' },
  { value: 'SERVICIO_EXTERNO', label: 'Servicio Externo (PL, Cocina)' },
];

const MOTIVOS = [
  'Comedor', 'Servicio de cocina', 'Carga y descarga', 'Conductor/transporte',
  'Entrega', 'Mantenimiento', 'Reunión', 'Visita general', 'Capacitación', 'Otro',
];

export default function RegistroPage() {
  const { user } = useAuth();
  const [edificios, setEdificios] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [courseError, setCourseError] = useState(false);
  const [tipo, setTipo] = useState('EMPLEADO');
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [edificioId, setEdificioId] = useState(user?.edificioIdDefecto ? String(user.edificioIdDefecto) : '');
  const [motivo, setMotivo] = useState<'general' | 'capacitacion' | null>(null);
  const [eventoCursoId, setEventoCursoId] = useState('');
  const [motivoAcceso, setMotivoAcceso] = useState('');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [nombreManual, setNombreManual] = useState('');
  const [cedulaManual, setCedulaManual] = useState('');
  const [empresaManual, setEmpresaManual] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const photosEnabled = import.meta.env.VITE_ENABLE_ACCESS_PHOTOS === 'true';

  const edificioSel = edificios.find(e => (e.Id || e.id) === parseInt(edificioId));
  const esCapacitacion = edificioSel?.EsCapacitacion || edificioSel?.esCapacitacion;

  useEffect(() => {
    api.get('/edificios').then(r => {
      const all = r.data || [];
      const allowed = user?.rol === 'admin' ? all : all.filter((item: any) =>
        Number(item.Id || item.id) === Number(user?.edificioIdDefecto));
      setEdificios(allowed);
      if (user?.rol !== 'admin' && user?.edificioIdDefecto) {
        setEdificioId(String(user.edificioIdDefecto));
      } else if (allowed.length === 1 && (allowed[0]?.EsCapacitacion || allowed[0]?.esCapacitacion)) {
        setMotivo('general');
      }
    }).catch(() => setError('No se pudieron cargar los edificios'));
  }, [user]);

  // Load eventos when training building is selected
  useEffect(() => {
    const selEdificio = edificios.find(e => (e.Id || e.id) === parseInt(edificioId));
    if (selEdificio?.EsCapacitacion || selEdificio?.esCapacitacion) {
      api.get(`/eventos-curso?edificioId=${edificioId}`).then(r => setEventos(r.data || [])).catch(() => setCourseError(true));
    } else {
      setEventos([]);
    }
  }, [edificioId, edificios]);

  const buscar = async () => {
    if (!searchQ.trim()) return;
    setSearchLoading(true); setResults(null); setSelected(null); setSearched(true);
    try {
      let endpoint = '/search/empleado';
      if (tipo === 'PROVEEDOR') endpoint = '/search/proveedor';
      else if (tipo === 'INSTRUCTOR_EXTERNO') endpoint = '/search/instructor';
      else if (tipo === 'INSTRUCTOR_INTERNO') endpoint = '/search/empleado';
      else if (tipo === 'SERVICIO_EXTERNO') endpoint = '/search/personal-externo';
      const res = await api.get(endpoint, { params: { q: searchQ } });
      setResults(res.data || []);
    } catch { setError('Error al buscar. Intente de nuevo.'); }
    setSearchLoading(false);
  };

  const seleccionar = (item: any) => { setSelected(item); setResults(null); setSearchQ(''); setError(''); };

  const puedeRegistrar = (): boolean => {
    if (!edificioId) return false;
    if (tipo === 'VISITANTE') return nombreManual.trim().length > 0;
    return selected !== null;
  };

  const registrarEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeRegistrar()) { showError('Complete los campos requeridos'); return; }
    setRegistrando(true); setError('');
    try {
      const fd = new FormData();
      fd.append('edificioId', edificioId); fd.append('tipoPersona', tipo);
      if (eventoCursoId) fd.append('eventoCursoId', eventoCursoId);
      if (selected) {
        fd.append('personaId', String(selected.carnet || selected.id));
        fd.append('nombrePersona', selected.nombre || selected.nombreCompleto || '');
        if (selected.cedula) fd.append('cedulaPersona', selected.cedula);
        if (selected.empresa || selected.empresaPersona) fd.append('empresaPersona', selected.empresa || selected.empresaPersona);
      } else {
        fd.append('personaId', 'manual');
        fd.append('nombrePersona', nombreManual);
        fd.append('cedulaPersona', cedulaManual);
        fd.append('empresaPersona', empresaManual);
      }
      if (foto) fd.append('foto', foto);
      if (!motivoAcceso) { showError('Seleccione un motivo de acceso'); setRegistrando(false); return; }
      fd.append('motivoAcceso', motivoAcceso);
      if (motivoDetalle) fd.append('motivoDetalle', motivoDetalle);
      await api.post('/acceso/entrada', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showSuccess('Acceso registrado');
      setSelected(null); setNombreManual(''); setCedulaManual(''); setEmpresaManual(''); setFoto(null);
      setEventoCursoId(''); setMotivo(null); setMotivoAcceso(''); setMotivoDetalle('');
      searchRef.current?.focus();
    } catch (err: any) { showError('Error', err?.response?.data?.message || 'No se pudo registrar el acceso'); }
    setRegistrando(false);
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-header__title"><DoorOpen /> Registro de Acceso</h1></div>
      {error && <div className="alert alert--error mb-3" role="alert">{error} <button className="btn btn--ghost btn--sm" onClick={() => setError('')}>✕</button></div>}
      <p className="page-header__subtitle" style={{ marginBottom: 'var(--space-4)' }}>
        Este sistema registra accesos físicos al edificio. No corresponde a marcación laboral.
      </p>
      <div className="registro-grid">
        <form onSubmit={registrarEntrada} className="card">
          <div className="card__header card__header--brand"><span className="card-title"><DoorOpen className="icon" /> Registrar Entrada al Edificio</span></div>
          <div className="card__body">
            <fieldset className="form-group" style={{ border: 'none', padding: 0 }}>
              <legend className="form-label">Tipo de persona</legend>
              <div className="tipo-grid">
                {TIPOS.map(t => (
                  <button key={t.value} type="button" role="radio" aria-checked={tipo === t.value}
                    className={`btn ${tipo === t.value ? 'btn--primary' : 'btn--secondary'} btn--sm`}
                    onClick={() => { setTipo(t.value); setSelected(null); setResults(null); setError(''); }}>{t.label}</button>
                ))}
              </div>
            </fieldset>
            {tipo !== 'VISITANTE' && (
              <div className="form-group">
                <label htmlFor="search-persona" className="form-label form-label--required">Buscar persona</label>
                <div className="form-row">
                  <input id="search-persona" type="text" className="form-control" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } }} placeholder="Buscar por nombre o carnet…" ref={searchRef} autoFocus />
                  <button type="button" onClick={buscar} className="btn btn--primary btn--sm" disabled={searchLoading}>
                    {searchLoading ? <Loader2 className="icon icon--sm icon--spin" /> : <Search className="icon icon--sm" />} Buscar
                  </button>
                </div>
                {results && results.length > 0 && (
                  <div className="search-results">
                    {results.map((r: any, i) => (
                      <button key={i} type="button" onClick={() => seleccionar(r)} className="search-result-item">
                        <div className="search-result-avatar">{r.nombre?.charAt(0) || '?'}</div>
                        <div className="flex--1">
                          <div className="font-bold text-sm">{r.nombre || r.nombreCompleto}</div>
                          <div className="text-xs text-muted">{r.carnet || r.cedula || ''}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searched && results?.length === 0 && (
                  <div className="alert alert--error" style={{ marginTop: 8, padding: '8px 12px', fontSize: 12 }}>
                    No encontramos coincidencias para &quot;{searchQ}&quot;. Verificá el nombre o carnet.
                  </div>
                )}
                {selected && (
                  <div className="selected-person">
                    <span>{selected.nombre || selected.nombreCompleto}</span>
                    <button type="button" onClick={() => setSelected(null)} className="btn btn--ghost btn--sm btn--icon" aria-label="Quitar selección"><X className="icon icon--sm" /></button>
                  </div>
                )}
                {!selected && <p className="form-hint">Seleccione una persona de la lista. Si no aparece, intente otra búsqueda.</p>}
              </div>
            )}
            {tipo === 'VISITANTE' && (
              <>
                <div className="form-group"><label htmlFor="vis-nombre" className="form-label form-label--required">Nombre completo</label><input id="vis-nombre" type="text" className="form-control" value={nombreManual} onChange={e => setNombreManual(e.target.value)} placeholder="Nombre del visitante" /></div>
                <div className="form-group"><label htmlFor="vis-cedula" className="form-label">Cédula</label><input id="vis-cedula" type="text" className="form-control" value={cedulaManual} onChange={e => setCedulaManual(e.target.value)} placeholder="Número de cédula" /></div>
                <div className="form-group"><label htmlFor="vis-empresa" className="form-label">Empresa / Motivo</label><input id="vis-empresa" type="text" className="form-control" value={empresaManual} onChange={e => setEmpresaManual(e.target.value)} placeholder="Empresa o motivo del acceso" /></div>
              </>
            )}
            <div className="form-group"><label htmlFor="edificio" className="form-label form-label--required">Edificio</label>
              {user?.rol === 'admin' ? (
                <select id="edificio" className="form-control" value={edificioId} onChange={e => { setEdificioId(e.target.value); setMotivo(null); setEventoCursoId(''); }}>
                  <option value="">Seleccione un edificio…</option>
                  {edificios.map(e => <option key={e.Id || e.id} value={e.Id || e.id}>{e.Nombre || e.nombre}</option>)}
                </select>
              ) : (
                <div className="selected-person" style={{ fontWeight: 600 }}>{edificioSel?.Nombre || edificioSel?.nombre || 'Cargando…'}</div>
              )}
            </div>

            {/* Motivo del acceso (solo para edificio de capacitación) */}
            {esCapacitacion && edificioId && (
              <div className="form-group">
                <label className="form-label">Motivo del acceso</label>
                <div className="tipo-grid" role="radiogroup">
                  <button type="button" role="radio" aria-checked={motivo === 'general'}
                    className={`btn ${motivo === 'general' ? 'btn--primary' : 'btn--secondary'} btn--sm`}
                    onClick={() => { setMotivo('general'); setEventoCursoId(''); }}>
                    Acceso general
                  </button>
                  <button type="button" role="radio" aria-checked={motivo === 'capacitacion'}
                    className={`btn ${motivo === 'capacitacion' ? 'btn--primary' : 'btn--secondary'} btn--sm`}
                    onClick={() => { setMotivo('capacitacion'); }}>
                    <GraduationCap className="icon icon--sm" /> Capacitación
                  </button>
                </div>
              </div>
            )}

            {/* Curso solo si motivo = capacitación */}
            {motivo === 'capacitacion' && (
              <div className="form-group"><label htmlFor="curso" className="form-label">Curso o evento de capacitación</label>
                <select id="curso" className="form-control" value={eventoCursoId} onChange={e => setEventoCursoId(e.target.value)} disabled={courseError}>
                  <option value="">{courseError ? 'Cursos no disponibles' : 'Seleccione un curso…'}</option>
                  {!courseError && eventos.map((ev: any) => <option key={ev.Id || ev.id} value={ev.Id || ev.id}>{ev.CursoNombre || ev.nombre} — {ev.EdificioNombre || ''}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="motivo-acceso" className="form-label form-label--required">Motivo del acceso</label>
              <div className="form-row">
                <select id="motivo-acceso" className="form-control" value={motivoAcceso} onChange={e => setMotivoAcceso(e.target.value)} style={{ maxWidth: '60%' }}>
                  <option value="">Seleccione un motivo…</option>
                  {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="text" className="form-control" value={motivoDetalle} onChange={e => setMotivoDetalle(e.target.value)} placeholder="Detalle (opcional)" style={{ maxWidth: '40%' }} />
              </div>
            </div>

            {photosEnabled && (
            <div className="form-group"><label className="form-label">Foto <span className="form-hint inline">(opcional)</span></label>
              <label className="foto-upload"><Camera className="icon text-muted" /><span className="text-muted text-sm">{foto ? foto.name : 'Subir foto'}</span><input type="file" accept="image/*" className="hidden" onChange={e => setFoto(e.target.files?.[0] || null)} /></label>
            </div>
            )}
            <button type="submit" disabled={!puedeRegistrar() || registrando} className="btn btn--primary btn--block btn--lg">
              {registrando ? <span className="spinner spinner--white" /> : <DoorOpen className="icon icon--sm" />}
              {registrando ? 'Registrando…' : 'Registrar Entrada al Edificio'}
            </button>
          </div>
        </form>
        <SalidaPanel
          edificioId={Number(edificioId) || Number(user?.edificioIdDefecto) || null}
        />
      </div>
    </div>
  );
}

function SalidaPanel({ edificioId: panelEdificioId }: { edificioId: number | null }) {
  const [hoy, setHoy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch] = useState('');
  const [exitingId, setExitingId] = useState<number | null>(null);
  const [showSalidaSinEntrada, setShowSalidaSinEntrada] = useState(false);
  const [ssForm, setSsForm] = useState({ personaId: '', nombrePersona: '', observacion: '' });

  const load = useCallback(async () => {
    setLoading(true); setApiError(false);
    try { const r = await api.get('/acceso/pendientes'); setHoy(r.data || []); } catch { setApiError(true); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const salida = async (r: any) => {
    const confirm = window.confirm(`¿Registrar salida de ${r.nombre}? (${r.edificio} - ${new Date(r.fechaEntrada).toLocaleTimeString()})`);
    if (!confirm) return;
    setExitingId(r.id);
    try { await api.post(`/acceso/salida/${r.id}`); showSuccess('Salida registrada', r.nombre); load(); }
    catch { showError('Error', 'No se pudo registrar la salida'); }
    setExitingId(null);
  };

  const filtrados = search ? hoy.filter(r => r.nombre.toLowerCase().includes(search.toLowerCase())) : hoy;

  return (
    <div className="card">
      <div className="card__header card__header--dark"><span className="card-title"><LogOut className="icon" /> Registrar Salida del Edificio</span></div>
      <div className="card__body">
        <div className="form-group"><label htmlFor="buscar-salida" className="form-label">Buscar persona dentro</label><input id="buscar-salida" type="text" className="form-control" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar persona dentro…" /></div>
        {apiError ? (
          <div className="alert alert--error" role="alert"><p>No pudimos consultar los accesos activos.</p><button onClick={load} className="btn btn--primary btn--sm mt-2">Reintentar</button></div>
        ) : loading ? (
          <div className="empty-state empty-state--compact"><div className="spinner mx-auto" /></div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state empty-state--compact">
            <LogOut className="icon--lg empty-state__icon" />
            <p className="empty-state__desc">{search ? 'Sin resultados para esa búsqueda' : 'No hay personas con salida pendiente'}</p>
          </div>
        ) : (
          <>
            <p className="empty-state__desc mb-3">{hoy.length} persona(s) sin salida registrada</p>
            <div className="salida-list">
              {filtrados.map(r => (
                <div key={r.id} className="salida-item">
                  <div className="flex--1">
                    <div className="font-bold text-sm">{r.nombre}</div>
                    <div className="form-hint">{r.edificio} · {r.tipoPersona} · {new Date(r.fechaEntrada).toLocaleTimeString()}</div>
                  </div>
                  <button onClick={() => salida(r)} disabled={exitingId === r.id} className="btn btn--dark btn--sm">
                    {exitingId === r.id ? '…' : <><LogOut className="icon icon--sm" /> Salida</>}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Salida independiente - siempre visible */}
        <div style={{ marginTop: 16, borderTop: '1px solid var(--gray-200)', paddingTop: 12 }}>
          <button onClick={() => setShowSalidaSinEntrada(v => !v)} className="btn btn--ghost btn--sm" style={{ marginBottom: 8 }}>
            {showSalidaSinEntrada ? '✕ Cancelar' : '➕ Persona salió sin registrar entrada'}
          </button>
          {showSalidaSinEntrada && (
            <div>
              {!panelEdificioId && (
                <div className="alert alert--warning" style={{ fontSize: 12, padding: '8px 12px', marginBottom: 8 }}>
                  Seleccione un edificio en el formulario de entrada antes de registrar salida.
                </div>
              )}
              <div className="form-group"><label htmlFor="ss-carnet" className="form-label form-label--required">Carnet / Código</label><input id="ss-carnet" type="text" className="form-control" value={ssForm.personaId} onChange={e => setSsForm({...ssForm, personaId: e.target.value})} placeholder="Carnet, cédula o código" /></div>
              <div className="form-group"><label htmlFor="ss-nombre" className="form-label form-label--required">Nombre</label><input id="ss-nombre" type="text" className="form-control" value={ssForm.nombrePersona} onChange={e => setSsForm({...ssForm, nombrePersona: e.target.value})} placeholder="Nombre completo" /></div>
              <div className="form-group"><label htmlFor="ss-obs" className="form-label form-label--required">Observación</label><input id="ss-obs" type="text" className="form-control" value={ssForm.observacion} onChange={e => setSsForm({...ssForm, observacion: e.target.value})} placeholder="Ej: Salió sin marcar entrada" /></div>
              <button onClick={async () => {
                if (!panelEdificioId) { showError('Seleccione el edificio'); return; }
                if (!ssForm.personaId || !ssForm.nombrePersona || !ssForm.observacion) { showError('Complete todos los campos'); return; }
                try {
                  await api.post('/acceso/salida-independiente', {
                    edificioId: panelEdificioId,
                    personaId: ssForm.personaId.trim(),
                    nombrePersona: ssForm.nombrePersona.trim(),
                    observacion: ssForm.observacion.trim(),
                  });
                  showSuccess('Salida registrada sin entrada previa');
                  setShowSalidaSinEntrada(false); setSsForm({ personaId: '', nombrePersona: '', observacion: '' }); load();
                } catch (err: any) { showError('Error', err?.response?.data?.message || 'Error'); }
              }} disabled={!panelEdificioId} className="btn btn--dark btn--sm" style={{ width: '100%', marginBottom: 12 }}>Registrar Salida sin Entrada</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
