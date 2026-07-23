import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { KeyRound, Plus, Eye, EyeOff, Shield } from 'lucide-react';
import { showSuccess, showError } from '../lib/swal';
import Swal from 'sweetalert2';

export default function AdminCpfPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', nombre: '', tipo: 'PROVEEDOR', referenciaId: '' });
  const [showPwd, setShowPwd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setApiError(false);
    try { const r = await api.get('/admin/cpf-users'); setUsers(r.data || []); } catch { setApiError(true); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.nombre) { showError('Campos requeridos', 'Complete todos los campos.'); return; }
    if (form.password.length < 6) { showError('Contraseña muy corta', 'Mínimo 6 caracteres.'); return; }
    try {
      await api.post('/auth/cpf-register', { username: form.username, password: form.password, nombre: form.nombre, tipo: form.tipo, referenciaId: form.referenciaId ? parseInt(form.referenciaId) : undefined });
      showSuccess('Usuario CPF creado');
      setShowForm(false); setForm({ username: '', password: '', nombre: '', tipo: 'PROVEEDOR', referenciaId: '' }); load();
    } catch (err: any) { showError('Error', err?.response?.data?.message || 'Error al crear'); }
  };

  const resetPassword = async (username: string) => {
    const { value: newPwd } = await Swal.fire({ title: 'Nueva contraseña', text: `Para: ${username}`, input: 'password', inputPlaceholder: 'Nueva contraseña (mín. 6 caracteres)', showCancelButton: true, confirmButtonText: 'Cambiar', confirmButtonColor: '#DA291C' });
    if (!newPwd || newPwd.length < 6) return;
    try { await api.put('/auth/cpf-password', { username, oldPassword: '', newPassword: newPwd }); showSuccess('Contraseña cambiada'); } catch (err: any) { showError('Error', err?.response?.data?.message || 'Error'); }
  };

  if (!isAdmin) return <div className="restricted-page"><h2>Acceso restringido</h2><p className="empty-state__desc">No tenés permisos para administrar usuarios CPF.</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title"><KeyRound className="icon" /> Usuarios Externos (CPF)</h1>
          <p className="page-header__subtitle"><Shield className="icon icon--sm v-middle" style={{ color: 'var(--brand-red)' }} /> Administración de cuentas para proveedores e instructores</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn--primary"><Plus className="icon icon--sm" /> Nuevo Usuario CPF</button>
      </div>

      {showForm && (
        <form onSubmit={crear} className="card mb-3">
          <div className="card__body">
            <div className="form-grid form-grid--3">
              <div className="form-group"><label htmlFor="cpf-user" className="form-label form-label--required">Usuario</label><input id="cpf-user" type="text" className="form-control" value={form.username} onChange={e => setForm({...form, username: e.target.value})} /></div>
              <div className="form-group"><label htmlFor="cpf-pass" className="form-label form-label--required">Contraseña <span className="form-hint">(mín. 6 carac.)</span></label>
                <div className="password-field"><input id="cpf-pass" type={showPwd ? 'text' : 'password'} className="form-control" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  <button type="button" className="password-toggle" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? 'Ocultar' : 'Mostrar'}>{showPwd ? <EyeOff className="icon icon--sm" /> : <Eye className="icon icon--sm" />}</button>
                </div>
              </div>
              <div className="form-group"><label htmlFor="cpf-nombre" className="form-label form-label--required">Nombre</label><input id="cpf-nombre" type="text" className="form-control" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
              <div className="form-group"><label htmlFor="cpf-tipo" className="form-label">Tipo</label><select id="cpf-tipo" className="form-control" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}><option value="PROVEEDOR">Proveedor</option><option value="INSTRUCTOR_EXTERNO">Facilitador Externo</option></select></div>
              <div className="form-group"><label htmlFor="cpf-ref" className="form-label">ID Referencia <span className="form-hint">(opcional)</span></label><input id="cpf-ref" type="number" className="form-control" value={form.referenciaId} onChange={e => setForm({...form, referenciaId: e.target.value})} /></div>
            </div>
            <div className="form-actions"><button type="submit" className="btn btn--primary">Guardar</button><button type="button" onClick={() => setShowForm(false)} className="btn btn--secondary">Cancelar</button></div>
          </div>
        </form>
      )}

      <div className="card">
        {apiError ? (
          <div className="empty-state"><p className="empty-state__desc">Error al cargar usuarios.</p><button onClick={load} className="btn btn--primary btn--sm mt-2">Reintentar</button></div>
        ) : loading ? (
          <div className="empty-state"><div className="spinner mx-auto" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
                <caption className="visually-hidden">Usuarios CPF registrados</caption>
              <thead><tr><th scope="col">Usuario</th><th scope="col">Nombre</th><th scope="col" className="text-center">Tipo</th><th scope="col" className="text-center">Rol</th><th scope="col" className="text-center">Activo</th><th scope="col" className="text-center">Acción</th></tr></thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.Id}>
                    <td className="font-bold">{u.Username}</td><td>{u.Nombre}</td>
                    <td className="text-center"><span className="badge badge--neutral">{u.Tipo}</span></td>
                    <td className="text-center">{u.Rol}</td>
                    <td className="text-center"><span className={`badge ${u.Activo ? 'badge--success' : 'badge--danger'}`}>{u.Activo ? 'Sí' : 'No'}</span></td>
                    <td className="text-center"><button onClick={() => resetPassword(u.Username)} className="btn btn--ghost btn--sm"><KeyRound className="icon icon--sm" /> Cambiar contraseña</button></td>
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
