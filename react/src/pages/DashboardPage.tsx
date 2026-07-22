import { useState, useEffect } from 'react';
import api from '../services/api';
import { DoorOpen, LogOut, Building2, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [hoy, setHoy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/acceso/hoy');
      setHoy(res.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const registrarSalida = async (id: number) => {
    try {
      await api.post(`/acceso/salida/${id}`);
      load();
    } catch {}
  };

  const totalEntradas = hoy.length;
  const totalSalidas = hoy.filter(r => r.fechaSalida).length;
  const dentro = totalEntradas - totalSalidas;

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}><Loader2 className="w-6 h-6" style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} /><p>Cargando...</p></div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Entradas Hoy', value: totalEntradas, color: '#065f46', bg: '#d1fae5', icon: DoorOpen },
          { label: 'Salidas', value: totalSalidas, color: '#1e40af', bg: '#dbeafe', icon: LogOut },
          { label: 'Dentro del edificio', value: dentro, color: '#92400e', bg: '#fef3c7', icon: Building2 },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px', textAlign: 'center' }}>
            <s.icon className="w-5 h-5" style={{ margin: '0 auto 6px', color: s.color }} />
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 28, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 14 }}>
          <DoorOpen className="w-4 h-4" style={{ verticalAlign: 'middle', marginRight: 6 }} /> Accesos de Hoy
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280' }}>Tipo</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280' }}>Nombre</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280' }}>Cédula</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280' }}>Edificio</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#6b7280' }}>Entrada</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#6b7280' }}>Salida</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#6b7280' }}></th>
            </tr></thead>
            <tbody>
              {hoy.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#f3f4f6', color: '#374151' }}>{r.tipoPersona}</span>
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.nombre}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{r.cedula || '-'}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{r.edificio}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11 }}>{new Date(r.fechaEntrada).toLocaleTimeString()}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11 }}>
                    {r.fechaSalida ? new Date(r.fechaSalida).toLocaleTimeString() : <span style={{ color: '#da121a', fontWeight: 700 }}>Dentro</span>}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {!r.fechaSalida && (
                      <button onClick={() => registrarSalida(r.id)}
                        style={{ background: '#da121a', color: 'white', border: 'none', borderRadius: 4, padding: '3px 8px', fontWeight: 600, fontSize: 10, cursor: 'pointer' }}>
                        Salida
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {hoy.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Sin accesos hoy</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
