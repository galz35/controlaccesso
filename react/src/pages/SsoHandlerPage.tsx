import { useEffect, useState } from 'react';
import api from '../services/api';
import { DoorOpen, XCircle } from 'lucide-react';

export default function SsoHandlerPage() {
  const [state, setState] = useState<'loading' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) { setState('error'); setError('Token SSO no encontrado en la URL.'); return; }
    api.post('/auth/sso-login', { token })
      .then(res => { localStorage.setItem('token', res.data.access_token); localStorage.setItem('user', JSON.stringify(res.data.user)); window.location.href = '/control-acceso/'; })
      .catch(err => { setState('error'); setError(err?.response?.data?.message || 'Error al validar token SSO.'); });
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-icon"><DoorOpen className="icon--lg" /></div>
          <h1 className="login-title">Control de Acceso</h1>
          <p className="login-subtitle">Validando acceso seguro desde el Portal</p>
        </div>
        <div className="login-form sso-section">
          {state === 'loading' ? (
            <div role="status" aria-live="polite"><div className="spinner sso-section__spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /><p className="sso-section__text">Validando acceso seguro…</p></div>
          ) : (
            <div role="alert"><XCircle className="icon--lg" style={{ color: 'var(--error)', margin: '0 auto var(--space-3)' }} /><p className="sso-section__error">{error}</p><a href="/control-acceso/login" className="btn btn--primary">Volver al inicio de sesión</a></div>
          )}
        </div>
      </div>
    </div>
  );
}
