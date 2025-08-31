import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';


export const AuthContext = createContext<{ user: User | null }>({ user: null });

export const useAuth = () => useContext(AuthContext);
