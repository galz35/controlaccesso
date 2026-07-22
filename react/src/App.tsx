import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Shell from './components/Shell';
import RoleGuard from './components/RoleGuard';
import LoginPage from './pages/LoginPage';
import SsoHandlerPage from './pages/SsoHandlerPage';
import DashboardPage from './pages/DashboardPage';
import RegistroPage from './pages/RegistroPage';
import CatalogPage from './pages/CatalogPage';
import AdminCpfPage from './pages/AdminCpfPage';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/control-acceso/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/control-acceso/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/control-acceso/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/control-acceso/auth/sso" element={<SsoHandlerPage />} />
          <Route path="/control-acceso/" element={<ProtectedRoute><Shell><DashboardPage /></Shell></ProtectedRoute>} />
          <Route path="/control-acceso/registro" element={<ProtectedRoute><Shell><RegistroPage /></Shell></ProtectedRoute>} />
          <Route path="/control-acceso/edificios" element={<ProtectedRoute><Shell><CatalogPage tipo="edificios" /></Shell></ProtectedRoute>} />
          <Route path="/control-acceso/proveedores" element={<ProtectedRoute><Shell><CatalogPage tipo="proveedores" /></Shell></ProtectedRoute>} />
          <Route path="/control-acceso/instructores" element={<ProtectedRoute><Shell><CatalogPage tipo="instructores" /></Shell></ProtectedRoute>} />
          <Route path="/control-acceso/cursos" element={<ProtectedRoute><Shell><CatalogPage tipo="cursos" /></Shell></ProtectedRoute>} />
          <Route path="/control-acceso/admin-cpf" element={<ProtectedRoute><RoleGuard roles={['admin']}><Shell><AdminCpfPage /></Shell></RoleGuard></ProtectedRoute>} />
          <Route path="/control-acceso/forbidden" element={<RoleGuard roles={['admin']}><div>Sin permisos</div></RoleGuard>} />
          <Route path="*" element={<Navigate to="/control-acceso/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
