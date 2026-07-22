import { useAuth } from '../context/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, DoorOpen, Building2, Users, BookOpen, KeyRound, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const navSections = [
  {
    label: 'Operación',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/control-acceso/' },
      { label: 'Registro', icon: DoorOpen, to: '/control-acceso/registro' },
    ],
    minRole: 'registrador',
  },
  {
    label: 'Catálogos',
    items: [
      { label: 'Edificios', icon: Building2, to: '/control-acceso/edificios' },
      { label: 'Proveedores', icon: Users, to: '/control-acceso/proveedores' },
      { label: 'Instructores', icon: Users, to: '/control-acceso/instructores' },
      { label: 'Cursos', icon: BookOpen, to: '/control-acceso/cursos' },
    ],
    minRole: 'registrador',
  },
  {
    label: 'Administración',
    items: [
      { label: 'Usuarios CPF', icon: KeyRound, to: '/control-acceso/admin-cpf' },
    ],
    minRole: 'admin',
  },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="app-layout">
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside id="sidebar" className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="Menú principal">
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <DoorOpen className="sidebar__logo-icon" />
          </div>
          <div className="sidebar__brand-text">
            <span className="sidebar__title">Control Acceso</span>
            <span className="sidebar__subtitle">Claro Nicaragua</span>
          </div>
          <button className="sidebar__close btn btn--ghost btn--icon" onClick={() => setOpen(false)} aria-label="Cerrar menú">
            <X className="icon" />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Navegación">
          {navSections.map((section) => {
            const allowed = section.minRole === 'admin' ? user?.rol === 'admin' : true;
            if (!allowed) return null;
            return (
            <div key={section.label} className="sidebar__section">
              <span className="sidebar__section-label">{section.label}</span>
              {section.items.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="sidebar__link-icon" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{user?.nombre?.charAt(0) || 'U'}</div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.nombre || 'Usuario'}</span>
              <span className="sidebar__user-role">{user?.rol || '-'}</span>
            </div>
            <button onClick={logout} className="btn btn--ghost btn--icon" aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut className="icon" />
            </button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button
            className="btn btn--ghost btn--icon topbar__menu-btn"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="sidebar"
          >
            <Menu className="icon" />
          </button>
          <span className="topbar__title">Control Acceso</span>
          <div className="topbar__spacer" />
          <span className="topbar__user">{user?.nombre}</span>
          <button onClick={logout} className="btn btn--ghost btn--sm topbar__logout" aria-label="Cerrar sesión">
            <LogOut className="icon icon--sm" />
            <span className="topbar__logout-text">Salir</span>
          </button>
        </header>

        <main id="main-content" className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
