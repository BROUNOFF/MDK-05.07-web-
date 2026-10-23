import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSupabase } from '../api';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../api/localDb';

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // login | register
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function validate() {
    if (mode === 'register' && name.trim().length < 2) return 'Введите имя (минимум 2 символа)';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Введите корректный email';
    if (password.length < 6) return 'Пароль должен быть не короче 6 символов';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setInfo('');
    const problem = validate();
    setError(problem);
    if (problem) return;

    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/');
      } else {
        const result = await signUp(email, password, name);
        if (result.needsConfirm) {
          setInfo('Мы отправили письмо для подтверждения. Подтвердите email и войдите.');
          setMode('login');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo() {
    setMode('login');
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError('');
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Левая половина — название и короткое описание сервиса */}
      <div className="hidden md:flex bg-black text-white flex-col justify-between p-12">
        <h1 className="text-xl font-bold tracking-widest uppercase">GameTrack</h1>
        <div>
          <p className="text-4xl font-bold leading-tight max-w-md">Все ваши игры — в одном списке.</p>
          <p className="text-neutral-400 mt-4 max-w-md">
            Ведите бэклог, отмечайте прогресс и наигранные часы, смотрите статистику и получайте достижения.
          </p>
        </div>
        <p className="text-xs text-neutral-500">Трекер бэклога и каталога игр · веб-версия</p>
      </div>

      {/* Правая половина — форма */}
      <div className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm" noValidate>
          <h2 className="text-2xl font-bold">{mode === 'login' ? 'Вход в систему' : 'Регистрация'}</h2>
          <p className="text-sm text-neutral-500 mt-1 mb-8">
            {mode === 'login' ? 'Войдите, чтобы открыть свою библиотеку' : 'Создайте аккаунт, чтобы вести свой бэклог'}
          </p>

          {mode === 'register' && (
            <div className="mb-4">
              <label className="label">Имя</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Сергей" />
            </div>
          )}
          <div className="mb-4">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="mb-6">
            <label className="label">Пароль</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Не менее 6 символов"
            />
          </div>

          {error && <p className="text-sm text-black bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-2 mb-4">{error}</p>}
          {info && <p className="text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 mb-4">{info}</p>}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="w-full text-sm text-neutral-600 hover:text-black mt-4"
          >
            {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>

          {/* Подсказка с демо-аккаунтом есть только в локальном режиме */}
          {!isSupabase && (
            <div className="mt-8 border border-dashed border-neutral-300 rounded-lg p-4 text-sm text-neutral-600">
              Демо-аккаунт с заполненной библиотекой:
              <br />
              <span className="font-mono text-black">{DEMO_EMAIL}</span> / <span className="font-mono text-black">{DEMO_PASSWORD}</span>
              <button type="button" onClick={fillDemo} className="block mt-2 underline hover:text-black">
                Подставить данные
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
