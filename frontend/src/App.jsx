import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LiveMonitoring = lazy(() => import('./pages/LiveMonitoring'));
const Alerts = lazy(() => import('./pages/Alerts'));
const History = lazy(() => import('./pages/History'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Riders = lazy(() => import('./pages/Riders'));
const Helmets = lazy(() => import('./pages/Helmets'));
const Settings = lazy(() => import('./pages/Settings'));

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
      Loading Smart Helmet dashboard...
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/live" element={<LiveMonitoring />} />
                        <Route path="/alerts" element={<Alerts />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/riders" element={<Riders />} />
                        <Route path="/helmets" element={<Helmets />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
