import { useContext } from 'react';
import { LoginModalContext } from './LoginModalContext.jsx';

export function useLoginModal() {
  return useContext(LoginModalContext);
}
