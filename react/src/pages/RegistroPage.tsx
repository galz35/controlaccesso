import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Search, DoorOpen, Loader2, GraduationCap, Building2, Check } from 'lucide-react';
import { showSuccess, showError } from '../lib/swal';

const TIPOS = [
  { value: 'EMPLEADO', label: 'Empleado', hint: 'Colaborador Claro con carnet' },
  { value: 'VISITANTE', label: 'Visitante', hint: 'Persona no registrada previamente' },
  { value: 'PROVEEDOR', label: 'Proveedor', hint: 'Persona asociada a una empresa proveedora' },
  { value: 'SERVICIO_EXTERNO', label: 'Personal externo', hint: 'PL, cocina, carga, conductor u otro servicio' },
  { value: 'INSTRUCTOR_INTERNO', label: 'Facilitador interno', hint: 'Persona que imparte una capacitación' },
  { value: 'INSTRUCTOR_EXTERNO', label: 'Facilitador externo', hint: 'Persona que imparte una capacitación' },
];

const MOTIVOS_POR_TIPO: Record<string, { label: string; value: string }[]> = {
  EMPLEADO: [
    { label: 'Comedor', value: 'Comedor' },
    { label: 'Entrega', value: 'Entrega' },
    { label: 'Reunión', value: 'Reunión' },
    { label: 'Mantenimiento', value: 'Mantenimiento' },
    { label: 'Otro', value: 'Otro' },
  ],
  PROVEEDOR: [
    { label: 'Entrega', value: 'Entrega' },
    { label: 'Reunión', value: 'Reunión' },
    { label: 'Mantenimiento', value: 'Mantenimiento' },
    { label: 'Carga/descarga', value: 'Carga y descarga' },
    { label: 'Otro', value: 'Otro' },
  ],
  SERVICIO_EXTERNO: [
    { label: 'Comedor', value: 'Comedor' },
    { label: 'Servicio de cocina', value: 'Servicio de cocina' },
    { label: 'Carga/descarga', value: 'Carga y descarga' },
    { label: 'Transporte', value: 'Conductor/transporte' },
    { label: 'Mantenimiento', value: 'Mantenimiento' },
    { label: 'Otro', value: 'Otro' },
  ],
  VISITANTE: [
    { label: 'Reunión', value: 'Reunión' },
    { label: 'Visita general', value: 'Visita general' },
    { label: 'Comedor', value: 'Comedor' },
    { label: 'Otro', value: 'Otro' },
  ],
};

