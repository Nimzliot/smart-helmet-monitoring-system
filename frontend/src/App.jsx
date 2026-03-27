import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import MapTracking from './pages/MapTracking';
import Alerts from './pages/Alerts';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Riders from './pages/Riders';
import Helmets from './pages/Helmets';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
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
                      <Route path="/map" element={<MapTracking />} />
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
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
