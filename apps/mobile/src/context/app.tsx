import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { api, type Child, type User } from '@/services/api';

const tokenKey = 'ssukssuk_token';
const readToken = async () => Platform.OS === 'web' ? localStorage.getItem(tokenKey) : SecureStore.getItemAsync(tokenKey);
const writeToken = async (value: string | null) => {
  if (Platform.OS === 'web') { if (value) localStorage.setItem(tokenKey, value); else localStorage.removeItem(tokenKey); }
  else if (value) await SecureStore.setItemAsync(tokenKey, value);
  else await SecureStore.deleteItemAsync(tokenKey);
};
type AppContextValue = {
  loading: boolean; token: string | null; user: User | null; children: Child[]; selectedChild: Child | null;
  selectChild: (id: string) => void; refreshChildren: () => Promise<void>;
  authenticate: (mode: 'login' | 'register', values: { email: string; password: string; name?: string }) => Promise<void>;
  updateProfile: (values: { name: string }) => Promise<void>;
  logout: () => Promise<void>;
};
const AppContext = createContext<AppContextValue | null>(null);
export function AppProvider({ children: content }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const stored = await readToken();
      if (stored) {
        try {
          const me = await api<{ user: User }>('/me', { token: stored });
          const list = await api<{ children: Child[] }>('/children', { token: stored });
          setToken(stored); setUser(me.user); setChildren(list.children);
        } catch { await writeToken(null); }
      }
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);
  const refreshChildren = async () => {
    if (!token) return;
    const list = await api<{ children: Child[] }>('/children', { token });
    setChildren(list.children);
  };
  const authenticate = async (mode: 'login' | 'register', values: { email: string; password: string; name?: string }) => {
    const result = await api<{ user: User; token: string }>(`/auth/${mode}`, { method: 'POST', body: values });
    await writeToken(result.token);
    setToken(result.token); setUser(result.user);
    const list = await api<{ children: Child[] }>('/children', { token: result.token });
    setChildren(list.children); setSelectedId(null);
  };
  const updateProfile = async (values: { name: string }) => {
    if (!token) throw new Error('다시 로그인해 주세요.');
    const result = await api<{ user: User }>('/me', { method: 'PATCH', token, body: values });
    setUser(result.user);
  };
  const logout = async () => {
    if (token) { try { await api('/auth/logout', { method: 'POST', token }); } catch {} }
    await writeToken(null); setToken(null); setUser(null); setChildren([]); setSelectedId(null);
  };
  const selectedChild = children.find((child) => child.id === selectedId) ?? children[0] ?? null;
  return <AppContext.Provider value={{ loading, token, user, children, selectedChild, selectChild: setSelectedId, refreshChildren, authenticate, updateProfile, logout }}>{content}</AppContext.Provider>;
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('AppProvider가 필요합니다.');
  return value;
}
