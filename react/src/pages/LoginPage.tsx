import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DoorOpen, User, KeyRound, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'empleado' | 'externo'>('empleado');
  const [carnet, setCarnet] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, width: '100%', maxWidth: 380, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <DoorOpen className="w-10 h-10" style={{ color: '#da121a', margin: '0 auto 12px' }} />
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, margin: 0 }}>Control Acceso</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Registro de Entrada a Edificios</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <button onClick={() => { setMode('empleado'); setError(''); }}
            style={{ flex: 1, padding: '10px 14px', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              ...(mode === 'empleado' ? { background: '#da121a', color: 'white' } : { background: '#f9fafb', color: '#6b7280' }) }}>
            <User className="w-4 h-4" /> Empleado
          </button>
          <button onClick={() => { setMode('externo'); setError(''); }}
            style={{ flex: 1, padding: '10px 14px', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              ...(mode === 'externo' ? { background: '#da121a', color: 'white' } : { background: '#f9fafb', color: '#6b7280' }) }}>
            <KeyRound className="w-4 h-4" /> Externo
          </button>
        </div>

        {mode === 'empleado' ? (
          <div>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Ingrese su carnet de empleado</p>
            <input type="text" value={carnet} onChange={e => setCarnet(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Carnet"
              autoFocus
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Ingrese su usuario y contraseña</p>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Usuario"
              autoFocus
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Contraseña"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
          </div>
        )}

        {error && <p style={{ color: '#dc2626', fontSize: 12, margin: '0 0 12px' }}>{error}</p>}

        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: 12, background: '#da121a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DoorOpen className="w-4 h-4" />}
          Ingresar
        </button>
      </div>
    </div>
  );
}
