"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

type StorageKind = "localStorage" | "sessionStorage";
const changeEvent = "wasana-storage-change";
const serverSnapshot = () => undefined;

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

// String snapshots stay stable between reads; the server snapshot preserves hydration.
export function useBrowserStorage<T>(key: string, kind: StorageKind = "sessionStorage") {
  const getSnapshot = useCallback(() => {
    try {
      return window[kind].getItem(key);
    } catch {
      return null;
    }
  }, [key, kind]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const value = useMemo((): T | null => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, [raw]);
  return { value, isLoading: raw === undefined };
}

export function notifyBrowserStorageChange() {
  window.dispatchEvent(new Event(changeEvent));
}
