import { useEffect, useRef, type ReactNode } from "react";
import s from "../styles/settings.module.css";

export function ScrollShadow({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current!;
    const update = () => {
      element.dataset.top = String(element.scrollTop > 3);
      element.dataset.bottom = String(
        element.scrollTop + element.clientHeight < element.scrollHeight - 3,
      );
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    return () => {
      resize.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, []);
  return (
    <div
      ref={ref}
      data-preview-scroll
      className={s.scrollShadow}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
