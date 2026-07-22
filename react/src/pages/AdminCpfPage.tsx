import { useState, useEffect } from 'react';
import api from '../services/api';
import { KeyRound, Plus, Eye, EyeOff, Shield } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminCpfPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', nombre: '', tipo: 'PROVEEDOR', referenciaId: '' });
  const [showPwd, setShowPwd] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get('/admin/cpf-users'); setUsers(r.data || []); } catch { setUsers([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const crear = async () => {
    if (!form.username || !form.password || !form.nombre) {
      Swal.fire({ icon: 'error', title: 'Campos requeridos', text: 'Complete todos los campos.' }); return;
    }
    if (form.password.length < 6) {
      Swal.fire({ icon: 'error', title: 'Contraseña muy corta', text: 'Mínimo 6 caracteres.' }); return;
    }
    try {
      await api.post('/auth/cpf-register', {
        username: form.username, password: form.password, nombre: form.nombre,
        tipo: form.tipo, referenciaId: form.referenciaId ? parseInt(form.referenciaId) : undefined,
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
      input: 'password', inputPlaceholder: 'Nueva contraseña (mín. 6 caracteres)',
      showCancelButton: true, confirmButtonText: 'Cambiar', confirmButtonColor: '#DA291C',
    });
    if (!newPwd || newPwd.length < 6) return;
    try {
      await api.put('/auth/cpf-password', { username, oldPassword: '', newPassword: newPwd });
      Swal.fire({ icon: 'success', title: 'Contraseña cambiada', timer: 2000, showConfirmButton: false });
    } catch (err: any) { Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.message || 'Error' }); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title"><KeyRound className="icon" /> Usuarios Externos (CPF)</h1>
          <p className="page-header__subtitle"><Shield className="icon icon--sm" style={{ verticalAlign: 'middle', color: 'var(--brand-red)' }} /> Administración de cuentas para proveedores e instructores</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn--primary"><Plus className="icon icon--sm" /> Nuevo Usuario CPF</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card__body">
            <div className="form-grid form-grid--3">
              <div className="form-group">
                <label className="form-label form-label--required">Usuario</label>
                <input type="text" className="form-control" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label form-label--required">Contraseña <span className="form-hint">(mín. 6 carac.)</span></label>
                <div className="password-field">
                  <input type={showPwd ? 'text' : 'password'} className="form-control" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  <button type="button" className="password-toggle" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? 'Ocultar' : 'Mostrar'}>
                    {showPwd ? <EyeOff className="icon icon--sm" /> : <Eye className="icon icon--sm" />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label form-label--required">Nombre</label>
                <input type="text" className="form-control" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-control" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                  <option value="PROVEEDOR">Proveedor</option>
                  <option value="INSTRUCTOR_EXTERNO">Facilitador Externo</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ID Referencia <span className="form-hint">(opcional)</span></label>
                <input type="number" className="form-control" value={form.referenciaId} onChange={e => setForm({...form, referenciaId: e.target.value})} />
              </div>
            </div>
            <div className="form-actions">
              <button onClick={crear} className="btn btn--primary">Guardar</button>
              <button onClick={() => setShowForm(false)} className="btn btn--secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="spinner sso-section__spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Nombre</th>
                  <th scope="col" className="table td--center">Tipo</th>
                  <th scope="col" className="table td--center">Rol</th>
                  <th scope="col" className="table td--center">Activo</th>
                  <th scope="col" className="table td--center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.Id}>
                    <td className="table td--bold">{u.Username}</td>
                    <td>{u.Nombre}</td>
                    <td className="table td--center"><span className="badge badge--neutral">{u.Tipo}</span></td>
                    <td className="table td--center">{u.Rol}</td>
                    <td className="table td--center">
                      <span className={`badge ${u.Activo ? 'badge--success' : 'badge--danger'}`}>{u.Activo ? 'Sí' : 'No'}</span>
                    </td>
                    <td className="table td--center">
                      <button onClick={() => resetPassword(u.Username)} className="btn btn--ghost btn--sm">
                        <KeyRound className="icon icon--sm" /> Cambiar contraseña
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr className="catalog-empty"><td colSpan={6}>Sin usuarios CPF registrados</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
