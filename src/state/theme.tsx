import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
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
  const preference = useAtomValue(themeAtom);
  const initial = useRef(true);
  useLayoutEffect(() => {
    // useSyncExternalStore intentionally hydrates from its server snapshot.
    // Resolve system mode here so that snapshot never replaces the head's
    // correct dark background with a light frame during initial hydration.
    const resolvedDark =
      preference === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : dark;
    const apply = () => {
      document.documentElement.classList.toggle("dark", resolvedDark);
      document.documentElement.dataset.theme = resolvedDark ? "dark" : "light";
      document.documentElement.style.colorScheme = resolvedDark
        ? "dark"
        : "light";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", resolvedDark ? "#1c1c1e" : "#fbfbfd");
    };
    if (
      initial.current ||
      document.documentElement.classList.contains("dark") === resolvedDark ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      initial.current = false;
      apply();
      return;
    }
    if (document.startViewTransition) {
      const transition = document.startViewTransition(apply);
      void transition.ready.catch(() => {});
      void transition.finished.catch(() => {});
      return () => transition.skipTransition();
    }
    const root = document.documentElement;
    root.dataset.themeTransition = "";
    apply();
    const timer = window.setTimeout(() => {
      delete root.dataset.themeTransition;
    }, 1000);
    return () => {
      window.clearTimeout(timer);
      delete root.dataset.themeTransition;
    };
  }, [dark, preference]);
  return null;
}
