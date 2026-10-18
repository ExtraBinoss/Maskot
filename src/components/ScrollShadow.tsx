import {
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentProps,
} from "react";
import { cn } from "cn";
import s from "../styles/settings.module.css";

export function ScrollShadow({
  children,
  label,
  className,
  axis = "vertical",
  ref: forwardedRef,
  ...props
}: ComponentProps<"div"> & {
  label: string;
  axis?: "vertical" | "horizontal";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useImperativeHandle(forwardedRef, () => ref.current!, []);
  useEffect(() => {
    const element = ref.current!;
    let frame = 0;
    const update = () => {
      frame = 0;
      const horizontal = axis === "horizontal";
      const offset = horizontal ? element.scrollLeft : element.scrollTop;
      const overflow = horizontal
        ? element.scrollWidth - element.clientWidth
        : element.scrollHeight - element.clientHeight;
      element.dataset.top = String(offset > 3);
      element.dataset.bottom = String(overflow - offset > 3);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    for (const child of element.children) resize.observe(child);
    update();
    element.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      element.removeEventListener("scroll", schedule);
    };
  }, [axis]);
  return (
    <div
      ref={ref}
      data-preview-scroll
      data-axis={axis}
      className={cn(s.scrollShadow, className)}
      role="region"
      aria-label={label}
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  );
}
