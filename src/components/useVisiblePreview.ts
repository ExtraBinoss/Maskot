import { useEffect, useRef, useState } from "react";

type Subscription = {
  observer: IntersectionObserver;
  callbacks: Map<Element, (visible: boolean) => void>;
};
let subscription: Subscription | null = null;
function observe(element: Element, callback: (visible: boolean) => void) {
  if (!subscription) {
    const callbacks = new Map<Element, (visible: boolean) => void>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          callbacks.get(entry.target)?.(entry.isIntersecting);
      },
      { rootMargin: "8px" },
    );
    subscription = { observer, callbacks };
  }
  const current = subscription;
  current.callbacks.set(element, callback);
  current.observer.observe(element);
  return () => {
    current.observer.unobserve(element);
    current.callbacks.delete(element);
    if (!current.callbacks.size) {
      current.observer.disconnect();
      if (subscription === current) subscription = null;
    }
  };
}

// The viewport root also respects every nested scrolling ancestor. An explicit
// inner-list root would keep sampling previews hidden above the inspector.
export function useVisiblePreview<T extends Element>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );
  useEffect(
    () =>
      typeof IntersectionObserver === "undefined"
        ? undefined
        : observe(ref.current!, setVisible),
    [],
  );
  return { ref, visible };
}
