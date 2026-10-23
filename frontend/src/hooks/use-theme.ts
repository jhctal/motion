import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// One theme shared by every component using the hook, so the sidebar,
// mobile nav and auth pages never disagree
let current: Theme | null = null;
const listeners = new Set<() => void>();

function getTheme(): Theme {
  if (current === null) {
    current = getInitialTheme();
    document.documentElement.classList.toggle("dark", current === "dark");
  }
  return current;
}

function setTheme(theme: Theme) {
  current = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(STORAGE_KEY, theme);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme);

  function toggleTheme() {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  }

  return { theme, toggleTheme };
}

export default useTheme;
