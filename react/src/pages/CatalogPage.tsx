import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Pencil, Building2, Users, BookOpen, Save } from 'lucide-react';
import { showSuccess, showError } from '../lib/swal';

const CATALOGOS: Record<string, { title: string; icon: any; fields: { key: string; label: string; type?: string }[] }> = {
  edificios: { title: 'Edificios', icon: Building2, fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'direccion', label: 'Dirección' }] },
  proveedores: { title: 'Proveedores', icon: Users, fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'ruc', label: 'RUC' }, { key: 'telefono', label: 'Teléfono' }, { key: 'correo', label: 'Correo' }, { key: 'empresa', label: 'Empresa' }] },
  instructores: { title: 'Instructores', icon: Users, fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'telefono', label: 'Teléfono' }, { key: 'correo', label: 'Correo' }, { key: 'empresa', label: 'Empresa' }, { key: 'especialidad', label: 'Especialidad' }] },
  cursos: { title: 'Cursos', icon: BookOpen, fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' }, { key: 'duracionHoras', label: 'Duración (horas)', type: 'number' }] },
  'personal-externo': { title: 'Personal Externo', icon: Users, fields: [{ key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'empresa', label: 'Empresa' }, { key: 'servicio', label: 'Servicio' }, { key: 'telefono', label: 'Teléfono' }] },
};

export default function CatalogPage({ tipo }: { tipo: string }) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const cfg = CATALOGOS[tipo];
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const Icon = cfg.icon;

  const load = useCallback(async () => {
    setLoading(true); setApiError(false);
    try { const r = await api.get(`/${tipo}`); setItems(r.data || []); } catch { setApiError(true); }
    setLoading(false);
  }, [tipo]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    const f: Record<string, any> = {};
    cfg.fields.forEach(fld => f[fld.key] = '');
    setForm(f); setEditId(null); setShowForm(true);
  };

  const openEdit = (item: any) => {
    const f: Record<string, any> = {};
    cfg.fields.forEach(fld => f[fld.key] = item[fld.key] || item[fld.key.charAt(0).toUpperCase() + fld.key.slice(1)] || '');
    setForm(f); setEditId(item.Id || item.id); setShowForm(true);
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
        <h1 className="page-header__title"><Icon /> {cfg.title}</h1>
        {isAdmin && <button onClick={openNew} className="btn btn--primary"><Plus className="icon icon--sm" /> Nuevo</button>}
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
        <div className="table-wrapper">
          <table className="table">
                <caption className="visually-hidden">Listado de registros</caption>
            <thead><tr>
              {cfg.fields.map(fld => <th key={fld.key} scope="col">{fld.label}</th>)}
              {isAdmin && <th scope="col" className="text-center">Acción</th>}
            </tr></thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr key={item.Id || item.id || i}>
                  {cfg.fields.map(fld => <td key={fld.key}>{item[fld.key] || item[fld.key.charAt(0).toUpperCase() + fld.key.slice(1)] || '-'}</td>)}
                  {isAdmin && <td className="text-center"><button type="button" onClick={() => openEdit(item)} className="btn btn--ghost btn--sm btn--icon" aria-label="Editar"><Pencil className="icon icon--sm" /></button></td>}
                </tr>
              ))}
              {items.length === 0 && <tr className="catalog-empty"><td colSpan={cfg.fields.length + (isAdmin ? 1 : 0)}>Sin registros</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
