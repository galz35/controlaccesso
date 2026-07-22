import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Pencil, Building2, Users, BookOpen, Save } from 'lucide-react';
import Swal from 'sweetalert2';

const CATALOGOS: Record<string, { title: string; icon: any; fields: { key: string; label: string; type?: string }[] }> = {
  edificios: {
    title: 'Edificios', icon: Building2,
    fields: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'direccion', label: 'Dirección' },
    ],
  },
  proveedores: {
    title: 'Proveedores', icon: Users,
    fields: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'cedula', label: 'Cédula' },
      { key: 'ruc', label: 'RUC' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'correo', label: 'Correo' },
      { key: 'empresa', label: 'Empresa' },
    ],
  },
  instructores: {
    title: 'Instructores', icon: Users,
    fields: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'cedula', label: 'Cédula' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'correo', label: 'Correo' },
      { key: 'empresa', label: 'Empresa' },
      { key: 'especialidad', label: 'Especialidad' },
    ],
  },
  cursos: {
    title: 'Cursos', icon: BookOpen,
    fields: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'descripcion', label: 'Descripción' },
      { key: 'duracionHoras', label: 'Duración (horas)', type: 'number' },
    ],
  },
};

export default function CatalogPage({ tipo }: { tipo: string }) {
  const cfg = CATALOGOS[tipo];
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const Icon = cfg.icon;

  const load = async () => {
    try { const r = await api.get(`/${tipo}`); setItems(r.data || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [tipo]);

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

  const save = async () => {
    try {
      if (editId) await api.put(`/${tipo}/${editId}`, form);
      else await api.post(`/${tipo}`, form);
      Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
      setShowForm(false); load();
    } catch (err: any) { Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Error' }); }
  };

  if (loading) return <div className="empty-state"><div className="spinner mx-auto" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title"><Icon className="icon v-middle" /> {cfg.title}</h1>
        <button onClick={openNew} className="btn btn--primary"><Plus className="icon icon--sm" /> Nuevo</button>
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card__body">
            <div className="form-grid form-grid--3">
              {cfg.fields.map(fld => (
                <div className="form-group" key={fld.key}>
                  <label className="form-label form-label--required">{fld.label}</label>
                  <input type={fld.type || 'text'} className="form-control" value={form[fld.key] || ''} onChange={e => setForm({ ...form, [fld.key]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button onClick={save} className="btn btn--primary"><Save className="icon icon--sm" /> Guardar</button>
              <button onClick={() => setShowForm(false)} className="btn btn--secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {cfg.fields.map(fld => <th key={fld.key} scope="col">{fld.label}</th>)}
                <th scope="col" className="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr key={item.Id || item.id || i}>
                  {cfg.fields.map(fld => <td key={fld.key}>{item[fld.key] || item[fld.key.charAt(0).toUpperCase() + fld.key.slice(1)] || '-'}</td>)}
                  <td className="text-center"><button onClick={() => openEdit(item)} className="btn btn--ghost btn--sm btn--icon" aria-label="Editar"><Pencil className="icon icon--sm" /></button></td>
                </tr>
              ))}
              {items.length === 0 && <tr className="catalog-empty"><td colSpan={cfg.fields.length + 1}>Sin registros</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
