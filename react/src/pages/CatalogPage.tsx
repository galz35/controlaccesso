import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Pencil, Building2, Users, BookOpen, Save, Search } from 'lucide-react';
import { showSuccess, showError } from '../lib/swal';

interface FieldDef { key: string; label: string; type?: string }
interface CatalogItem { Id?: number; id?: number; [key: string]: any }

const CATALOGOS: Record<string, { title: string; subtitle: string; icon: any; fields: FieldDef[] }> = {
  edificios: { title: 'Edificios', subtitle: 'Planteles, sedes y ubicaciones donde se registran accesos', icon: Building2, fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'direccion', label: 'Dirección' }] },
  proveedores: { title: 'Proveedores', subtitle: 'Empresas y personas que proveen servicios a Claro', icon: Users, fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'ruc', label: 'RUC' }, { key: 'telefono', label: 'Teléfono' }, { key: 'correo', label: 'Correo' }, { key: 'empresa', label: 'Empresa' }] },
  instructores: { title: 'Facilitadores', subtitle: 'Instructores internos y externos que imparten capacitaciones', icon: Users, fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'telefono', label: 'Teléfono' }, { key: 'correo', label: 'Correo' }, { key: 'empresa', label: 'Empresa' }, { key: 'especialidad', label: 'Especialidad' }] },
  cursos: { title: 'Cursos', subtitle: 'Cursos y eventos de capacitación disponibles en los planteles', icon: BookOpen, fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' }, { key: 'duracionHoras', label: 'Duración (horas)', type: 'number' }] },
  'personal-externo': { title: 'Personal Externo', subtitle: 'PL, cocina, carga, conductores y otros servicios', icon: Users, fields: [{ key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'empresa', label: 'Empresa' }, { key: 'servicio', label: 'Servicio' }, { key: 'telefono', label: 'Teléfono' }] },
};

const ITEMS_POR_PAGINA = 15;

export default function CatalogPage({ tipo }: { tipo: string }) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const cfg = CATALOGOS[tipo];
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const Icon = cfg.icon;

  const load = useCallback(async () => {
    setLoading(true); setApiError(false);
    try { const r = await api.get(`/${tipo}`); setItems(r.data || []); } catch { setApiError(true); }
    setLoading(false);
  }, [tipo]);

  useEffect(() => { load(); }, [load]);

  const filtrados = items.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return cfg.fields.some(f => String(item[f.key] || item[f.key.charAt(0).toUpperCase() + f.key.slice(1)] || '').toLowerCase().includes(q));
  });

  const totalPag = Math.max(1, Math.ceil(filtrados.length / ITEMS_POR_PAGINA));
  const paginados = filtrados.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA);

  useEffect(() => { setPagina(1); }, [search]);

  const getVal = (item: CatalogItem, key: string): string => item[key] ?? item[key.charAt(0).toUpperCase() + key.slice(1)] ?? '-';

  const openNew = () => {
    const f: Record<string, any> = {};
    cfg.fields.forEach(fld => f[fld.key] = '');
    setForm(f); setEditId(null); setShowForm(true);
  };

  const openEdit = (item: CatalogItem) => {
    const f: Record<string, any> = {};
    cfg.fields.forEach(fld => f[fld.key] = getVal(item, fld.key));
    setForm(f); setEditId(item.Id || item.id || null); setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) await api.put(`/${tipo}/${editId}`, form);
      else await api.post(`/${tipo}`, form);
      showSuccess('Guardado');
      setShowForm(false); load();
    } catch (err: any) { showError('Error', err?.response?.data?.message || 'Error al guardar'); }
  };

  if (loading) return <div className="empty-state"><div className="spinner mx-auto" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title"><Icon /> {cfg.title}</h1>
          <p className="page-header__subtitle" style={{ fontSize: 13, marginTop: 4 }}>{cfg.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && <button onClick={openNew} className="btn btn--primary"><Plus className="icon icon--sm" /> Nuevo</button>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card__body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Search className="icon icon--sm text-muted" />
          <input type="text" className="form-control" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Buscar en ${cfg.title.toLowerCase()}…`} style={{ maxWidth: 400 }} />
          <span className="text-muted text-xs">{filtrados.length} registro(s)</span>
        </div>
      </div>

      {apiError ? (
        <div className="alert alert--error" role="alert">
          <p>Error al cargar los datos.</p>
          <button onClick={load} className="btn btn--primary btn--sm mt-2">Reintentar</button>
        </div>
      ) : showForm && isAdmin ? (
        <form onSubmit={save} className="card mb-3">
          <div className="card__body">
            <div className="form-grid form-grid--3">
              {cfg.fields.map(fld => (
                <div className="form-group" key={fld.key}>
                  <label htmlFor={`${tipo}-${fld.key}`} className="form-label form-label--required">{fld.label}</label>
                  <input id={`${tipo}-${fld.key}`} type={fld.type || 'text'} className="form-control" value={form[fld.key] || ''} onChange={e => setForm({ ...form, [fld.key]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary"><Save className="icon icon--sm" /> Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn--secondary">Cancelar</button>
            </div>
          </div>
        </form>
      ) : null}

      <div className="card">
        {/* Desktop table */}
        <div className="table-wrapper">
          <table className="table">
            <caption className="visually-hidden">Listado de {cfg.title.toLowerCase()}</caption>
            <thead><tr>
              {cfg.fields.map(fld => <th key={fld.key} scope="col">{fld.label}</th>)}
              {isAdmin && <th scope="col" className="text-center">Acción</th>}
            </tr></thead>
            <tbody>
              {paginados.map((item, i) => (
                <tr key={item.Id || item.id || i}>
                  {cfg.fields.map(fld => <td key={fld.key}>{getVal(item, fld.key)}</td>)}
                  {isAdmin && <td className="text-center"><button type="button" onClick={() => openEdit(item)} className="btn btn--ghost btn--sm btn--icon" aria-label="Editar"><Pencil className="icon icon--sm" /></button></td>}
                </tr>
              ))}
              {paginados.length === 0 && <tr className="catalog-empty"><td colSpan={cfg.fields.length + (isAdmin ? 1 : 0)}>{search ? 'Sin resultados para esa búsqueda' : 'Sin registros'}</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="catalog-cards-mobile">
          {paginados.map((item, i) => (
            <div key={item.Id || item.id || i} className="access-card">
              <div className="access-card__header">
                <div className="access-card__name">{cfg.fields[0] ? getVal(item, cfg.fields[0].key) : '—'}</div>
                {isAdmin && <button type="button" onClick={() => openEdit(item)} className="btn btn--ghost btn--sm btn--icon" aria-label="Editar"><Pencil className="icon icon--sm" /></button>}
              </div>
              {cfg.fields.slice(1).map(fld => (
                <div key={fld.key} className="access-card__details" style={{ fontSize: 12 }}><strong>{fld.label}:</strong> {getVal(item, fld.key)}</div>
              ))}
            </div>
          ))}
          {paginados.length === 0 && <div className="empty-state empty-state--compact"><p className="empty-state__desc">{search ? 'Sin resultados' : 'Sin registros'}</p></div>}
        </div>

        {/* Paginación */}
        {totalPag > 1 && (
          <div className="card__footer">
            <span className="text-muted text-xs">{filtrados.length} registro(s) — Pág {pagina} de {totalPag}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="btn btn--secondary btn--sm">← Anterior</button>
              <button onClick={() => setPagina(p => Math.min(totalPag, p + 1))} disabled={pagina >= totalPag} className="btn btn--secondary btn--sm">Siguiente →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}