import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Radio, Bell, History, BarChart3, LogOut, ShieldAlert } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();

  if (location.pathname === '/login') return <>{children}</>;

  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Live Monitoring', path: '/live', icon: <Radio size={20} /> },
    { name: 'Alerts', path: '/alerts', icon: <Bell size={20} /> },
    { name: 'History', path: '/history', icon: <History size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex text-gray-100 font-sans">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-8">
        <div className="flex items-center gap-3 mb-12">
          <ShieldAlert className="text-blue-500" size={32} />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Smart Helmet
          </h1>
        </div>

        <nav className="w-full px-4 flex-1 flex flex-col gap-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                {link.icon}
                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="w-full px-4 mt-auto">
          <Link
            to="/login"
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout Admin</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
