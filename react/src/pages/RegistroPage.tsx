import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, DoorOpen, LogOut, Camera, Loader2 } from 'lucide-react';
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Left: Search and form */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ background: '#da121a', color: 'white', padding: '12px 16px', borderRadius: '12px 12px 0 0', fontWeight: 700, fontSize: 14 }}>
          <DoorOpen className="w-4 h-4" style={{ verticalAlign: 'middle', marginRight: 6 }} /> Registrar Entrada
        </div>
        <div style={{ padding: 16 }}>
          {/* Tipo */}
          <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Tipo de Persona</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {TIPOS.map(t => (
              <button key={t.value} onClick={() => { setTipo(t.value); setSelected(null); setResults(null); }}
                style={{ padding: '5px 10px', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: 11, cursor: 'pointer',
                  ...(tipo === t.value ? { background: '#da121a', color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }) }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          {tipo !== 'VISITANTE' && (
            <>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Buscar</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && buscar()}
                    placeholder="Buscar por nombre o carnet..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={buscar} disabled={loading}
                  style={{ background: '#da121a', color: 'white', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                </button>
              </div>

              {results && results.length > 0 && (
                <div style={{ marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
                  {results.map((r: any, i: number) => (
                    <button key={i} onClick={() => seleccionar(r)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: 12, marginBottom: 4 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.nombre || r.nombreCompleto}</div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>{r.carnet || r.cedula || ''} {r.empresa ? '· ' + r.empresa : ''}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Manual fields for VISITANTE */}
          {tipo === 'VISITANTE' && (
            <div style={{ marginBottom: 12 }}>
              <input type="text" value={nombreManual} onChange={e => setNombreManual(e.target.value)}
                placeholder="Nombre completo *" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, marginBottom: 6, boxSizing: 'border-box' }} />
              <input type="text" value={cedulaManual} onChange={e => setCedulaManual(e.target.value)}
                placeholder="Cédula" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, marginBottom: 6, boxSizing: 'border-box' }} />
              <input type="text" value={empresaManual} onChange={e => setEmpresaManual(e.target.value)}
                placeholder="Empresa / Motivo" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          )}

          {selected && (
            <div style={{ padding: 10, background: '#d1fae5', borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
              ✅ {selected.nombre || selected.nombreCompleto}
              <button onClick={() => setSelected(null)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
          )}

          {/* Edificio */}
          <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Edificio</label>
          <select value={edificioId} onChange={e => setEdificioId(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }}>
            <option value="">Seleccione...</option>
            {edificios.map(e => <option key={e.Id || e.id} value={e.Id || e.id}>{e.Nombre || e.nombre}</option>)}
          </select>

          {/* Evento Curso */}
          <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Curso / Capacitación (opcional)</label>
          <select value={eventoCursoId} onChange={e => setEventoCursoId(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }}>
            <option value="">Sin curso</option>
            {eventos.map((ev: any) => <option key={ev.Id || ev.id} value={ev.Id || ev.id}>{ev.CursoNombre || ev.nombre} - {ev.EdificioNombre || ''}</option>)}
          </select>

          {/* Foto optional */}
          <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Foto (opcional)</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 6, border: '1px dashed #d1d5db', cursor: 'pointer', fontSize: 12 }}>
              <Camera className="w-4 h-4" style={{ color: '#9ca3af' }} />
              <span style={{ color: '#6b7280' }}>{foto ? foto.name : 'Subir foto'}</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFoto(e.target.files?.[0] || null)} />
            </label>
          </div>

          <button onClick={registrarEntrada} disabled={registrando}
            style={{ width: '100%', padding: 10, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {registrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <DoorOpen className="w-4 h-4" />} Registrar Entrada
          </button>
        </div>
      </div>

      {/* Right: Quick salida */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ background: '#1e40af', color: 'white', padding: '12px 16px', borderRadius: '12px 12px 0 0', fontWeight: 700, fontSize: 14 }}>
          <LogOut className="w-4 h-4" style={{ verticalAlign: 'middle', marginRight: 6 }} /> Registrar Salida
        </div>
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
    try { const r = await api.get('/acceso/hoy'); setHoy(r.data?.filter((x: any) => !x.fechaSalida) || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const salida = async (id: number) => {
    try { await api.post(`/acceso/salida/${id}`); load(); } catch {}
  };

  const filtrados = search ? hoy.filter(r => r.nombre.toUpperCase().includes(search.toUpperCase())) : hoy;

  return (
    <div style={{ padding: 16 }}>
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Buscar persona dentro..." style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }} />
      {loading ? <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Cargando...</p> : (
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {filtrados.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.nombre}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{r.edificio} · {r.tipoPersona} · {new Date(r.fechaEntrada).toLocaleTimeString()}</div>
              </div>
              <button onClick={() => salida(r.id)}
                style={{ background: '#1e40af', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                <LogOut className="w-3 h-3" style={{ verticalAlign: 'middle', marginRight: 2 }} /> Salida
              </button>
            </div>
          ))}
          {filtrados.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>{search ? 'Sin resultados' : 'Nadie dentro del edificio'}</p>}
        </div>
      )}
    </div>
  );
}
