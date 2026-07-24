import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DoorOpen, User, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'empleado' | 'externo'>('empleado');
  const [carnet, setCarnet] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const allowDev = import.meta.env.VITE_ALLOW_DEV_LOGIN === 'true';
  const portalUrl = import.meta.env.VITE_PORTAL_SSO_URL || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'empleado') {
        if (!carnet.trim()) { setError('Ingrese su carnet'); setLoading(false); return; }
        await login(carnet.trim());
      } else {
        if (!username.trim() || !password.trim()) { setError('Ingrese usuario y contraseña'); setLoading(false); return; }
        await login(username.trim(), password.trim(), true);
      }
      window.location.href = '/control-acceso/';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al iniciar sesión');
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
          <div className="login-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'empleado'}
              className={`login-tab ${mode === 'empleado' ? 'login-tab--active' : ''}`}
              onClick={() => { setMode('empleado'); setError(''); }}
            >
              <User className="icon icon--sm" /> Empleado
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'externo'}
              className={`login-tab ${mode === 'externo' ? 'login-tab--active' : ''}`}
              onClick={() => { setMode('externo'); setError(''); }}
            >
              <KeyRound className="icon icon--sm" /> Externo
            </button>
          </div>

          {mode === 'empleado' ? (
            allowDev ? (
            <div className="form-group">
              <label htmlFor="carnet" className="form-label">Carnet de empleado</label>
              <input
                id="carnet"
                type="text"
                className="form-control"
                value={carnet}
                onChange={e => setCarnet(e.target.value)}
                placeholder="Ej: 500708"
                autoFocus
                autoComplete="username"
              />
            </div>
            ) : portalUrl ? (
              <a href={portalUrl} className="btn btn--primary btn--block btn--lg" style={{ justifyContent: 'center' }}>
                <DoorOpen className="icon icon--sm" /> Entrar desde Portal Claro
              </a>
            ) : (
              <div className="alert alert--warning" role="alert">
                Seleccione "Externo" e inicie sesión con su usuario CPF. El ingreso por Portal no está configurado aún.
              </div>
            )
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="username" className="form-label">Usuario</label>
                <input
                  id="username"
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                  autoFocus
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label">Contraseña</label>
                <div className="password-field">
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    className="form-control"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPwd}
                  >
                    {showPwd ? <EyeOff className="icon icon--sm" /> : <Eye className="icon icon--sm" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn--primary login-btn" disabled={loading}>
            {loading ? <span className="spinner spinner--white" /> : <DoorOpen className="icon icon--sm" />}
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
