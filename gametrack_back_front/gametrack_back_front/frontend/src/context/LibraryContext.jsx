import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// Общее состояние библиотеки: его читают все страницы, а меняют только через функции ниже
const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const { user } = useAuth();
  const showToast = useToast();

  const [library, setLibrary] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [goal, setGoalState] = useState(null);
  const [loading, setLoading] = useState(true);

  const year = new Date().getFullYear();

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [lib, sess, target] = await Promise.all([api.getLibrary(), api.getSessions(), api.getGoal(year)]);
      setLibrary(lib);
      setSessions(sess);
      setGoalState(target);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, year, showToast]);

  // данные загружаются заново при каждом входе в аккаунт
  useEffect(() => {
    if (user) reload();
    else {
      setLibrary([]);
      setSessions([]);
      setGoalState(null);
    }
  }, [user, reload]);

  // Обёртка: показывает ошибку во всплывашке и не роняет страницу
  async function run(action, successText) {
    try {
      const result = await action();
      if (successText) showToast(successText);
      return result;
    } catch (e) {
      showToast(e.message, 'error');
      return null;
    }
  }

  const replaceItem = (item) => setLibrary((list) => list.map((ug) => (ug.id === item.id ? item : ug)));

  function addGame(game, fields) {
    return run(async () => {
      const item = await api.addToLibrary(game, fields);
      setLibrary((list) => [item, ...list]);
      return item;
    }, `«${game.title}» добавлена в библиотеку`);
  }

  function updateGame(item, patch, successText = 'Изменения сохранены') {
    const changes = { ...patch };
    // дату прохождения ставим автоматически — по ней считается цель на год
    if (patch.status === 'completed' && item.status !== 'completed') changes.completed_at = new Date().toISOString();
    if (patch.status && patch.status !== 'completed') changes.completed_at = null;

    return run(async () => {
      const updated = await api.updateUserGame(item.id, changes);
      replaceItem(updated);
      return updated;
    }, successText);
  }

  function removeGame(item) {
    return run(async () => {
      await api.removeFromLibrary(item.id);
      setLibrary((list) => list.filter((ug) => ug.id !== item.id));
      setSessions((list) => list.filter((s) => s.user_game_id !== item.id));
      return true;
    }, `«${item.game.title}» удалена из библиотеки`);
  }

  // Кнопки +1 ч / -1 ч: меняем общее время и записываем сессию для карты активности
  function changeHours(item, delta) {
    const hours = Math.max(0, (item.playtime_hours || 0) + delta);
    if (hours === item.playtime_hours) return null;
    return run(async () => {
      const [updated, session] = await Promise.all([
        api.updateUserGame(item.id, { playtime_hours: hours }),
        api.addSession(item.id, hours - item.playtime_hours),
      ]);
      replaceItem(updated);
      setSessions((list) => [...list, session]);
      return updated;
    });
  }

  function setGoal(target) {
    return run(async () => {
      await api.setGoal(year, target);
      setGoalState(target);
    }, 'Цель на год обновлена');
  }

  // Заполнить пустой аккаунт демо-играми (сервер делает это одним запросом)
  function importDemo() {
    return run(async () => {
      await api.importDemo();
      await reload();
    }, 'Демо-данные загружены');
  }

  const value = {
    library, sessions, goal, year, loading,
    addGame, updateGame, removeGame, changeHours, setGoal, importDemo, reload,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  return useContext(LibraryContext);
}
