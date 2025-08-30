import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';

// 1. Create the context with a null initial value.
export const AuthContext = createContext<{ user: User | null }>({ user: null });

// 2. Hook to easily use the context in any component.
export const useAuth = () => useContext(AuthContext);
