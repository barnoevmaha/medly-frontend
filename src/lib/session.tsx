import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, clearToken, getToken, type Me } from "@/lib/api";

interface Session {
  me: Me | null;
  loading: boolean;
  /** Re-fetch after anything that changes points or premium. */
  refresh: () => Promise<Me | null>;
  logout: () => void;
}

const SessionContext = createContext<Session>({
  me: null,
  loading: true,
  refresh: async () => null,
  logout: () => {},
});

/**
 * One `/api/auth/me` call for the whole app.
 *
 * Every page needed the current user — role, premium, points —
 * and each one fetching it separately meant four identical requests per
 * navigation and four chances for them to disagree.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setMe(null);
      setLoading(false);
      return null;
    }
    try {
      const user = await api.me();
      setMe(user);
      return user;
    } catch {
      setMe(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    clearToken();
    setMe(null);
    window.location.assign("/login");
  }, []);

  const value = useMemo(
    () => ({ me, loading, refresh, logout }),
    [me, loading, refresh, logout]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
