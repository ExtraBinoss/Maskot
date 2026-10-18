import { useTranslation } from "react-i18next";
import {
  animate,
  m,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
// Horizontal montage adapted from Bloub's Timeline / TimelineTrack (MIT).
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { useAtom, useAtomValue, useStore } from "jotai";
import { Pause, Play, Plus, X, Undo2, Redo2, GripVertical } from "lucide-react";
import {
  beginTimelineEditAtom,
  finishTimelineEditAtom,
  canUndoTimelineAtom,
  canRedoTimelineAtom,
  undoTimelineAtom,
  redoTimelineAtom,
  activeStepAtom,
  boardAtom,
  durationAtom,
  elapsedAtom,
  lookAtom,
  playingAtom,
  sequencingAtom,
  timelineAtom,
} from "../state/lab";
import { MOTION_LABELS, timelineDuration } from "../mascot/mascot-catalog";
import { usePlayer } from "../mascot/PlayerProvider";
import { MascotThumbnail } from "./MascotThumbnail";
import { MotionPicker } from "./MotionPicker";
import { useTimelineFollow } from "./use-timeline-follow";
import { VideoExport } from "./VideoExport";
import { ScrollShadow } from "./ScrollShadow";
import { Button } from "./ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverHeader,
} from "./ui/popover";
import s from "../styles/motion.module.css";

const timeLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
function Playback() {
  const { t } = useTranslation();

  const [playing, setPlaying] = useAtom(playingAtom);
  const elapsed = useAtomValue(elapsedAtom);
  const duration = useAtomValue(durationAtom);
  const sequencing = useAtomValue(sequencingAtom);
  const board = useAtomValue(boardAtom);
  const player = usePlayer();
  const store = useStore();
  const canUndo = useAtomValue(canUndoTimelineAtom);
  const canRedo = useAtomValue(canRedoTimelineAtom);
  return (
    <div
      className={s.playback}
      role="group"
      aria-label={t("Lecture et historique")}
    >
      <Button
        variant="ghost"
        size="icon"
        disabled={!canUndo}
        aria-label={t("Annuler la modification")}
        title={t("Annuler (Ctrl/⌘ Z)")}
        onClick={() => store.set(undoTimelineAtom)}
      >
        <Undo2 />
      </Button>
      <span>{timeLabel(elapsed)}</span>
      <m.button
        whileTap={{ scale: 0.95 }}
        className={s.playButton}
        disabled={board}
        aria-label={playing ? t("Mettre en pause") : t("Animer la mascotte")}
        onClick={() => {
          if (!sequencing) player.playSequence();
          else setPlaying(!playing);
        }}
      >
        {playing ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play className={s.playIcon} size={18} fill="currentColor" />
        )}
      </m.button>
      <span>{timeLabel(duration)}</span>
      <Button
        variant="ghost"
        size="icon"
        disabled={!canRedo}
        aria-label={t("Rétablir")}
        title={t("Rétablir (Ctrl/⌘ Maj Z)")}
        onClick={() => store.set(redoTimelineAtom)}
      >
        <Redo2 />
      </Button>
    </div>
  );
}
function Cursor({ scale }: { scale: number }) {
  const elapsed = useAtomValue(elapsedAtom);
  const sequencing = useAtomValue(sequencingAtom);
  return (
    <div
      className={s.cursor}
      style={{
        transform: `translateX(${(sequencing ? elapsed : 0) * scale}px)`,
      }}
    >
      <i />
    </div>
  );
}
function Seek() {
  const { t } = useTranslation();

  const elapsed = useAtomValue(elapsedAtom),
    duration = useAtomValue(durationAtom);
  const player = usePlayer();
  return (
    <input
      className={s.seek}
      type="range"
      aria-label={t("Position dans la séquence")}
      min={0}
      max={duration}
      step={0.01}
      value={elapsed}
      onChange={(e) => player.seek(Number(e.currentTarget.value))}
    />
  );
}
type PendingDrag = {
  from: number;
  pointerId: number;
  startX: number;
  startY: number;
  time: number;
  element: HTMLButtonElement;
};
type Drag = PendingDrag & {
  to: number;
  box: DOMRect;
  lastX: number;
  lastTime: number;
  velocity: number;
  settling: boolean;
  trackOrigin: number;
};
type DragView = Pick<Drag, "from" | "to" | "box" | "settling">;

