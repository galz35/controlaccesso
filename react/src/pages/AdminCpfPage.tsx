import { useState, useEffect } from 'react';
import api from '../services/api';
import { KeyRound, Plus, Loader2, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminCpfPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', nombre: '', tipo: 'PROVEEDOR', referenciaId: '' });
  const [showPwd, setShowPwd] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/cpf-users');
      setUsers(res.data || []);
    } catch { setUsers([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const crear = async () => {
    if (!form.username || !form.password || !form.nombre) {
      Swal.fire({ icon: 'error', title: 'Campos requeridos', text: 'Complete todos los campos.' });
      return;
    }
    if (form.password.length < 6) {
      Swal.fire({ icon: 'error', title: 'Contraseña muy corta', text: 'Mínimo 6 caracteres.' });
      return;
    }
    try {
      await api.post('/auth/cpf-register', {
        username: form.username,
        password: form.password,
        nombre: form.nombre,
        tipo: form.tipo,
        referenciaId: form.referenciaId ? parseInt(form.referenciaId) : undefined,
      });
      Swal.fire({ icon: 'success', title: 'Usuario CPF creado', timer: 2000, showConfirmButton: false });
      setShowForm(false);
      setForm({ username: '', password: '', nombre: '', tipo: 'PROVEEDOR', referenciaId: '' });
      load();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Error al crear' });
    }
  };

  const resetPassword = async (username: string) => {
    const { value: newPwd } = await Swal.fire({
      title: 'Nueva contraseña',
      text: `Para: ${username}`,
      input: 'password',
      inputPlaceholder: 'Nueva contraseña (mín. 6 caracteres)',
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      confirmButtonColor: '#da121a',
    });
    if (!newPwd || newPwd.length < 6) return;
    try {
      await api.put('/auth/cpf-password', { username, oldPassword: '', newPassword: newPwd });
      Swal.fire({ icon: 'success', title: 'Contraseña cambiada', timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Error' });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <KeyRound className="w-5 h-5" /> Usuarios Externos (CPF)
        </h3>
        <button onClick={() => setShowForm(true)}
          style={{ background: '#da121a', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus className="w-4 h-4" /> Nuevo Usuario CPF
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: 16, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 2 }}>Usuario *</label>
              <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 2 }}>Contraseña *</label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  style={{ width: '100%', padding: '8px 30px 8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
                <button onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 2 }}>Nombre *</label>
              <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 2 }}>Tipo</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }}>
                <option value="PROVEEDOR">Proveedor</option>
                <option value="INSTRUCTOR_EXTERNO">Facilitador Externo</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 2 }}>ID Referencia (opcional)</label>
              <input type="number" value={form.referenciaId} onChange={e => setForm({...form, referenciaId: e.target.value})}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={crear} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Guardar</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: 10, textTransform: 'uppercase' }}>Usuario</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: 10, textTransform: 'uppercase' }}>Nombre</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#6b7280', fontSize: 10, textTransform: 'uppercase' }}>Tipo</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#6b7280', fontSize: 10, textTransform: 'uppercase' }}>Rol</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#6b7280', fontSize: 10, textTransform: 'uppercase' }}>Activo</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#6b7280', fontSize: 10, textTransform: 'uppercase' }}>Acción</th>
            </tr></thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.Id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{u.Username}</td>
                  <td style={{ padding: '8px 12px' }}>{u.Nombre}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{u.Tipo}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{u.Rol}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: u.Activo ? '#d1fae5' : '#fee2e2', color: u.Activo ? '#065f46' : '#991b1b' }}>
                      {u.Activo ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <button onClick={() => resetPassword(u.Username)}
                      style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>
                      <KeyRound className="w-3 h-3" /> Password
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Sin usuarios CPF registrados</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
