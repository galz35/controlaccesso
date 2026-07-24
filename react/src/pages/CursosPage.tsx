import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, Plus, Save, Search, Users, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import { showSuccess, showError } from '../lib/swal';

const TYPE_LABELS: Record<string, string> = {
  EMPLEADO: 'Colaborador', PROVEEDOR: 'Proveedor',
  INSTRUCTOR_EXTERNO: 'Facilitador externo', INSTRUCTOR_INTERNO: 'Facilitador interno',
  VISITANTE: 'Visitante', SERVICIO_EXTERNO: 'Personal externo',
};

export default function CursosPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', duracionHoras: '' });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [loadingPart, setLoadingPart] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/cursos'); setCursos(r.data || []); } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ codigo: '', nombre: '', descripcion: '', duracionHoras: '' }); setEditId(null); setShowForm(true); };

  const openEdit = (c: any) => { setForm({ codigo: c.Codigo || c.codigo || '', nombre: c.Nombre || c.nombre || '', descripcion: c.Descripcion || c.descripcion || '', duracionHoras: String(c.DuracionHoras || c.duracionHoras || '') }); setEditId(c.Id || c.id); setShowForm(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { nombre: form.nombre };
      if (form.codigo) payload.codigo = form.codigo;
      if (form.descripcion) payload.descripcion = form.descripcion;
      if (form.duracionHoras) payload.duracionHoras = parseInt(form.duracionHoras);
      if (editId) await api.put(`/cursos/${editId}`, payload);
      else await api.post('/cursos', payload);
      showSuccess('Curso guardado');
      setShowForm(false); load();
    } catch (err: any) { showError('Error', err?.response?.data?.message || 'Error al guardar'); }
  };

  const toggleExpand = async (cursoId: number) => {
    if (expanded === cursoId) { setExpanded(null); return; }
    setExpanded(cursoId); setLoadingPart(true);
    try {
      const r = await api.get(`/curso-participantes/por-curso/${cursoId}`);
      setParticipantes(r.data || []);
    } catch { setParticipantes([]); }
    setLoadingPart(false);
  };

  const exportCSV = () => {
    if (participantes.length === 0) { showError('No hay participantes para exportar'); return; }
    const cursoActual = cursos.find(c => (c.Id || c.id) === expanded);
    const headers = ['Tipo', 'Cédula', 'Nombre', 'Empresa', 'Curso', 'Edificio', 'Fecha'];
    const rows = participantes.map((p: any) => [
      TYPE_LABELS[p.TipoPersona] || p.TipoPersona,
      p.CedulaPersona || '', p.NombrePersona || '', p.EmpresaPersona || '',
      cursoActual?.Nombre || cursoActual?.nombre || '', p.EdificioNombre || '',
      p.FechaInicio ? new Date(p.FechaInicio).toLocaleDateString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r: string[]) => r.map(v => `"${v.replace(/"/g, '""')}"`).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `participantes_${expanded}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  };

  const filtrados = cursos.filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const nombre = (c.Nombre || c.nombre || '').toLowerCase();
    const codigo = (c.Codigo || c.codigo || '').toLowerCase();
    return nombre.includes(q) || codigo.includes(q);
  });

  if (loading) return <div className="empty-state"><div className="spinner mx-auto" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title"><BookOpen className="icon" /> Cursos y Capacitaciones</h1>
          <p className="page-header__subtitle" style={{ fontSize: 13, marginTop: 4 }}>Cursos, eventos y participantes registrados en el sistema</p>
        </div>
        {isAdmin && <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowImport(true)} className="btn btn--secondary"><Upload className="icon icon--sm" /> Importar</button>
          <button onClick={openNew} className="btn btn--primary"><Plus className="icon icon--sm" /> Nuevo curso</button>
        </div>}
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card__body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Search className="icon icon--sm text-muted" />
          <input type="text" className="form-control" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código o nombre…" style={{ maxWidth: 400 }} />
          <span className="text-muted text-xs">{filtrados.length} curso(s)</span>
        </div>
      </div>

      {showImport && (
        <div className="card mb-3">
          <div className="card__header"><span className="card-title"><Upload className="icon" /> Importar participantes</span></div>
          <div className="card__body">
            <p className="form-hint" style={{ marginBottom: 8 }}>
              Pegue un JSON con los participantes. Cada registro debe tener: eventoCursoId, tipoPersona, personaId, nombrePersona.
              Opcional: cedulaPersona, empresaPersona.
            </p>
            <textarea className="form-control" rows={8} value={importText} onChange={e => setImportText(e.target.value)}
              placeholder='[
  {"eventoCursoId":1,"tipoPersona":"EMPLEADO","personaId":"500708","nombrePersona":"GUSTAVO ADOLFO LIRA SALAZAR"},
  {"eventoCursoId":1,"tipoPersona":"PROVEEDOR","personaId":"3","nombrePersona":"Proveedor ABC","cedulaPersona":"001-123456-7","empresaPersona":"ABC S.A."}
]' style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }} />
            <div className="form-actions" style={{ marginTop: 8 }}>
              <button onClick={async () => {
                try {
                  const parsed = JSON.parse(importText);
                  if (!Array.isArray(parsed) || parsed.length === 0) { showError('Debe ser un arreglo no vacío'); return; }
                  setImporting(true);
                  const res = await api.post('/curso-participantes/importar', { participantes: parsed });
                  showSuccess(`Importados ${res.data.importados} participante(s)`);
                  setShowImport(false); setImportText(''); load();
                } catch (err: any) { showError('Error', err?.response?.data?.message || 'JSON inválido'); }
                setImporting(false);
              }} disabled={importing || !importText.trim()} className="btn btn--primary">
                {importing ? 'Importando…' : 'Importar participantes'}
              </button>
              <button onClick={() => { setShowImport(false); setImportText(''); }} className="btn btn--secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showForm && isAdmin && (
        <form onSubmit={save} className="card mb-3">
          <div className="card__body">
            <div className="form-grid form-grid--3">
              <div className="form-group">
                <label htmlFor="cur-codigo" className="form-label">Código</label>
                <input id="cur-codigo" type="text" className="form-control" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="Ej: CAP-001" />
              </div>
              <div className="form-group">
                <label htmlFor="cur-nombre" className="form-label form-label--required">Nombre</label>
                <input id="cur-nombre" type="text" className="form-control" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del curso" />
              </div>
              <div className="form-group">
                <label htmlFor="cur-horas" className="form-label">Duración (horas)</label>
                <input id="cur-horas" type="number" className="form-control" value={form.duracionHoras} onChange={e => setForm({ ...form, duracionHoras: e.target.value })} placeholder="Ej: 8" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label htmlFor="cur-desc" className="form-label">Descripción</label>
                <textarea id="cur-desc" className="form-control" rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del curso" />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary"><Save className="icon icon--sm" /> Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn--secondary">Cancelar</button>
            </div>
          </div>
        </form>
      )}

      {filtrados.map((curso: any) => {
        const id = curso.Id || curso.id;
        const isExpanded = expanded === id;
        return (
          <div key={id} className="card" style={{ marginBottom: 12 }}>
            <div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <button onClick={() => toggleExpand(id)} className="btn btn--ghost btn--sm btn--icon" aria-label={isExpanded ? 'Contraer' : 'Expandir'}>
                {isExpanded ? <ChevronDown className="icon icon--sm" /> : <ChevronRight className="icon icon--sm" />}
              </button>
              <div className="flex--1">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong>{curso.Nombre || curso.nombre}</strong>
                  {curso.Codigo && <span className="badge badge--neutral" style={{ fontSize: 11 }}>{curso.Codigo}</span>}
                </div>
                <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                  {curso.Descripcion || curso.descripcion || 'Sin descripción'}
                  {curso.DuracionHoras ? ` · ${curso.DuracionHoras}h` : ''}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => openEdit(curso)} className="btn btn--ghost btn--sm">Editar</button>
              )}
            </div>

            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--gray-200)', padding: 12 }}>
                {loadingPart ? (
                  <div className="empty-state empty-state--compact"><div className="spinner mx-auto" /></div>
                ) : participantes.length === 0 ? (
                  <div className="empty-state empty-state--compact">
                    <Users className="icon--lg empty-state__icon" />
                    <p className="empty-state__desc">Sin participantes registrados</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="text-sm text-muted">{participantes.length} participante(s)</span>
                      <button onClick={exportCSV} className="btn btn--ghost btn--sm">Exportar CSV</button>
                    </div>
                    <div className="table-wrapper">
                      <table className="table" style={{ fontSize: 13 }}>
                        <thead><tr>
                          <th scope="col">Tipo</th><th scope="col">Cédula</th>
                          <th scope="col">Nombre</th><th scope="col">Empresa</th>
                          <th scope="col">Evento</th><th scope="col">Edificio</th>
                        </tr></thead>
                        <tbody>
                          {participantes.map((p: any, i: number) => (
                            <tr key={p.Id || i}>
                              <td><span className="badge badge--neutral" style={{ fontSize: 11 }}>{TYPE_LABELS[p.TipoPersona] || p.TipoPersona}</span></td>
                              <td className="text-muted">{p.CedulaPersona || '—'}</td>
                              <td className="font-bold">{p.NombrePersona}</td>
                              <td className="text-muted">{p.EmpresaPersona || '—'}</td>
                              <td className="text-xs">{p.FechaInicio ? new Date(p.FechaInicio).toLocaleDateString() : '—'}</td>
                              <td className="text-xs">{p.EdificioNombre || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {filtrados.length === 0 && !loading && (
        <div className="empty-state">
          <BookOpen className="icon--lg empty-state__icon" />
          <p className="empty-state__desc">{search ? 'Sin resultados para esa búsqueda' : 'No hay cursos registrados'}</p>
        </div>
      )}
    </div>
  );
}
