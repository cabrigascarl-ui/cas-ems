import { createContext, useEffect, useState } from 'react';
import { subscribeAuth, login as loginService, logout as logoutService } from '../services/auth.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email, password) {
    const loggedInUser = await loginService(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function logout() {
    await logoutService(user);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
