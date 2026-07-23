import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Search, DoorOpen, LogOut, Camera, X, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '../lib/swal';

const TIPOS = [
  { value: 'EMPLEADO', label: 'Colaborador' },
  { value: 'PROVEEDOR', label: 'Proveedor' },
  { value: 'INSTRUCTOR_EXTERNO', label: 'Facilitador Externo' },
  { value: 'INSTRUCTOR_INTERNO', label: 'Facilitador Interno' },
  { value: 'VISITANTE', label: 'Visitante' },
];

export default function RegistroPage() {
  const [edificios, setEdificios] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [courseError, setCourseError] = useState(false);
  const [tipo, setTipo] = useState('EMPLEADO');
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [edificioId, setEdificioId] = useState('');
  const [eventoCursoId, setEventoCursoId] = useState('');
  const [nombreManual, setNombreManual] = useState('');
  const [cedulaManual, setCedulaManual] = useState('');
  const [empresaManual, setEmpresaManual] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/edificios').then(r => setEdificios(r.data || [])).catch(() => setError('No se pudieron cargar los edificios'));
    api.get('/eventos-curso').then(r => setEventos(r.data || [])).catch(() => setCourseError(true));
  }, []);

  const buscar = async () => {
    if (!searchQ.trim()) return;
    setSearchLoading(true); setResults(null); setSelected(null); setSearched(true);
    try {
      let endpoint = '/search/empleado';
      if (tipo === 'PROVEEDOR') endpoint = '/search/proveedor';
      else if (tipo === 'INSTRUCTOR_EXTERNO') endpoint = '/search/instructor';
      else if (tipo === 'INSTRUCTOR_INTERNO') endpoint = '/search/empleado';
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
      } else {
        fd.append('personaId', 'manual');
        fd.append('nombrePersona', nombreManual);
        fd.append('cedulaPersona', cedulaManual);
        fd.append('empresaPersona', empresaManual);
      }
      if (foto) fd.append('foto', foto);
      await api.post('/acceso/entrada', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showSuccess('Entrada registrada');
      setSelected(null); setNombreManual(''); setCedulaManual(''); setEmpresaManual(''); setFoto(null); setEventoCursoId('');
    } catch (err: any) { showError('Error', err?.response?.data?.message || 'No se pudo registrar la entrada'); }
    setRegistrando(false);
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-header__title"><DoorOpen /> Registro de Acceso</h1></div>
      {error && <div className="alert alert--error mb-3" role="alert">{error} <button className="btn btn--ghost btn--sm" onClick={() => setError('')}>✕</button></div>}
      <div className="registro-grid">
        <form onSubmit={registrarEntrada} className="card">
          <div className="card__header card__header--brand"><span className="card-title"><DoorOpen className="icon" /> Registrar Entrada</span></div>
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
                    onKeyDown={e => e.key === 'Enter' && buscar()} placeholder="Buscar por nombre o carnet…" />
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
                    No encontramos coincidencias para "{searchQ}". Verificá el nombre o carnet.
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
                <div className="form-group"><label htmlFor="vis-empresa" className="form-label">Empresa / Motivo</label><input id="vis-empresa" type="text" className="form-control" value={empresaManual} onChange={e => setEmpresaManual(e.target.value)} placeholder="Empresa o motivo" /></div>
              </>
            )}
            <div className="form-group"><label htmlFor="edificio" className="form-label form-label--required">Edificio</label>
              <select id="edificio" className="form-control" value={edificioId} onChange={e => setEdificioId(e.target.value)}>
                <option value="">Seleccione un edificio…</option>
                {edificios.map(e => <option key={e.Id || e.id} value={e.Id || e.id}>{e.Nombre || e.nombre}</option>)}
              </select>
            </div>
            <div className="form-group"><label htmlFor="curso" className="form-label">Curso <span className="form-hint inline">(opcional)</span></label>
              <select id="curso" className="form-control" value={eventoCursoId} onChange={e => setEventoCursoId(e.target.value)} disabled={courseError}>
                <option value="">{courseError ? 'Cursos no disponibles, puede registrar sin curso' : 'Sin curso'}</option>
                {!courseError && eventos.map((ev: any) => <option key={ev.Id || ev.id} value={ev.Id || ev.id}>{ev.CursoNombre || ev.nombre} — {ev.EdificioNombre || ''}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Foto <span className="form-hint inline">(opcional)</span></label>
              <label className="foto-upload"><Camera className="icon text-muted" /><span className="text-muted text-sm">{foto ? foto.name : 'Subir foto'}</span><input type="file" accept="image/*" className="hidden" onChange={e => setFoto(e.target.files?.[0] || null)} /></label>
            </div>
            <button type="submit" disabled={!puedeRegistrar() || registrando} className="btn btn--primary btn--block btn--lg">
              {registrando ? <span className="spinner spinner--white" /> : <DoorOpen className="icon icon--sm" />}
              {registrando ? 'Registrando…' : 'Registrar Entrada'}
            </button>
          </div>
        </form>
        <SalidaPanel />
      </div>
    </div>
  );
}

function SalidaPanel() {
  const [hoy, setHoy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch] = useState('');
  const [exitingId, setExitingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setApiError(false);
    try { const r = await api.get('/acceso/hoy'); setHoy(r.data?.filter((x: any) => !x.fechaSalida) || []); } catch { setApiError(true); }
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
      <div className="card__header card__header--dark"><span className="card-title"><LogOut className="icon" /> Registrar Salida</span></div>
      <div className="card__body">
        <div className="form-group"><label htmlFor="buscar-salida" className="form-label">Buscar persona dentro</label><input id="buscar-salida" type="text" className="form-control" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar persona dentro…" /></div>
        {apiError ? (
          <div className="alert alert--error" role="alert">
            <p>No pudimos consultar los accesos activos.</p>
            <button onClick={load} className="btn btn--primary btn--sm mt-2">Reintentar</button>
          </div>
        ) : loading ? (
          <div className="empty-state empty-state--compact"><div className="spinner mx-auto" /></div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state empty-state--compact">
            <LogOut className="icon--lg empty-state__icon" />
            <p className="empty-state__desc">{search ? 'Sin resultados para esa búsqueda' : 'No hay personas pendientes de salida'}</p>
          </div>
        ) : (
          <>
            <p className="empty-state__desc mb-3">{hoy.length} persona(s) dentro del edificio</p>
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
      </div>
    </div>
  );
}
