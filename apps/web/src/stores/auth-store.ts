import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: string;
  referralCode?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  /** remember=false keeps the session for this browser tab only ("Remember me" unticked). */
  setAuth: (user: User, accessToken: string, refreshToken: string, remember?: boolean) => void;
  /** New tokens from a silent refresh. */
  setTokens: (accessToken: string, refreshToken: string, user?: User) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

const STORAGE_KEY = "auth-storage";
const REMEMBER_KEY = "auth-remember";

function remembering() {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== "false";
  } catch {
    return true;
  }
}

/**
 * "Remember me" on → localStorage (survives closing the browser).
 * Off → sessionStorage (gone when the tab/browser closes).
 */
const authStorage: StateStorage = {
  getItem: (name) => {
    try {
      return sessionStorage.getItem(name) ?? localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      const [keep, drop] = remembering() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
      keep.setItem(name, value);
      drop.removeItem(name);
    } catch {
      /* storage unavailable (private mode): the session lives in memory only */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
      sessionStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

const signedOut = { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...signedOut,

      setAuth: (user, accessToken, refreshToken, remember = true) => {
        try {
          localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
        } catch {
          /* ignore */
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken, user) =>
        set((state) => ({ accessToken, refreshToken, user: user ?? state.user, isAuthenticated: true })),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      logout: () => set(signedOut),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => authStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }),
    }
  )
);

// Keep tabs in step: when another tab refreshes the session (the server rotates refresh
// tokens) or signs out, pick that up instead of carrying on with stale tokens.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || e.storageArea !== localStorage) return;
    if (e.newValue === null) useAuthStore.setState(signedOut);
    else void useAuthStore.persist.rehydrate();
  });
}
