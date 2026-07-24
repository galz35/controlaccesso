import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DoorOpen, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password, true);
      window.location.href = '/control-acceso/';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Usuario o contraseña incorrectos.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-icon">
            <DoorOpen className="icon--lg" />
          </div>
          <h1 className="login-title">Control de Acceso</h1>
          <p className="login-subtitle">Registro de entrada a edificios</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Usuario</label>
            <input id="username" type="text" className="form-control" value={username}
              onChange={e => setUsername(e.target.value)} placeholder="Nombre de usuario" autoFocus autoComplete="username" />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Contraseña</label>
            <div className="password-field">
              <input id="password" type={showPwd ? 'text' : 'password'} className="form-control"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" />
              <button type="button" className="password-toggle" onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPwd}>
                {showPwd ? <EyeOff className="icon icon--sm" /> : <Eye className="icon icon--sm" />}
              </button>
            </div>
          </div>

          {error && <div className="alert alert--error" role="alert">{error}</div>}

          <button type="submit" className="btn btn--primary login-btn" disabled={loading}>
            {loading ? <span className="spinner spinner--white" /> : <DoorOpen className="icon icon--sm" />}
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}