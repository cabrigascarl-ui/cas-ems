import { createContext, useCallback, useMemo, useState } from 'react';

export const LoginModalContext = createContext(null);

export function LoginModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openLoginModal = useCallback(() => setIsOpen(true), []);
  const closeLoginModal = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, openLoginModal, closeLoginModal }), [isOpen, openLoginModal, closeLoginModal]);

  return <LoginModalContext.Provider value={value}>{children}</LoginModalContext.Provider>;
}
