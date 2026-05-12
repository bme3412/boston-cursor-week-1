"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

type Identity = {
  handle: string;
  pin: string;
} | null;

type IdentityContextValue = {
  identity: Identity;
  signIn: (handle: string, pin: string) => void;
  signOut: () => void;
};

const IdentityContext = createContext<IdentityContextValue>({
  identity: null,
  signIn: () => {},
  signOut: () => {},
});

const STORAGE_KEY = "shipyard-identity";

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.handle && parsed.pin) {
          setIdentity(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const signIn = useCallback((handle: string, pin: string) => {
    const id = { handle, pin };
    setIdentity(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(id));
  }, []);

  const signOut = useCallback(() => {
    setIdentity(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <IdentityContext.Provider value={{ identity, signIn, signOut }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  return useContext(IdentityContext);
}