export default function SequenceEditor() {
  const { t, i18n } = useTranslation();

  const [steps, setSteps] = useAtom(timelineAtom);
  const look = useAtomValue(lookAtom),
    active = useAtomValue(activeStepAtom),
    sequencing = useAtomValue(sequencingAtom);
  const store = useStore(),
    player = usePlayer();
  const track = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const resizeRef = useRef<{
    index: number;
    x: number;
    duration: number;
  } | null>(null);
  const [drag, setDrag] = useState<DragView | null>(null);
  const pending = useRef<PendingDrag | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const releasedPointer = useRef<number | null>(null);
  const animation = useRef<{ stop(): void }[]>([]);
  const dragX = useMotionValue(0),
    dragY = useMotionValue(0),
    tilt = useMotionValue(0);
  const dragTilt = useSpring(tilt, { stiffness: 350, damping: 26, mass: 0.6 });
  const reduced = useReducedMotion();
  const clearPending = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    pending.current = null;
  }, []);
  const cancelDrag = useCallback(() => {
    clearPending();
    for (const control of animation.current) control.stop();
    animation.current = [];
    const current = dragRef.current;
    dragRef.current = null;
    if (current?.element.hasPointerCapture(current.pointerId))
      current.element.releasePointerCapture(current.pointerId);
    dragX.set(0);
    dragY.set(0);
    tilt.set(0);
    setDrag(null);
    store.set(finishTimelineEditAtom, true);
  }, [clearPending, dragX, dragY, tilt, store]);
  useEffect(() => {
    const element = track.current!;
    const preventScroll = (event: TouchEvent) => {
      if (dragRef.current && !dragRef.current.settling && event.cancelable)
        event.preventDefault();
    };
    element.addEventListener("touchmove", preventScroll, {
      passive: false,
      capture: true,
    });
    window.addEventListener("resize", cancelDrag);
    const unsubscribe = store.sub(timelineAtom, () => {
      if (dragRef.current) cancelDrag();
    });
    return () => {
      element.removeEventListener("touchmove", preventScroll, true);
      window.removeEventListener("resize", cancelDrag);
      unsubscribe();
      cancelDrag();
    };
  }, [cancelDrag, store]);
  const [addOpen, setAddOpen] = useState(false);
  const scale = 48,
    total = timelineDuration(steps);
  const timelineBusy = useCallback(
    () => !!dragRef.current || !!resizeRef.current || !!pending.current,
    [],
  );
  useTimelineFollow(track, scale, timelineBusy);
  const offset = (index: number) => timelineDuration(steps.slice(0, index));
  const setDuration = (index: number, value: number) => {
    const duration = Math.round(Math.min(10, Math.max(0.6, value)) * 10) / 10;
    setSteps(
      store
        .get(timelineAtom)
        .map((step, i) => (i === index ? { ...step, duration } : step)),
    );
  };
  const focus = (index: number, preventScroll = false) =>
    requestAnimationFrame(() =>
      track.current
        ?.querySelector<HTMLButtonElement>(`[data-card="${index}"]`)
        ?.focus({ preventScroll }),
    );
  const move = (from: number, to: number, preventScroll = false) => {
    const current = store.get(timelineAtom);
    if (
      from === to ||
      from < 0 ||
      from >= current.length ||
      to < 0 ||
      to >= current.length
    )
      return;
    const next = [...current];
    const [step] = next.splice(from, 1);
    next.splice(to, 0, step);
    setSteps(next);
    player.seek(timelineDuration(next.slice(0, to)));
    focus(to, preventScroll);
  };
  const remove = (index: number) => {
    if (steps.length === 1) return;
    const next = steps.filter((_, i) => i !== index);
    setSteps(next);
    player.seek(Math.min(store.get(elapsedAtom), timelineDuration(next)));
    focus(Math.min(index, next.length - 1));
  };
  const beginDrag = (source: PendingDrag) => {
    clearPending();
    if (dragRef.current || !source.element.isConnected) return;
    const trackElement = track.current!;
    const trackOrigin =
      trackElement.getBoundingClientRect().left +
      parseFloat(getComputedStyle(trackElement).paddingLeft);
    const current: Drag = {
      ...source,
      to: source.from,
      box: source.element.getBoundingClientRect(),
      lastX: source.startX,
      lastTime: source.time,
      velocity: 0,
      settling: false,
      trackOrigin,
    };
    dragRef.current = current;
    source.element.setPointerCapture(source.pointerId);
    store.set(beginTimelineEditAtom);
    dragX.set(0);
    dragY.set(-10);
    tilt.set(0);
    setDrag({
      from: current.from,
      to: current.to,
      box: current.box,
      settling: false,
    });
  };
  const pointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    from: number,
    handle = false,
  ) => {
    if (event.button !== 0 || dragRef.current) return;
    const source = {
      from,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      time: event.timeStamp,
      element: event.currentTarget,
    };
    if (event.pointerType === "touch") {
      clearPending();
      pending.current = source;
      holdTimer.current = setTimeout(() => {
        if (pending.current === source) beginDrag(source);
      }, 320);
    } else if (handle) {
      event.preventDefault();
      event.stopPropagation();
      beginDrag(source);
    }
  };
  const onMove = (event: PointerEvent<HTMLButtonElement>) => {
    const waiting = pending.current;
    if (
      waiting &&
      event.pointerId === waiting.pointerId &&
      Math.hypot(
        event.clientX - waiting.startX,
        event.clientY - waiting.startY,
      ) > 8
    )
      clearPending();
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId || current.settling)
      return;
    event.preventDefault();
    const now = performance.now();
    current.velocity = Math.max(
      -1600,
      Math.min(
        1600,
        ((event.clientX - current.lastX) * 1000) /
          Math.max(1, now - current.lastTime),
      ),
    );
    current.lastX = event.clientX;
    current.lastTime = now;
    dragX.set(event.clientX - current.startX);
    dragY.set(event.clientY - current.startY - 10);
    tilt.set(
      reduced ? 0 : Math.max(-10, Math.min(10, current.velocity * 0.006)),
    );
    const seconds =
      (event.clientX - current.trackOrigin + track.current!.scrollLeft) / scale;
    let end = 0,
      to = steps.length - 1;
    for (let i = 0; i < steps.length; i++) {
      end += steps[i].duration;
      if (seconds < end) {
        to = i;
        break;
      }
    }
    if (to !== current.to) {
      current.to = to;
      setDrag({ from: current.from, to, box: current.box, settling: false });
    }
  };
  const pointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    clearPending();
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId || current.settling)
      return;
    releasedPointer.current = event.pointerId;
    current.settling = true;
    setDrag({ ...current });
    const destination =
      (current.from < current.to
        ? offset(current.to + 1) - offset(current.from + 1)
        : offset(current.to) - offset(current.from)) * scale;
    tilt.set(0);
    const options = reduced
      ? { duration: 0 }
      : {
          type: "spring" as const,
          stiffness: 550,
          damping: 38,
          velocity: current.velocity,
        };
    const x = animate(dragX, destination, options);
    const y = animate(
      dragY,
      0,
      reduced
        ? { duration: 0 }
        : { type: "spring", stiffness: 550, damping: 38 },
    );
    animation.current = [x, y];
    void Promise.all([x, y])
      .then(() => {
        if (dragRef.current !== current) return;
        dragRef.current = null;
        move(current.from, current.to, true);
        store.set(finishTimelineEditAtom);
        setDrag(null);
        dragX.set(0);
        dragY.set(0);
        tilt.set(0);
        animation.current = [];
      })
      .catch(cancelDrag);
  };
  const pointerCancel = () => {
    clearPending();
    if (dragRef.current && !dragRef.current.settling) cancelDrag();
  };
  const tickStep = 2;
  return (
    <m.section
      className={s.timeline}
      aria-label={t("Chorégraphie")}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {drag &&
        steps[drag.from] &&
        createPortal(
          <m.div
            className={s.floatingCard}
            aria-hidden="true"
            data-timeline-drag-preview=""
            initial={{ scale: 1 }}
            animate={{ scale: drag.settling ? 1 : 1.06 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            style={{
              position: "fixed",
              left: drag.box.left,
              top: drag.box.top,
              width: drag.box.width,
              height: drag.box.height,
              x: dragX,
              y: dragY,
              rotate: dragTilt,
            }}
          >
            <MascotThumbnail
              look={look}
              state={steps[drag.from].state}
              portrait={false}
              size={Math.min(
                60,
                Math.max(26, steps[drag.from].duration * scale * 0.55),
              )}
            />
            <span>
              {steps[drag.from].duration.toLocaleString(i18n.resolvedLanguage, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}{" "}
              s
            </span>
          </m.div>,
          document.body,
        )}
      <Playback />
      <header className={s.timelineHeader}>
        <h2>
          {t("Mon montage")}
          <span>
            {t("{{count}} mouvements · en boucle", { count: steps.length })}
          </span>
        </h2>
        <div className={s.desktopVideoExport}>
          <VideoExport />
        </div>
      </header>
      <ScrollShadow
        axis="horizontal"
        label={t("Mouvements du montage")}
        data-timeline-track=""
        className={s.track}
        ref={track}
        onWheel={(e) => {
          if (
            !e.ctrlKey &&
            !e.metaKey &&
            Math.abs(e.deltaY) > Math.abs(e.deltaX)
          )
            e.currentTarget.scrollLeft += e.deltaY;
        }}
      >
        <div
          className={s.trackContent}
          style={{ width: Math.max(total * scale + 76, 150) }}
        >
          <div className={s.ruler} style={{ width: total * scale }}>
            {Array.from(
              { length: Math.floor(total / tickStep) + 1 },
              (_, i) => (
                <span key={i} style={{ left: i * tickStep * scale }}>
                  {i * tickStep}s
                </span>
              ),
            )}
            <Seek />
          </div>
          <div className={s.cards}>
            {steps.map((step, index) => {
              const shifted =
                drag && index !== drag.from
                  ? drag.to > drag.from && index > drag.from && index <= drag.to
                    ? -steps[drag.from].duration * scale
                    : drag.to < drag.from &&
                        index >= drag.to &&
                        index < drag.from
                      ? steps[drag.from].duration * scale
                      : 0
                  : 0;
              return (
                <m.article
                  key={`${index}-${step.state}`}
                  className={s.step}
                  aria-current={
                    sequencing && active === index ? "step" : undefined
                  }
                  data-lifted={drag?.from === index ? "true" : undefined}
                  initial={false}
                  animate={{
                    x: shifted,
                    opacity: drag?.from === index ? 0.2 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  style={{ width: step.duration * scale }}
                >
                  <button
                    className={s.card}
                    data-card={index}
                    aria-label={t("Aller au mouvement {{index}} : {{label}}", {
                      index: index + 1,
                      label: t(MOTION_LABELS[step.state]),
                    })}
                    title={`${t(MOTION_LABELS[step.state])} · ${step.duration} s`}
                    aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight ArrowLeft ArrowRight Delete"
                    onPointerDown={(event) => pointerDown(event, index)}
                    onPointerMove={onMove}
                    onPointerUp={pointerUp}
                    onPointerCancel={pointerCancel}
                    onLostPointerCapture={pointerCancel}
                    onContextMenu={(event) => {
                      if (pending.current || dragRef.current)
                        event.preventDefault();
                    }}
                    onClick={(event) => {
                      if (
                        "pointerId" in event.nativeEvent &&
                        event.nativeEvent.pointerId === releasedPointer.current
                      )
                        return;
                      player.seek(offset(index));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                        e.preventDefault();
                        const direction = e.key === "ArrowLeft" ? -1 : 1;
                        if (e.altKey) move(index, index + direction);
                        else
                          player.seek(store.get(elapsedAtom) + direction * 0.1);
                      }
                      if (e.key === "Delete" || e.key === "Backspace") {
                        e.preventDefault();
                        remove(index);
                      }
                    }}
                  >
                    <MascotThumbnail
                      look={look}
                      state={step.state}
                      portrait={false}
                      size={Math.min(
                        60,
                        Math.max(26, step.duration * scale * 0.55),
                      )}
                    />
                    <span>
                      {step.duration.toLocaleString(i18n.resolvedLanguage, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}{" "}
                      s
                    </span>
                    <span className="sr-only">
                      {t(MOTION_LABELS[step.state])}
                    </span>
                  </button>
                  <Tooltip>
                    <TooltipTrigger
                      render={<button className={s.reorder} />}
                      aria-label={t("Déplacer le mouvement {{index}}", {
                        index: index + 1,
                      })}
                      onPointerDown={(event) => pointerDown(event, index, true)}
                      onPointerMove={onMove}
                      onPointerUp={pointerUp}
                      onPointerCancel={pointerCancel}
                      onLostPointerCapture={pointerCancel}
                    >
                      <GripVertical size={14} />
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("Glisser pour déplacer")}
                    </TooltipContent>
                  </Tooltip>
                  <button
                    className={s.remove}
                    aria-label={t("Retirer le mouvement {{index}}", {
                      index: index + 1,
                    })}
                    disabled={steps.length === 1}
                    onClick={() => remove(index)}
                  >
                    <X size={11} />
                  </button>
                  <button
                    className={s.resize}
                    role="slider"
                    aria-label={t("Durée du mouvement {{index}}", {
                      index: index + 1,
                    })}
                    aria-valuemin={0.6}
                    aria-valuemax={10}
                    aria-valuenow={step.duration}
                    aria-valuetext={t("{{count}} secondes", {
                      count: step.duration,
                    })}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      store.set(beginTimelineEditAtom);
                      resizeRef.current = {
                        index,
                        x: e.clientX,
                        duration: step.duration,
                      };
                    }}
                    onPointerMove={(e) => {
                      const r = resizeRef.current;
                      if (r)
                        setDuration(
                          r.index,
                          r.duration + (e.clientX - r.x) / scale,
                        );
                    }}
                    onPointerUp={() => {
                      resizeRef.current = null;
                      store.set(finishTimelineEditAtom);
                    }}
                    onPointerCancel={() => {
                      resizeRef.current = null;
                      store.set(finishTimelineEditAtom, true);
                    }}
                    onLostPointerCapture={() => {
                      if (resizeRef.current) {
                        resizeRef.current = null;
                        store.set(finishTimelineEditAtom, true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (
                        ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                          e.key,
                        )
                      ) {
                        e.preventDefault();
                        setDuration(
                          index,
                          e.key === "Home"
                            ? 0.6
                            : e.key === "End"
                              ? 10
                              : step.duration +
                                (e.key === "ArrowLeft" ? -0.1 : 0.1),
                        );
                      }
                    }}
                  />
                </m.article>
              );
            })}
            <Popover open={addOpen} onOpenChange={setAddOpen}>
              <PopoverTrigger
                render={
                  <button
                    className={s.addCard}
                    aria-label={t("Ajouter un mouvement")}
                    disabled={steps.length >= 32}
                  >
                    <Plus size={18} />
                  </button>
                }
              />
              <PopoverContent
                side="top"
                align="end"
                sideOffset={12}
                collisionPadding={8}
                className={`${s.addPopover} bg-popover/75 backdrop-blur-xl`}
              >
                <PopoverHeader>
                  <PopoverTitle>{t("Ajouter un mouvement")}</PopoverTitle>
                </PopoverHeader>
                <div className={s.addScroll}>
                  <MotionPicker
                    look={look}
                    onSelect={(state) => {
                      if (steps.length >= 32) return;
                      setSteps([...steps, { state, duration: 2 }]);
                      player.seek(total);
                      setAddOpen(false);
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Cursor scale={scale} />
        </div>
      </ScrollShadow>
      <div className={s.timelineTools}>
        <span className={s.keyboardHint}>
          {t("Glisser · étirer · Alt + ← → pour déplacer")}
        </span>
      </div>
    </m.section>
  );
}
