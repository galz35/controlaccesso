import { useNavigate } from 'react-router-dom';
import { Shield, Building2, Users, BookOpen, KeyRound } from 'lucide-react';

const adminSections = [
  { label: 'Edificios', icon: Building2, desc: 'Planteles, sedes y ubicaciones', to: '/control-acceso/edificios' },
  { label: 'Proveedores', icon: Users, desc: 'Empresas y personas proveedoras', to: '/control-acceso/proveedores' },
  { label: 'Facilitadores', icon: Users, desc: 'Instructores internos y externos', to: '/control-acceso/instructores' },
  { label: 'Cursos y capacitaciones', icon: BookOpen, desc: 'Cursos, eventos y participantes', to: '/control-acceso/cursos' },
  { label: 'Personal externo', icon: Users, desc: 'PL, cocina, carga, conductores', to: '/control-acceso/personal-externo' },
  { label: 'Cuentas de acceso', icon: KeyRound, desc: 'Usuarios CPF de proveedores e instructores', to: '/control-acceso/admin-cpf' },
];

export default function AdminPage() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title"><Shield className="icon" /> Administración</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {adminSections.map(s => (
          <button key={s.to} onClick={() => navigate(s.to)} className="card" style={{ cursor: 'pointer', textAlign: 'left', padding: 20, border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <s.icon className="icon" style={{ color: 'var(--brand-red)' }} />
              <strong>{s.label}</strong>
            </div>
            <div className="text-muted text-sm">{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
