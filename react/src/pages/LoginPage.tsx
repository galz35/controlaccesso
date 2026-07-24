import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DoorOpen, Eye, EyeOff, AlertCircle } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  'Usuario o contraseña incorrectos': 'El usuario o la contraseña no son correctos. Revise los datos e intente otra vez.',
  'Usuario no encontrado': 'El usuario ingresado no existe. Verifique los datos.',
  'Unauthorized': 'El usuario o la contraseña no son correctos. Revise los datos e intente otra vez.',
};

const friendlyError = (err: any): string => {
  const msg = err?.response?.data?.message || err?.message || '';
  for (const [key, val] of Object.entries(ERROR_MESSAGES)) {
    if (msg.includes(key)) return val;
  }
  if (msg.includes('desactivada') || msg.includes('inactivo')) {
    return 'Esta cuenta está desactivada. Solicite ayuda al administrador.';
  }
  if (msg.includes('edificio') || msg.includes('building')) {
    return 'Su cuenta no tiene un edificio asignado. El administrador debe configurarlo.';
  }
  if (msg.includes('base') || msg.includes('database') || msg.includes('conexión')) {
    return 'El sistema no está disponible en este momento. No cierre esta pantalla e intente nuevamente.';
  }
  return msg || 'Error al iniciar sesión. Intente nuevamente.';
};

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [usernameErr, setUsernameErr] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Ingrese su usuario.'); setUsernameErr(true); return; }
    if (!password.trim()) { setError('Ingrese su contraseña.'); return; }
    setLoading(true);
    try {
      await login(username.trim(), password, true);
      window.location.href = '/control-acceso/registro';
    } catch (err: any) {
      setError(friendlyError(err));
      setPassword('');
      document.getElementById('password')?.focus();
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-icon"><DoorOpen className="icon--lg" /></div>
          <h1 className="login-title">Control de Acceso</h1>
          <p className="login-subtitle">Uso autorizado para personal de control</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Usuario</label>
            <input id="username" type="text" className={`form-control ${usernameErr ? 'form-control--error' : ''}`}
              value={username} onChange={e => { setUsername(e.target.value); setUsernameErr(false); }}
              placeholder="Nombre de usuario" autoFocus autoComplete="username"
              onInvalid={() => setUsernameErr(true)} />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Contraseña</label>
            <div className="password-field">
              <input id="password" type={showPwd ? 'text' : 'password'} className="form-control"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" />
              <button type="button" className="password-toggle" onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? 'Ocultar' : 'Mostrar'}>{showPwd ? <EyeOff className="icon icon--sm" /> : <Eye className="icon icon--sm" />}</button>
            </div>
          </div>

          {error && (
            <div className="alert alert--error" role="alert" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertCircle className="icon icon--sm" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn--primary login-btn" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? <span className="spinner spinner--white" /> : <DoorOpen className="icon icon--sm" />}
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          <p className="form-hint" style={{ textAlign: 'center', marginTop: 16 }}>
            Si no puede ingresar, contacte al administrador del sistema.
          </p>
        </form>
      </div>
    </div>
  );
}
