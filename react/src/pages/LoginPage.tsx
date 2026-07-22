import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DoorOpen, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [carnet, setCarnet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!carnet.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(carnet.trim());
      window.location.href = '/control-acceso/';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al iniciar sesión');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, width: '100%', maxWidth: 380, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <DoorOpen className="w-10 h-10" style={{ color: '#da121a', margin: '0 auto 12px' }} />
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, margin: 0 }}>Control Acceso</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Ingrese su carnet</p>
        </div>
        <input type="text" value={carnet} onChange={e => setCarnet(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Carnet"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
        {error && <p style={{ color: '#dc2626', fontSize: 12, margin: '0 0 12px' }}>{error}</p>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: 12, background: '#da121a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Ingresar
        </button>
      </div>
    </div>
  );
}
