import { useEffect, useRef, useState } from "react";
import { MascotThumbnail } from "./MascotThumbnail";
import type { MascotLook } from "../mascot/mascot-types";

type Subscription = {
  observer: IntersectionObserver;
  callbacks: Map<Element, (visible: boolean) => void>;
};
const subscriptions = new WeakMap<Element, Subscription>();
function observe(element: HTMLElement, callback: (visible: boolean) => void) {
  const root = element.closest("[data-preview-scroll]")!;
  let subscription = subscriptions.get(root);
  if (!subscription) {
    const callbacks = new Map<Element, (visible: boolean) => void>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          callbacks.get(entry.target)?.(entry.isIntersecting);
      },
      { root, rootMargin: "8px" },
    );
    subscription = { observer, callbacks };
    subscriptions.set(root, subscription);
  }
  const current = subscription;
  current.callbacks.set(element, callback);
  current.observer.observe(element);
  return () => {
    current.observer.unobserve(element);
    current.callbacks.delete(element);
    if (!current.callbacks.size) {
      current.observer.disconnect();
      subscriptions.delete(root);
    }
  };
}

// The complete catalog remains keyboard-accessible; offscreen SVGs do no work.
export function VisibleMascotThumbnail({
  look,
  size = 47,
}: {
  look: MascotLook;
  size?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
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
  return (
    <span
      ref={ref}
      style={{ display: "block", width: size, height: size, flexShrink: 0 }}
    >
      {visible && <MascotThumbnail look={look} size={size} />}
    </span>
  );
}
