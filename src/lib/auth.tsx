import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "qism-ibadah-auth";
const USERNAME = "jali";
const PASSWORD = "ibadah 2026";

interface AuthCtx {
  authed: boolean;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  ready: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthed(typeof window !== "undefined" && localStorage.getItem(KEY) === "1");
    setReady(true);
  }, []);

  const login = (u: string, p: string) => {
    if (u.trim().toLowerCase() === USERNAME && p === PASSWORD) {
      localStorage.setItem(KEY, "1");
      setAuthed(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setAuthed(false);
  };

  return <Ctx.Provider value={{ authed, login, logout, ready }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
