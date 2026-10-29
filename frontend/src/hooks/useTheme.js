import { useCallback, useSyncExternalStore } from "react";

// Light/dark theme. The choice is saved in localStorage; the first time (nothing
// saved) we follow the OS setting. The theme itself is just data-theme="dark" on <html>,
// which switches the CSS variables in index.css.
const STORAGE_KEY = "manna-theme";
const listeners = new Set();

function readSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" || saved === "light" ? saved : null;
  } catch {
    return null; // storage blocked (private mode etc.)
  }
}

function systemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  listeners.forEach((notify) => notify());
}

// Called once in main.jsx before React renders, so the page never starts in the wrong theme.
export function initTheme() {
  apply(readSaved() ?? systemTheme());
}

function subscribe(notify) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

// Every component that calls this (NavBar, splash page) shares the same theme and re-renders together.
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light");

  const toggle = useCallback(() => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // can't save the choice; it still applies until the page is closed
    }
    apply(next);
  }, []);

  return { theme, toggle };
}
