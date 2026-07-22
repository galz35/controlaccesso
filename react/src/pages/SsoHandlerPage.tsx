import { useEffect, useState } from 'react';
import api from '../services/api';
import { Loader2 } from 'lucide-react';

export default function SsoHandlerPage() {
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
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
        setError(err?.response?.data?.message || 'Error al validar token SSO.');
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div style={{ textAlign: 'center' }}>
        {error ? (
          <div>
            <p style={{ color: '#dc2626', fontWeight: 700 }}>❌ {error}</p>
            <a href="/control-acceso/login" style={{ color: '#da121a', marginTop: 12, display: 'inline-block' }}>Ir al inicio</a>
          </div>
        ) : (
          <div>
            <Loader2 className="w-8 h-8" style={{ animation: 'spin 0.8s linear infinite', color: '#da121a', margin: '0 auto 12px' }} />
            <p style={{ color: '#6b7280' }}>Validando acceso desde el Portal...</p>
          </div>
        )}
      </div>
    </div>
  );
}
