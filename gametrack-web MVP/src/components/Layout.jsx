import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Library, Search, User, LogOut } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Дашборд' },
    { path: '/library', icon: Library, label: 'Библиотека' },
    { path: '/search', icon: Search, label: 'Поиск игр' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-400 tracking-wider">GameTrack</h1>
          <p className="text-sm text-slate-400 mt-1">Десктопная версия</p>
        </div>
        
        <nav className="flex-1 mt-6">
          <ul>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-6 py-3 text-sm transition-colors ${
                      isActive ? 'bg-indigo-600 text-white border-r-4 border-indigo-400' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button className="flex items-center text-sm text-slate-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}