// Horizontal montage adapted from Bloub's Timeline / TimelineTrack (MIT).
import { useRef, useState, type PointerEvent } from "react";
import { useAtom, useAtomValue, useStore } from "jotai";
import { Pause, Play, Plus, X, ZoomIn } from "lucide-react";
import {
  activeStepAtom,
  boardAtom,
  durationAtom,
  elapsedAtom,
  lookAtom,
  playingAtom,
  sequencingAtom,
  timelineAtom,
} from "../state/lab";
import { STATE_LABELS, timelineDuration } from "../mascot/mascot-catalog";
import { SEQUENCE } from "../mascot/engine/states";
import type { StateId } from "../mascot/engine/bot-types";
import { usePlayer } from "../mascot/PlayerProvider";
import { MascotThumbnail } from "./MascotThumbnail";
import { VideoExport } from "./VideoExport";
import s from "../styles/motion.module.css";

const timeLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
function Playback() {
  const [playing, setPlaying] = useAtom(playingAtom);
  const elapsed = useAtomValue(elapsedAtom);
  const duration = useAtomValue(durationAtom);
  const sequencing = useAtomValue(sequencingAtom);
  const board = useAtomValue(boardAtom);
  const player = usePlayer();
  return (
    <div className={s.playback}>
      <span>{timeLabel(elapsed)}</span>
      <button
        className={s.playButton}
        disabled={board}
        aria-label={playing ? "Mettre en pause" : "Animer la mascotte"}
        onClick={() => {
          if (!sequencing) player.playSequence();
          else setPlaying(!playing);
        }}
      >
        {playing ? (
          <Pause size={17} fill="currentColor" />
        ) : (
          <Play size={17} fill="currentColor" />
        )}
      </button>
      <span>{timeLabel(duration)}</span>
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
  const elapsed = useAtomValue(elapsedAtom),
    duration = useAtomValue(durationAtom);
  const player = usePlayer();
  return (
    <input
      className={s.seek}
      type="range"
      aria-label="Position dans la séquence"
      min={0}
      max={duration}
      step={0.01}
      value={elapsed}
      onChange={(e) => player.seek(Number(e.currentTarget.value))}
    />
  );
}
function Counter() {
  const elapsed = useAtomValue(elapsedAtom),
    total = useAtomValue(durationAtom);
  return (
    <span className={s.counter}>
      {timeLabel(elapsed)} / {timeLabel(total)}
    </span>
  );
}
type Drag = {
  from: number;
  to: number;
  startX: number;
  dx: number;
  moved: boolean;
};

export default function SequenceEditor() {
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
  const [drag, setDrag] = useState<Drag | null>(null);
  const [zoom, setZoom] = useState(1);
  const scale = 48 * zoom,
    total = timelineDuration(steps);
  const offset = (index: number) => timelineDuration(steps.slice(0, index));
  const setDuration = (index: number, value: number) => {
    const duration = Math.round(Math.min(10, Math.max(0.6, value)) * 10) / 10;
    setSteps(
      store
        .get(timelineAtom)
        .map((step, i) => (i === index ? { ...step, duration } : step)),
    );
  };
  const focus = (index: number) =>
    requestAnimationFrame(() =>
      track.current
        ?.querySelector<HTMLButtonElement>(`[data-card="${index}"]`)
        ?.focus(),
    );
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= steps.length) return;
    const next = [...steps];
    const [step] = next.splice(from, 1);
    next.splice(to, 0, step);
    setSteps(next);
    player.seek(timelineDuration(next.slice(0, to)));
    focus(to);
  };
  const remove = (index: number) => {
    if (steps.length === 1) return;
    const next = steps.filter((_, i) => i !== index);
    setSteps(next);
    player.seek(Math.min(store.get(elapsedAtom), timelineDuration(next)));
    focus(Math.min(index, next.length - 1));
  };
  const onMove = (event: PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = event.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < 5) return;
    const box = track.current!.getBoundingClientRect();
    const seconds =
      (event.clientX - box.left + track.current!.scrollLeft) / scale;
    let end = 0,
      to = steps.length - 1;
    for (let i = 0; i < steps.length; i++) {
      end += steps[i].duration;
      if (seconds < end) {
        to = i;
        break;
      }
    }
    const next = { ...d, dx, to, moved: true };
    dragRef.current = next;
    setDrag(next);
    if (event.clientX > box.right - 25) track.current!.scrollLeft += 12;
    if (event.clientX < box.left + 25) track.current!.scrollLeft -= 12;
  };
  const tickStep = zoom >= 1.4 ? 1 : 2;
  return (
    <section className={s.timeline} aria-label="Chorégraphie">
      <Playback />
      <header className={s.timelineHeader}>
        <h2>
          Mon montage <span>{steps.length} mouvements · en boucle</span>
        </h2>
        <VideoExport />
      </header>
      <div
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
              const shifted = drag?.moved
                ? index === drag.from
                  ? drag.dx
                  : drag.to > drag.from && index > drag.from && index <= drag.to
                    ? -steps[drag.from].duration * scale
                    : drag.to < drag.from &&
                        index >= drag.to &&
                        index < drag.from
                      ? steps[drag.from].duration * scale
                      : 0
                : 0;
              return (
                <article
                  key={`${index}-${step.state}`}
                  className={s.step}
                  aria-current={
                    sequencing && active === index ? "step" : undefined
                  }
                  style={{
                    width: step.duration * scale,
                    transform: `translateX(${shifted}px)`,
                    zIndex: drag?.from === index ? 2 : undefined,
                  }}
                >
                  <button
                    className={s.card}
                    data-card={index}
                    aria-label={`Aller au mouvement ${index + 1} : ${STATE_LABELS[step.state]}`}
                    title={`${STATE_LABELS[step.state]} · ${step.duration} s`}
                    aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight ArrowLeft ArrowRight Delete"
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      dragRef.current = {
                        from: index,
                        to: index,
                        startX: e.clientX,
                        dx: 0,
                        moved: false,
                      };
                    }}
                    onPointerMove={onMove}
                    onPointerUp={() => {
                      const d = dragRef.current;
                      dragRef.current = null;
                      setDrag(null);
                      if (d?.moved) move(d.from, d.to);
                      else player.seek(offset(index));
                    }}
                    onPointerCancel={() => {
                      dragRef.current = null;
                      setDrag(null);
                    }}
                    onClick={(e) => {
                      if (e.detail === 0) player.seek(offset(index));
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
                    <span>{step.duration.toFixed(1).replace(".", ",")} s</span>
                    <span className="sr-only">{STATE_LABELS[step.state]}</span>
                  </button>
                  <button
                    className={s.remove}
                    aria-label={`Retirer le mouvement ${index + 1}`}
                    disabled={steps.length === 1}
                    onClick={() => remove(index)}
                  >
                    <X size={11} />
                  </button>
                  <button
                    className={s.resize}
                    role="slider"
                    aria-label={`Durée du mouvement ${index + 1}`}
                    aria-valuemin={0.6}
                    aria-valuemax={10}
                    aria-valuenow={step.duration}
                    aria-valuetext={`${step.duration} secondes`}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
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
                    }}
                    onPointerCancel={() => {
                      resizeRef.current = null;
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
                </article>
              );
            })}
            <label className={s.addCard}>
              <Plus size={18} />
              <select
                value=""
                aria-label="Ajouter un mouvement"
                disabled={steps.length >= 32}
                onChange={(e) => {
                  const state = e.currentTarget.value as StateId;
                  if (steps.length < 32 && SEQUENCE.includes(state)) {
                    setSteps([...steps, { state, duration: 2 }]);
                    player.seek(total);
                  }
                }}
              >
                <option value="" disabled>
                  Ajouter
                </option>
                {SEQUENCE.map((state) => (
                  <option key={state} value={state}>
                    {STATE_LABELS[state]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Cursor scale={scale} />
        </div>
      </div>
      <div className={s.timelineTools}>
        <span className={s.keyboardHint}>
          Glisser · étirer · Alt + ← → pour déplacer
        </span>
        <label className={s.zoom}>
          <ZoomIn size={13} />
          <input
            type="range"
            aria-label="Zoom de la timeline"
            min={0.5}
            max={2.5}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.currentTarget.value))}
          />
          <span>{Math.round(zoom * 100)} %</span>
        </label>
        <Counter />
        <button
          aria-label="Jouer la séquence"
          className={s.replay}
          onClick={player.playSequence}
        >
          <Play size={12} />
        </button>
      </div>
    </section>
  );
}
