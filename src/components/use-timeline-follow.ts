import { useEffect, type RefObject } from "react";
import { useStore } from "jotai";
import { animate, useReducedMotion } from "motion/react";
import { elapsedAtom, playingAtom, sequencingAtom } from "../state/lab";

export function useTimelineFollow(
  track: RefObject<HTMLDivElement | null>,
  scale: number,
  busy: () => boolean,
) {
  const store = useStore();
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = track.current!;
    let width = 0,
      padding = 0,
      max = 0,
      manualUntil = 0;
    let scrolling: { stop(): void } | null = null;
    let previousTime = store.get(elapsedAtom);
    const stop = () => {
      scrolling?.stop();
      scrolling = null;
    };
    const resize = () => {
      width = element.clientWidth;
      padding = parseFloat(getComputedStyle(element).paddingLeft) || 0;
      max = Math.max(0, element.scrollWidth - width);
    };
    const follow = () => {
      const time = store.get(elapsedAtom);
      const looped = time < previousTime - 0.1;
      previousTime = time;
      if (!store.get(playingAtom) || !store.get(sequencingAtom)) {
        stop();
        return;
      }
      if (busy() || performance.now() < manualUntil || !width) return;
      if (looped) stop();
      if (scrolling) return;
      const x = padding + time * scale,
        left = element.scrollLeft;
      const margin = Math.min(64, width * 0.16);
      if (x >= left + margin && x <= left + width - margin) return;
      const target = Math.max(0, Math.min(max, x - width * 0.25));
      if (Math.abs(target - left) < 1) return;
      const control = animate(left, target, {
        duration: reduced ? 0 : 0.28,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (value) => {
          element.scrollLeft = value;
        },
      });
      scrolling = control;
      void Promise.resolve(control)
        .then(() => {
          if (scrolling === control) scrolling = null;
        })
        .catch(stop);
    };
    const manual = () => {
      manualUntil = performance.now() + 1800;
      stop();
    };
    const observer = new ResizeObserver(() => {
      resize();
      follow();
    });
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    resize();
    const subscriptions = [elapsedAtom, playingAtom, sequencingAtom].map(
      (atom) => store.sub(atom, follow),
    );
    element.addEventListener("pointerdown", manual, { passive: true });
    element.addEventListener("wheel", manual, { passive: true });
    element.addEventListener("touchend", manual, { passive: true });
    element.addEventListener("pointerup", manual, { passive: true });
    return () => {
      stop();
      observer.disconnect();
      subscriptions.forEach((unsubscribe) => unsubscribe());
      element.removeEventListener("pointerdown", manual);
      element.removeEventListener("wheel", manual);
      element.removeEventListener("touchend", manual);
      element.removeEventListener("pointerup", manual);
    };
  }, [store, scale, track, busy, reduced]);
}
