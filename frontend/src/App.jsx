import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClimateExplorer from './pages/ClimateExplorer';
import AnomalyMap from './pages/AnomalyMap';
import Predictions from './pages/Predictions';
import IngestionMonitor from './pages/IngestionMonitor';
import Alerts from './pages/Alerts';
import UserManagement from './pages/UserManagement';
import Support from './pages/Support';
import Profile from './pages/Profile';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

const SpinnerScreen = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-page)' }}>
    <div className="spinner-border text-primary" role="status" />
  </div>
);

const hasRole = (userRole, allowedRoles) => {
  if (!allowedRoles || !allowedRoles.length) return true;
  return allowedRoles.includes(userRole);
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <SpinnerScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(user.role, allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <SpinnerScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/explorer" element={<ProtectedRoute><ClimateExplorer /></ProtectedRoute>} />
      <Route path="/anomaly-map" element={<ProtectedRoute><AnomalyMap /></ProtectedRoute>} />
      <Route path="/predictions" element={<ProtectedRoute><Predictions /></ProtectedRoute>} />
      <Route path="/ingestion" element={<ProtectedRoute allowedRoles={['analyst', 'admin']}><IngestionMonitor /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
