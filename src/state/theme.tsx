import { useEffect, useSyncExternalStore } from "react";
import { useAtomValue } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

type Theme = "system" | "light" | "dark";
const storage = createJSONStorage<Theme>(() => ({
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Theme still applies for this session. */
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* Storage may be unavailable. */
    }
  },
}));
export const themeAtom = atomWithStorage<Theme>(
  "mascotlab-theme",
  "system",
  storage,
  {
    getOnInit: true,
  },
);

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function useIsDark() {
  const theme = useAtomValue(themeAtom);
  const systemDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  return theme === "dark" || (theme !== "light" && systemDark);
}

export function ThemeSync() {
  const dark = useIsDark();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#1c1c1e" : "#f5f3f0");
  }, [dark]);
  return null;
}
