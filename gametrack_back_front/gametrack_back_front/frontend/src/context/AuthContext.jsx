import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // при открытии сайта проверяем, не вошёл ли пользователь раньше
  useEffect(() => {
    api.getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  async function signIn(email, password) {
    setUser(await api.signIn(email, password));
  }

  async function signUp(email, password, name) {
    setUser(await api.signUp(email, password, name));
  }

  async function signOut() {
    await api.signOut();
    setUser(null);
  }

  async function updateProfile(fields) {
    setUser(await api.updateProfile(fields));
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
