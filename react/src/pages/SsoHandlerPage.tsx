import { useEffect, useState } from 'react';
import api from '../services/api';
import { DoorOpen, XCircle } from 'lucide-react';

export default function SsoHandlerPage() {
  const [state, setState] = useState<'loading' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setState('error');
      setError('Token SSO no encontrado en la URL.');
      return;
    }

    api.post('/auth/sso-login', { token })
      .then(res => {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        window.location.href = '/control-acceso/';
      })
      .catch(err => {
        setState('error');
        setError(err?.response?.data?.message || 'Error al validar token SSO.');
      });
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-icon">
            <DoorOpen className="icon--lg" />
          </div>
          <h1 className="login-title">Control de Acceso</h1>
          <p className="login-subtitle">Validando acceso seguro desde el Portal</p>
        </div>

        <div className="login-form" style={{ textAlign: 'center' }}>
          {state === 'loading' ? (
            <div style={{ padding: '20px 0' }} role="status" aria-live="polite">
              <div className="spinner" style={{ margin: '0 auto 12px', width: 32, height: 32, borderWidth: 3 }} />
              <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>Validando acceso seguro…</p>
            </div>
          ) : (
            <div style={{ padding: '12px 0' }} role="alert">
              <XCircle className="icon--lg" style={{ color: 'var(--error)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--error)', fontWeight: 600, marginBottom: 8 }}>{error}</p>
              <a href="/control-acceso/login" className="btn btn--primary">Volver al inicio de sesión</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
