import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Library, Search, BarChart3, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Дашборд' },
  { path: '/library', icon: Library, label: 'Библиотека' },
  { path: '/search', icon: Search, label: 'Поиск игр' },
  { path: '/stats', icon: BarChart3, label: 'Статистика' },
  { path: '/profile', icon: User, label: 'Профиль' },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-6 py-3.5 text-sm transition-colors ${
    isActive ? 'bg-white text-black font-semibold' : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
  }`;

export default function Layout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900">
      {/* Боковая панель с навигацией */}
      <aside className="w-60 bg-black text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-neutral-800">
          <h1 className="text-xl font-bold tracking-widest uppercase">GameTrack</h1>
          <p className="text-xs text-neutral-400 mt-1">Трекер бэклога игр</p>
        </div>

        <nav className="flex-1 mt-4">
          {menuItems.map(({ path, icon: Icon, label }) => (
            <NavLink key={path} to={path} end={path === '/'} className={linkClass}>
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-neutral-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-sm text-neutral-300 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Выход</span>
          </button>
        </div>
      </aside>

      {/* Основная рабочая область: сюда подставляется текущая страница */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
