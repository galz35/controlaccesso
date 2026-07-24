import { useAuth } from '../context/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';
import { DoorOpen, LogOut, Menu, X, FileText, Home, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const navCPF = [
  { label: 'Registrar acceso', icon: DoorOpen, to: '/control-acceso/registro' },
  { label: 'Registrar salida', icon: LogOut, to: '/control-acceso/salidas' },
  { label: 'Historial y reportes', icon: FileText, to: '/control-acceso/reportes' },
];

const navAdminExtra = [
  { label: 'Inicio', icon: Home, to: '/control-acceso/' },
  { label: 'Administración', icon: Building2, to: '/control-acceso/admin' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.rol === 'admin';

  const navItems = isAdmin ? [...navAdminExtra, ...navCPF] : navCPF;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) setOpen(false); };
    document.addEventListener('keydown', handleEscape);
    if (open) document.body.style.overflow = 'hidden'; else document.body.style.overflow = '';
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="app-layout">
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside id="sidebar" className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="Menú principal">
        <div className="sidebar__brand">
          <div className="sidebar__logo"><DoorOpen className="sidebar__logo-icon" /></div>
          <div className="sidebar__brand-text">
            <span className="sidebar__title">Control Acceso</span>
            <span className="sidebar__subtitle">Claro Nicaragua</span>
          </div>
          <button className="sidebar__close btn btn--ghost btn--icon" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X className="icon" /></button>
        </div>

        <nav className="sidebar__nav" aria-label="Navegación">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink key={item.to} to={item.to}
                className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                onClick={() => setOpen(false)} aria-current={isActive ? 'page' : undefined}>
                <item.icon className="sidebar__link-icon" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{user?.nombre?.charAt(0) || 'U'}</div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.nombre || 'Usuario'}</span>
              <span className="sidebar__user-role">{isAdmin ? 'Administrador' : 'Registrador'}</span>
            </div>
            <button onClick={logout} className="btn btn--ghost btn--icon" aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut className="icon" /></button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button className="btn btn--ghost btn--icon topbar__menu-btn" onClick={() => setOpen(true)}
            aria-label="Abrir menú" aria-expanded={open} aria-controls="sidebar"><Menu className="icon" /></button>
          <span className="topbar__title">Control de Acceso</span>
          <div className="topbar__spacer" />
          {user?.edificioIdDefecto && !isAdmin && (
            <span className="topbar__edificio" style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-red)', marginRight: 12 }}>
              {(() => {
                const edificio = user.edificioIdDefecto;
                return `Edificio: ${edificio}`;
              })()}
            </span>
          )}
          <span className="topbar__user">{user?.nombre}</span>
          <button onClick={logout} className="btn btn--ghost btn--sm topbar__logout" aria-label="Cerrar sesión">
            <LogOut className="icon icon--sm" /> <span className="topbar__logout-text">Salir</span>
          </button>
        </header>

        {isAdmin && (
          <div className="task-bar" style={{
            display: 'flex', gap: 4, padding: '4px var(--space-4)',
            background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)',
            flexWrap: 'wrap'
          }}>
            <NavLink to="/control-acceso/registro" className="btn btn--sm btn--primary"
              style={{ fontSize: 12, padding: '4px 10px' }}><DoorOpen className="icon icon--sm" /> Registrar entrada</NavLink>
            <NavLink to="/control-acceso/salidas" className="btn btn--sm btn--dark"
              style={{ fontSize: 12, padding: '4px 10px' }}><LogOut className="icon icon--sm" /> Registrar salida</NavLink>
            <NavLink to="/control-acceso/reportes" className="btn btn--sm btn--secondary"
              style={{ fontSize: 12, padding: '4px 10px' }}><FileText className="icon icon--sm" /> Ver historial</NavLink>
          </div>
        )}

        <main id="main-content" className="main-content">{children}</main>
      </div>
    </div>
  );
}
