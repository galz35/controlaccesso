import { useAuth } from '../context/AuthContext';
import { LogOut, Building2, Users, BookOpen, DoorOpen, LayoutDashboard, Menu, KeyRound } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/control-acceso/' },
  { label: 'Registro', icon: DoorOpen, to: '/control-acceso/registro' },
  { label: 'Edificios', icon: Building2, to: '/control-acceso/edificios' },
  { label: 'Proveedores', icon: Users, to: '/control-acceso/proveedores' },
  { label: 'Instructores', icon: Users, to: '/control-acceso/instructores' },
  { label: 'Cursos', icon: BookOpen, to: '/control-acceso/cursos' },
  { label: 'Usuarios CPF', icon: KeyRound, to: '/control-acceso/admin-cpf' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} onClick={() => setOpen(false)} />}
      <aside style={{
        width: 260, background: '#1e1e1e', color: 'white', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.2s',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Control Acceso</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>Registro de Entrada</div>
        </div>
        <nav style={{ flex: 1, padding: 8 }}>
          {navItems.map(item => (
            <a key={item.to} href={item.to}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
              onClick={() => setOpen(false)}>
              <item.icon className="w-4 h-4" /> {item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{user?.nombre}</div>
          <div style={{ fontSize: 11, opacity: 0.4 }}>{user?.rol}</div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
          <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}><Menu className="w-5 h-5" /></button>
          <span style={{ fontWeight: 700, color: '#1f2937', fontSize: 16 }}>Control Acceso</span>
          <div style={{ flex: 1 }} />
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </header>
        <main style={{ padding: 24, maxWidth: 1200, width: '100%', margin: '0 auto' }}>{children}</main>
      </div>
    </div>
  );
}
