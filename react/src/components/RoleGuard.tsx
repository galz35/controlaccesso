import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export default function RoleGuard({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.rol)) {
    return (
      <div className="restricted-page">
        <h2>Acceso restringido</h2>
        <p className="empty-state__desc">No tenés permisos para ver esta sección.</p>
        <Link to="/control-acceso/" className="btn btn--primary mt-2">Volver al inicio</Link>
      </div>
    );
  }
  return <>{children}</>;
}

export function ForbiddenPage() {
  return (
    <div className="restricted-page">
      <h2>Página no disponible</h2>
      <p className="empty-state__desc">No tenés permisos para acceder aquí.</p>
      <Link to="/control-acceso/" className="btn btn--primary mt-2">Volver al inicio</Link>
    </div>
  );
}
