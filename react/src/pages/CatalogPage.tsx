import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Pencil, Loader2, Building2, Users, BookOpen } from 'lucide-react';
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
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try { const r = await api.get(`/${tipo}`); setItems(r.data || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [tipo]);

  const openNew = () => {
    const f: Record<string, any> = {};
    cfg.fields.forEach(fld => f[fld.key] = '');
    setForm(f);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    const f: Record<string, any> = {};
    cfg.fields.forEach(fld => f[fld.key] = item[fld.key] || item[fld.key.charAt(0).toUpperCase() + fld.key.slice(1)] || '');
    setForm(f);
    setEditId(item.Id || item.id);
    setShowForm(true);
  };

  const save = async () => {
    try {
      if (editId) await api.put(`/${tipo}/${editId}`, form);
      else await api.post(`/${tipo}`, form);
      Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
      setShowForm(false);
      load();
    } catch (err: any) { Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Error' }); }
  };

  if (loading) return <p style={{ textAlign: 'center', color: '#9ca3af' }}><Loader2 className="w-5 h-5 animate-spin" /></p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <cfg.icon className="w-5 h-5" /> {cfg.title}
        </h3>
        <button onClick={openNew} style={{ background: '#da121a', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: 16, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {cfg.fields.map(fld => (
              <div key={fld.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 2 }}>{fld.label}</label>
                <input type={fld.type || 'text'} value={form[fld.key] || ''} onChange={e => setForm({ ...form, [fld.key]: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={save} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Guardar</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              {cfg.fields.map(fld => <th key={fld.key} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', fontSize: 10 }}>{fld.label}</th>)}
              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#6b7280', fontSize: 10 }}>Acción</th>
            </tr></thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.Id || item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {cfg.fields.map(fld => (
                    <td key={fld.key} style={{ padding: '8px 12px' }}>{item[fld.key] || item[fld.key.charAt(0).toUpperCase() + fld.key.slice(1)] || '-'}</td>
                  ))}
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <button onClick={() => openEdit(item)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 6px', cursor: 'pointer' }}>
                      <Pencil className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={cfg.fields.length + 1} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Sin registros</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