const MOTIVOS_GENERAL = [
  { label: 'Comedor', value: 'Comedor' },
  { label: 'Servicio de cocina', value: 'Servicio de cocina' },
  { label: 'Carga/descarga', value: 'Carga y descarga' },
  { label: 'Transporte', value: 'Conductor/transporte' },
  { label: 'Entrega', value: 'Entrega' },
  { label: 'Mantenimiento', value: 'Mantenimiento' },
  { label: 'Reunión', value: 'Reunión' },
  { label: 'Visita general', value: 'Visita general' },
  { label: 'Capacitación', value: 'Capacitación' },
  { label: 'Otro', value: 'Otro' },
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
  const [esCapacitacion, setEsCapacitacion] = useState(false);
  const [vieneCapacitacion, setVieneCapacitacion] = useState<'si' | 'no' | null>(null);
  const [eventoCursoId, setEventoCursoId] = useState('');
  const [motivoAcceso, setMotivoAcceso] = useState('');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [nombreManual, setNombreManual] = useState('');
  const [cedulaManual, setCedulaManual] = useState('');
  const [empresaManual, setEmpresaManual] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const searchRef = useRef<HTMLInputElement>(null);

  const edificioSel = edificios.find(e => (e.Id || e.id) === parseInt(edificioId));

  useEffect(() => {
    api.get('/edificios').then(r => {
      const all = r.data || [];
      const allowed = user?.rol === 'admin' ? all : all.filter((item: any) =>
        Number(item.Id || item.id) === Number(user?.edificioIdDefecto));
      setEdificios(allowed);
      if (user?.rol !== 'admin' && user?.edificioIdDefecto) {
        setEdificioId(String(user.edificioIdDefecto));
      } else if (user?.rol === 'admin' && allowed.length > 0) {
        // Auto-seleccionar edificio por defecto: preferir ENITEL LA PIEDRA, sino el primero
        const piedrecita = allowed.find((e: any) => {
          const nombre = (e.Nombre || e.nombre || '').toUpperCase();
          return nombre.includes('ENITEL') && nombre.includes('PIEDRA');
        });
        const defaultEdificio = piedrecita || allowed[0];
        if (defaultEdificio) {
          const id = String(defaultEdificio.Id || defaultEdificio.id);
          setEdificioId(id);
          if (defaultEdificio.EsCapacitacion || defaultEdificio.esCapacitacion) {
            setVieneCapacitacion('no');
          }
        }
      }
    }).catch(() => setError('No se pudieron cargar los edificios'));
  }, [user]);

  const isTraining = edificioSel?.EsCapacitacion || edificioSel?.esCapacitacion;

  useEffect(() => {
    setEsCapacitacion(!!isTraining);
    setVieneCapacitacion(null);
    setEventoCursoId('');
    if (isTraining && Number(edificioId)) {
      api.get(`/eventos-curso?edificioId=${edificioId}`).then(r => {
        setEventos(r.data || []);
        if (r.data?.length === 1) setEventoCursoId(String(r.data[0].Id || r.data[0].id));
      }).catch(() => setCourseError(true));
    } else {
      setEventos([]);
    }
  }, [edificioId, isTraining]);

  // Auto-buscar curso cuando se selecciona persona en edificio capacitación
  useEffect(() => {
    if (!isTraining || !selected || !edificioId) return;
    const pTipo = selected.carnet ? 'EMPLEADO' : (selected.tipo || tipo);
    const pid = selected.carnet || selected.id;
    if (pTipo && pid) {
      api.get('/curso-participantes', { params: { tipoPersona: pTipo, personaId: String(pid) } })
        .then(r => { if (r.data && r.data.length > 0) { setVieneCapacitacion('si'); setEventoCursoId(String(r.data[0].EventoCursoId)); } })
        .catch(() => {});
    }
  }, [edificioId, selected, isTraining]);

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

  const seleccionar = (item: any) => {
    setSelected(item); setResults(null); setSearchQ(''); setError(''); setStep(2);
  };

  const puedeRegistrar = (): boolean => {
    if (!edificioId) return false;
    if (tipo === 'VISITANTE') return nombreManual.trim().length > 0;
    return selected !== null;
  };

  const registrarEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeRegistrar()) { showError('Complete los campos requeridos'); return; }
    if (!motivoAcceso) { showError('Seleccione un motivo de acceso'); return; }
    if (motivoAcceso === 'Otro' && !motivoDetalle.trim()) { showError('Debe describir el motivo al seleccionar "Otro".'); return; }
    if (isTraining && vieneCapacitacion === 'si' && !eventoCursoId) { showError('Seleccione el curso o evento de capacitación'); return; }
    setRegistrando(true);
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
      fd.append('motivoAcceso', motivoAcceso);
      if (motivoDetalle) fd.append('motivoDetalle', motivoDetalle);
      await api.post('/acceso/entrada', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showSuccess(`Entrada registrada\n${selected?.nombre || nombreManual}\n${new Date().toLocaleTimeString()} · ${motivoAcceso}`);
      setSelected(null); setNombreManual(''); setCedulaManual(''); setEmpresaManual('');
      setVieneCapacitacion(null); setEventoCursoId(''); setMotivoAcceso(''); setMotivoDetalle(''); setStep(1);
      searchRef.current?.focus();
    } catch (err: any) { showError('Error', err?.response?.data?.message || 'No se pudo registrar el acceso'); }
    setRegistrando(false);
  };

  const motivosDisponibles = MOTIVOS_POR_TIPO[tipo] || MOTIVOS_GENERAL;
  if (esCapacitacion && !motivosDisponibles.find(m => m.value === 'Capacitación')) {
    motivosDisponibles.push({ label: 'Capacitación', value: 'Capacitación' });
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title"><DoorOpen /> Registrar Acceso</h1>
      </div>

      {error && <div className="alert alert--error mb-3" role="alert">{error} <button className="btn btn--ghost btn--sm" onClick={() => setError('')}>✕</button></div>}

      {/* Barra edificio */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
        background: 'var(--white)', borderBottom: '2px solid var(--brand-red)',
        marginBottom: 16, borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
      }}>
        <Building2 className="icon icon--sm" style={{ color: 'var(--brand-red)' }} />
        {user?.rol === 'admin' ? (
          <select className="form-control" value={edificioId}
            onChange={e => { setEdificioId(e.target.value); setSelected(null); setStep(1); }}
            style={{ maxWidth: 500, flex: 1, fontSize: 14, padding: '6px 8px' }}>
            <option value="">Seleccione un edificio…</option>
            {edificios.map(e => <option key={e.Id || e.id} value={e.Id || e.id}>{e.Nombre || e.nombre}</option>)}
          </select>
        ) : (
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--brand-red)' }}>
            {edificioSel?.Nombre || edificioSel?.nombre || 'Cargando…'}
          </span>
        )}
        {esCapacitacion && <span className="badge badge--neutral" style={{ marginLeft: 'auto', fontSize: 11 }}><GraduationCap className="icon icon--sm" /> Capacitación</span>}
      </div>

      <form onSubmit={registrarEntrada} className="card">
        <div className="card__body">
          {/* Paso 1: ¿Quién entra? */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="badge badge--neutral" style={{ borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: step >= 1 ? 'var(--brand-red)' : 'var(--gray-300)', color: '#fff' }}>1</span>
              <strong style={{ fontSize: 16 }}>¿Quién entra?</strong>
              {selected && <span style={{ marginLeft: 'auto', color: 'var(--success)', fontSize: 13 }}><Check className="icon icon--sm" /> Listo</span>}
            </div>

            {!selected && (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {TIPOS.slice(0, 4).map(t => (
                    <button key={t.value} type="button"
                      className={`btn ${tipo === t.value ? 'btn--primary' : 'btn--secondary'} btn--sm`}
                      onClick={() => { setTipo(t.value); setSelected(null); setResults(null); }}>
                      {t.label}
                    </button>
                  ))}
                  <button type="button" className="btn btn--ghost btn--sm" style={{ fontSize: 12, color: 'var(--gray-500)' }}
                    onClick={() => { const m = document.getElementById('mas-opciones'); if (m) m.style.display = m.style.display === 'none' ? 'flex' : 'none'; }}>
                    Más opciones ▾
                  </button>
                </div>
                <div id="mas-opciones" style={{ display: 'none', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {TIPOS.slice(4).map(t => (
                    <button key={t.value} type="button"
                      className={`btn ${tipo === t.value ? 'btn--primary' : 'btn--secondary'} btn--sm`}
                      onClick={() => { setTipo(t.value); setSelected(null); setResults(null); }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted" style={{ marginBottom: 12 }}>{TIPOS.find(t => t.value === tipo)?.hint}</p>
              </>
            )}

            {tipo !== 'VISITANTE' && !selected && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div className="form-row">
                  <input id="search-persona" type="text" className="form-control" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } }}
                    placeholder="Escanee o escriba el código del carnet" ref={searchRef} autoFocus />
                  <button type="button" onClick={buscar} className="btn btn--primary btn--sm" disabled={searchLoading}>
                    {searchLoading ? <Loader2 className="icon icon--sm icon--spin" /> : <Search className="icon icon--sm" />} Buscar
                  </button>
                </div>
                <p className="form-hint" style={{ marginTop: 4 }}>También puede buscar por nombre.</p>
              </div>
            )}

            {results && results.length > 0 && (
              <div className="search-results" style={{ marginTop: 8 }}>
                {results.map((r: any, i) => (
                  <button key={i} type="button" onClick={() => seleccionar(r)} className="search-result-item">
                    <div className="flex--1">
                      <div className="font-bold">{r.nombre || r.nombreCompleto}</div>
                      <div className="text-xs text-muted">Carnet {r.carnet || r.cedula || ''} · {TIPOS.find(t => t.value === tipo)?.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searched && results?.length === 0 && (
              <div className="alert alert--error" style={{ marginTop: 8, padding: '8px 12px', fontSize: 13 }}>
                No encontramos a la persona. Revise el código o busque por nombre.
              </div>
            )}

            {tipo === 'VISITANTE' && !selected && (
              <div style={{ marginTop: 8 }}>
                <div className="form-group"><label htmlFor="vis-nombre" className="form-label form-label--required">Nombre completo</label>
                  <input id="vis-nombre" type="text" className="form-control" value={nombreManual} onChange={e => setNombreManual(e.target.value)} placeholder="Nombre del visitante" /></div>
                <div className="form-group"><label htmlFor="vis-cedula" className="form-label">Cédula o identificación</label>
                  <input id="vis-cedula" type="text" className="form-control" value={cedulaManual} onChange={e => setCedulaManual(e.target.value)} placeholder="Número de cédula" /></div>
                <div className="form-group"><label htmlFor="vis-empresa" className="form-label">Empresa o procedencia</label>
                  <input id="vis-empresa" type="text" className="form-control" value={empresaManual} onChange={e => setEmpresaManual(e.target.value)} placeholder="Empresa" /></div>
                <button type="button" onClick={() => { if (nombreManual.trim()) { setStep(2); } else { showError('Ingrese el nombre del visitante'); } }}
                  className="btn btn--primary btn--sm">Continuar</button>
              </div>
            )}

            {selected && (
              <div className="selected-person" style={{ justifyContent: 'space-between', padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div className="font-bold">{selected.nombre || selected.nombreCompleto}</div>
                  <div className="text-sm text-muted">{selected.carnet || selected.cedula || ''} · {TIPOS.find(t => t.value === tipo)?.label}</div>
                </div>
                <button type="button" onClick={() => { setSelected(null); setStep(1); }} className="btn btn--ghost btn--sm">Cambiar</button>
              </div>
            )}
          </div>

          {/* Paso 2: ¿Por qué entra? */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="badge badge--neutral" style={{ borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: step >= 2 ? 'var(--brand-red)' : 'var(--gray-300)', color: '#fff' }}>2</span>
              <strong style={{ fontSize: 16 }}>¿Por qué entra?</strong>
              {motivoAcceso && <span style={{ marginLeft: 'auto', color: 'var(--success)', fontSize: 13 }}><Check className="icon icon--sm" /> {motivoAcceso}</span>}
            </div>

            {step >= 1 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {motivosDisponibles.filter(m => m.value !== 'Capacitación').map(m => (
                  <button key={m.value} type="button"
                    className={`btn ${motivoAcceso === m.value ? 'btn--primary' : 'btn--secondary'} btn--sm`}
                    onClick={() => { setMotivoAcceso(m.value); setMotivoDetalle(''); setStep(3); }}>
                    {m.label}
                  </button>
                ))}
                {esCapacitacion && (
                  <button type="button"
                    className={`btn ${motivoAcceso === 'Capacitación' ? 'btn--primary' : 'btn--secondary'} btn--sm`}
                    onClick={() => { setMotivoAcceso('Capacitación'); setVieneCapacitacion('no'); setStep(3); }}>
                    <GraduationCap className="icon icon--sm" /> Capacitación
                  </button>
                )}
              </div>
            )}

            {motivoAcceso && motivoAcceso !== 'Capacitación' && (
              <div>
                <input type="text" className="form-control" style={{ marginTop: 8, maxWidth: 300 }}
                  value={motivoDetalle} onChange={e => setMotivoDetalle(e.target.value)}
                  placeholder={motivoAcceso === 'Otro' ? 'Describa el motivo (requerido)' : 'Detalle adicional (opcional)'} />
                {motivoAcceso === 'Otro' && !motivoDetalle && (
                  <p className="form-hint" style={{ color: 'var(--error)', marginTop: 4, fontSize: 12 }}>
                    Debe describir el motivo al seleccionar "Otro".
                  </p>
                )}
              </div>
            )}

            {motivoAcceso === 'Capacitación' && esCapacitacion && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>¿Esta entrada es por una capacitación?</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button type="button" className={`btn ${vieneCapacitacion === 'no' ? 'btn--dark' : 'btn--secondary'} btn--sm`}
                    onClick={() => { setVieneCapacitacion('no'); setEventoCursoId(''); }}>No</button>
                  <button type="button" className={`btn ${vieneCapacitacion === 'si' ? 'btn--primary' : 'btn--secondary'} btn--sm`}
                    onClick={() => { setVieneCapacitacion('si'); }}><GraduationCap className="icon icon--sm" /> Sí</button>
                </div>
                {vieneCapacitacion === 'si' && (
                  <select className="form-control" value={eventoCursoId} onChange={e => setEventoCursoId(e.target.value)} disabled={courseError}>
                    <option value="">{courseError ? 'Cursos no disponibles' : 'Seleccione un curso…'}</option>
                    {!courseError && eventos.map((ev: any) => (
                      <option key={ev.Id || ev.id} value={ev.Id || ev.id}>
                        {ev.CursoNombre || ev.nombre} — {new Date(ev.FechaInicio).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Paso 3: Confirmar */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="badge badge--neutral" style={{ borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: step >= 3 ? 'var(--brand-red)' : 'var(--gray-300)', color: '#fff' }}>3</span>
              <strong style={{ fontSize: 16 }}>Confirmar entrada</strong>
            </div>

            {step >= 2 && (selected || tipo === 'VISITANTE') && motivoAcceso && (
              <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', marginBottom: 12, fontSize: 14 }}>
                <div><strong>Persona:</strong> {selected?.nombre || nombreManual} · {selected?.carnet || selected?.cedula || cedulaManual || '—'}</div>
                <div><strong>Edificio:</strong> {edificioSel?.Nombre || edificioSel?.nombre || '—'}</div>
                <div><strong>Motivo:</strong> {motivoAcceso}{motivoDetalle ? ` · ${motivoDetalle}` : ''}</div>
                {vieneCapacitacion === 'si' && eventoCursoId && (
                  <div><strong>Capacitación:</strong> {eventos.find((ev: any) => String(ev.Id || ev.id) === eventoCursoId)?.CursoNombre || 'Seleccionado'}</div>
                )}
              </div>
            )}

            <button type="submit" disabled={!puedeRegistrar() || !motivoAcceso || registrando}
              className="btn btn--primary btn--block btn--lg" style={{ justifyContent: 'center' }}>
              {registrando ? <span className="spinner spinner--white" /> : <DoorOpen className="icon icon--sm" />}
              {registrando ? 'Registrando…' : 'Registrar entrada'}
            </button>
            {(!puedeRegistrar() || !motivoAcceso) && (
              <p className="form-hint" style={{ textAlign: 'center', marginTop: 8, color: 'var(--error)' }}>
                {!selected && tipo !== 'VISITANTE' ? 'Falta seleccionar una persona' :
                 tipo === 'VISITANTE' && !nombreManual ? 'Falta ingresar el nombre del visitante' :
                 !motivoAcceso ? 'Falta seleccionar el motivo' : ''}
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
