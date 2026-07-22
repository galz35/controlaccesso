import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export default function RoleGuard({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.rol)) {
    return (
      <div className="empty-state" style={{ paddingTop: 60 }}>
        <h2 style={{ color: 'var(--gray-600)', marginBottom: 8 }}>Acceso restringido</h2>
        <p className="empty-state__desc">No tenés permisos para ver esta sección.</p>
        <a href="/control-acceso/" className="btn btn--primary" style={{ marginTop: 16 }}>Volver al inicio</a>
      </div>
    );
  }
  return <>{children}</>;
}
