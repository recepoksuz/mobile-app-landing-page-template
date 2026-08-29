"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ConsentState = "granted" | "denied";

const STORAGE_KEY = "landing-consent";

/**
 * The snapshot carries both the visitor's decision and the "we haven't read it yet"
 * state. `"unknown"` is only ever seen on the server and at the moment of hydration;
 * while it holds, neither the banner is shown nor a pixel loaded — this is how we keep
 * the banner from flashing up for an instant at a visitor who has already decided.
 */
type Snapshot = ConsentState | "unset" | "unknown";

const listeners = new Set<() => void>();

/**
 * In environments where we cannot write to localStorage (private mode, storage turned
 * off), this remembers the decision at least for the duration of this page view.
 * Otherwise the banner would stay up even after "Decline" was clicked.
 */
let memoryValue: Snapshot | null = null;

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // A decision made in another tab has to apply in this tab too.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): Snapshot {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    // Storage cannot be read; fall back to the decision held in memory.
  }
  // If no decision has been made, no third-party script is loaded.
  return memoryValue ?? "unset";
}

function getServerSnapshot(): Snapshot {
  return "unknown";
}

type ConsentContextValue = {
  /** `null` = the visitor has not decided yet. In that state no pixel is loaded. */
  consent: ConsentState | null;
  /** False until localStorage has been read. Keeps the banner from showing too early. */
  hydrated: boolean;
  grant: () => void;
  deny: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const persist = useCallback((value: ConsentState) => {
    memoryValue = value;
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // If we cannot write, the preference only holds for this page view.
    }
    notify();
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent: snapshot === "granted" || snapshot === "denied" ? snapshot : null,
      hydrated: snapshot !== "unknown",
      grant: () => persist("granted"),
      deny: () => persist("denied"),
    }),
    [snapshot, persist],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) throw new Error("useConsent must be used inside a ConsentProvider");
  return context;
}

export { STORAGE_KEY as CONSENT_STORAGE_KEY };
