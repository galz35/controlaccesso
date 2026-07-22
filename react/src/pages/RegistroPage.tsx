import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, DoorOpen, LogOut, Camera, X, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

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
  const [tipo, setTipo] = useState('EMPLEADO');
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [edificioId, setEdificioId] = useState('');
  const [eventoCursoId, setEventoCursoId] = useState('');
  const [nombreManual, setNombreManual] = useState('');
  const [cedulaManual, setCedulaManual] = useState('');
  const [empresaManual, setEmpresaManual] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);

  useEffect(() => {
    api.get('/edificios').then(r => setEdificios(r.data || [])).catch(() => {});
    api.get('/eventos-curso').then(r => setEventos(r.data || [])).catch(() => {});
  }, []);

  const buscar = async () => {
    if (!searchQ.trim()) return;
    setLoading(true);
    setResults(null);
    setSelected(null);
    try {
      let endpoint = '/search/empleado';
      if (tipo === 'PROVEEDOR') endpoint = '/search/proveedor';
      else if (tipo === 'INSTRUCTOR_EXTERNO') endpoint = '/search/instructor';
      else if (tipo === 'INSTRUCTOR_INTERNO') endpoint = '/search/empleado';
      const res = await api.get(endpoint, { params: { q: searchQ } });
      setResults(res.data || []);
    } catch {}
    setLoading(false);
  };

  const seleccionar = (item: any) => {
    setSelected(item);
    setResults(null);
    setSearchQ('');
  };

  const registrarEntrada = async () => {
    if (!edificioId) { Swal.fire({ icon: 'error', title: 'Edificio requerido', text: 'Seleccione un edificio' }); return; }
    setRegistrando(true);
    try {
      const fd = new FormData();
      fd.append('edificioId', edificioId);
      fd.append('tipoPersona', tipo);
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
      Swal.fire({ icon: 'success', title: 'Entrada registrada', timer: 2000, showConfirmButton: false });
      setSelected(null);
      setNombreManual('');
      setCedulaManual('');
      setEmpresaManual('');
      setFoto(null);
      setEventoCursoId('');
    } catch (err: any) { Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Error' }); }
    setRegistrando(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Registro de Acceso</h1>
      </div>

      <div className="registro-grid">
        {/* Left: Entry */}
        <div className="card">
          <div className="card__header card__header--brand">
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              <DoorOpen className="icon" style={{ verticalAlign: 'middle', marginRight: 6 }} /> Registrar Entrada
            </span>
          </div>
          <div className="card__body">
            {/* Tipo */}
            <div className="form-group">
              <label className="form-label">Tipo de persona</label>
              <div className="tipo-grid">
                {TIPOS.map(t => (
                  <button key={t.value}
                    type="button"
                    className={`btn ${tipo === t.value ? 'btn--primary' : 'btn--secondary'} btn--sm`}
                    onClick={() => { setTipo(t.value); setSelected(null); setResults(null); }}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            {tipo !== 'VISITANTE' && (
              <div className="form-group">
                <label className="form-label">Buscar persona</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      className="form-control"
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && buscar()}
                      placeholder="Buscar por nombre o carnet…"
                    />
                  </div>
                  <button onClick={buscar} className="btn btn--primary btn--sm" disabled={loading}>
                    {loading ? <Loader2 className="icon icon--sm spinner" /> : <Search className="icon icon--sm" />}
                    Buscar
                  </button>
                </div>

                {results && results.length > 0 && (
                  <div className="search-results">
                    {results.map((r: any, i) => (
                      <button key={i} onClick={() => seleccionar(r)} className="search-result-item">
                        <div className="search-result-avatar">{r.nombre?.charAt(0) || '?'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.nombre || r.nombreCompleto}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{r.carnet || r.cedula || ''}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selected && (
                  <div className="selected-person">
                    <span>{selected.nombre || selected.nombreCompleto}</span>
                    <button onClick={() => setSelected(null)} className="btn btn--ghost btn--sm" aria-label="Quitar selección">
                      <X className="icon icon--sm" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Visitante manual */}
            {tipo === 'VISITANTE' && (
              <>
                <div className="form-group">
                  <label htmlFor="vis-nombre" className="form-label form-label--required">Nombre completo</label>
                  <input id="vis-nombre" type="text" className="form-control" value={nombreManual} onChange={e => setNombreManual(e.target.value)} placeholder="Nombre del visitante" />
                </div>
                <div className="form-group">
                  <label htmlFor="vis-cedula" className="form-label">Cédula</label>
                  <input id="vis-cedula" type="text" className="form-control" value={cedulaManual} onChange={e => setCedulaManual(e.target.value)} placeholder="Número de cédula" />
                </div>
                <div className="form-group">
                  <label htmlFor="vis-empresa" className="form-label">Empresa / Motivo</label>
                  <input id="vis-empresa" type="text" className="form-control" value={empresaManual} onChange={e => setEmpresaManual(e.target.value)} placeholder="Empresa o motivo de visita" />
                </div>
              </>
            )}

            {/* Edificio */}
            <div className="form-group">
              <label htmlFor="edificio" className="form-label form-label--required">Edificio</label>
              <select id="edificio" className="form-control" value={edificioId} onChange={e => setEdificioId(e.target.value)}>
                <option value="">Seleccione un edificio…</option>
                {edificios.map(e => <option key={e.Id || e.id} value={e.Id || e.id}>{e.Nombre || e.nombre}</option>)}
              </select>
            </div>

            {/* Curso opcional */}
            <div className="form-group">
              <label htmlFor="curso" className="form-label">Curso / Capacitación <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(opcional)</span></label>
              <select id="curso" className="form-control" value={eventoCursoId} onChange={e => setEventoCursoId(e.target.value)}>
                <option value="">Sin curso</option>
                {eventos.map((ev: any) => (
                  <option key={ev.Id || ev.id} value={ev.Id || ev.id}>
                    {ev.CursoNombre || ev.nombre} — {ev.EdificioNombre || ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Foto */}
            <div className="form-group">
              <label className="form-label">Foto <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(opcional)</span></label>
              <label className="foto-upload">
                <Camera className="icon" style={{ color: 'var(--gray-400)' }} />
                <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>{foto ? foto.name : 'Subir foto'}</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFoto(e.target.files?.[0] || null)} />
              </label>
            </div>

            <button
              onClick={registrarEntrada}
              disabled={registrando}
              className="btn btn--primary"
              style={{ width: '100%', padding: '12px' }}
            >
              {registrando ? <span className="spinner spinner--white" /> : <DoorOpen className="icon icon--sm" />}
              {registrando ? 'Registrando…' : 'Registrar Entrada'}
            </button>
          </div>
        </div>

        {/* Right: Exit */}
        <SalidaPanel />
      </div>
    </div>
  );
}

function SalidaPanel() {
  const [hoy, setHoy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/acceso/hoy');
      setHoy(r.data?.filter((x: any) => !x.fechaSalida) || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const salida = async (id: number) => {
    try { await api.post(`/acceso/salida/${id}`); load(); } catch {}
  };

  const filtrados = search ? hoy.filter(r => r.nombre.toLowerCase().includes(search.toLowerCase())) : hoy;

  return (
    <div className="card">
      <div className="card__header card__header--dark">
        <span style={{ fontWeight: 700, fontSize: 15 }}>
          <LogOut className="icon" style={{ verticalAlign: 'middle', marginRight: 6 }} /> Registrar Salida
        </span>
      </div>
      <div className="card__body">
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar persona dentro…"
          />
        </div>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
          {hoy.length} persona(s) dentro del edificio
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <LogOut className="icon--lg" style={{ color: 'var(--gray-300)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{search ? 'Sin resultados' : 'No hay personas pendientes de salida'}</p>
          </div>
        ) : (
          <div className="salida-list">
            {filtrados.map(r => (
              <div key={r.id} className="salida-item">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{r.edificio} · {r.tipoPersona} · {new Date(r.fechaEntrada).toLocaleTimeString()}</div>
                </div>
                <button onClick={() => salida(r.id)} className="btn btn--dark btn--sm">
                  <LogOut className="icon icon--sm" style={{ marginRight: 4 }} /> Salida
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
