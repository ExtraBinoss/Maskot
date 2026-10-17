import { useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  ArrowDownToLine,
  Check,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Maximize2,
  Pause,
  Play,
} from "lucide-react";
import {
  boardAtom,
  followAtom,
  frameAtom,
  lookAtom,
  playingAtom,
  speedAtom,
  stateAtom,
  statusAtom,
  surfaceAtom,
} from "../state/lab";
import { BeamySvg } from "../mascot/BeamySvg";
import { createMascotEngine, STATE_LABELS } from "../mascot/mascot-catalog";
import { SEQUENCE } from "../mascot/engine/states";
import {
  downloadBlob,
  mascotPng,
  serializeMascot,
} from "../mascot/mascot-export";
import { usePlayer } from "../mascot/PlayerProvider";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import s from "../styles/lab.module.css";

function LiveMascot({ svgRef }: { svgRef: React.Ref<SVGSVGElement> }) {
  const frame = useAtomValue(frameAtom);
  const look = useAtomValue(lookAtom);
  return (
    <BeamySvg
      ref={svgRef}
      frame={frame}
      color={look.color}
      blush={look.blush}
      size={380}
      label="Aperçu de la mascotte"
    />
  );
}

function PreviewBoard() {
  const look = useAtomValue(lookAtom);
  const player = usePlayer();
  const setBoard = useSetAtom(boardAtom);
  return (
    <div className={s.previewBoard} aria-label="Planche des mouvements">
      {SEQUENCE.map((id) => (
        <button
          key={id}
          onClick={() => {
            setBoard(false);
            player.choose(id);
          }}
        >
          <BeamySvg
            frame={createMascotEngine(look, id).sample(1.2)}
            color={look.color}
            blush={look.blush}
            size={80}
          />
          <span>{STATE_LABELS[id]}</span>
        </button>
      ))}
    </div>
  );
}

function Transport() {
  const [playing, setPlaying] = useAtom(playingAtom);
  const [speed, setSpeed] = useAtom(speedAtom);
  const [follow, setFollow] = useAtom(followAtom);
  const board = useAtomValue(boardAtom);
  const player = usePlayer();
  return (
    <div className={s.transportRow}>
      <div className={s.transport}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Mouvement précédent"
          onClick={() => player.next(-1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant={playing ? "secondary" : "default"}
          size="icon"
          disabled={board}
          aria-label={playing ? "Mettre en pause" : "Animer la mascotte"}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause /> : <Play />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Mouvement suivant"
          onClick={() => player.next(1)}
        >
          <ChevronRight />
        </Button>
        <select
          className={s.speed}
          value={speed}
          aria-label="Vitesse de lecture"
          onChange={(event) => setSpeed(Number(event.currentTarget.value))}
        >
          {[0.25, 0.5, 1, 1.5, 2].map((value) => (
            <option key={value} value={value}>
              {String(value).replace(".", ",")}×
            </option>
          ))}
        </select>
      </div>
      <label className={s.follow}>
        Suivre le curseur
        <Switch
          label="Suivre le curseur"
          checked={follow}
          disabled={board}
          onCheckedChange={setFollow}
        />
      </label>
    </div>
  );
}

export function Preview() {
  const [board, setBoard] = useAtom(boardAtom);
  const [surface, setSurface] = useAtom(surfaceAtom);
  const state = useAtomValue(stateAtom);
  const setStatus = useSetAtom(statusAtom);
  const [exporting, setExporting] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const player = usePlayer();
  const exportImage = async (format: "svg" | "png") => {
    if (!svgRef.current) return;
    setExporting(true);
    try {
      const text = serializeMascot(svgRef.current);
      const blob =
        format === "svg"
          ? new Blob([text], { type: "image/svg+xml" })
          : await mascotPng(text);
      downloadBlob(blob, `mascotlab-${state}.${format}`);
      setStatus(`${format.toUpperCase()} exporté avec un fond transparent.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "L’export a échoué.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <section className={`${s.panel} ${s.preview}`} aria-label="Aperçu">
      <div className={s.previewHeader}>
        <span>
          <i />
          {board ? "Tous ses petits talents" : STATE_LABELS[state]}
        </span>
        <div className={s.viewToggle}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Vue mascotte"
            aria-pressed={!board}
            onClick={() => setBoard(false)}
          >
            <Maximize2 />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Planche des mouvements"
            aria-pressed={board}
            onClick={() => setBoard(true)}
          >
            <Grid2X2 />
          </Button>
        </div>
      </div>
      <div
        className={s.stage}
        data-surface={surface}
        onPointerMove={(event) => {
          if (!board)
            player.aim(event, event.currentTarget.getBoundingClientRect());
        }}
        onPointerLeave={() => player.release()}
      >
        {board ? (
          <PreviewBoard />
        ) : (
          <div className={s.liveMascot} data-mascot-preview>
            <LiveMascot svgRef={svgRef} />
          </div>
        )}
        <div className={s.surfacePicker} aria-label="Fond de l’aperçu">
          {(
            [
              { id: "paper", label: "Fond clair" },
              { id: "dark", label: "Fond sombre" },
              { id: "transparent", label: "Fond transparent" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              className={s.surfaceChoice}
              data-surface={id}
              aria-label={label}
              aria-pressed={surface === id}
              onClick={() => setSurface(id)}
            />
          ))}
        </div>
        {!board && (
          <span className={s.stageNote}>
            Fait de courbes et d’un peu de magie.
          </span>
        )}
      </div>
      <Transport />
      <div className={s.exportRow}>
        <span>
          <Check size={13} />
          Prêt à emporter, fond transparent
        </span>
        <div>
          {(["svg", "png"] as const).map((format) => (
            <Button
              key={format}
              variant="ghost"
              size="sm"
              disabled={board || exporting}
              onClick={() => void exportImage(format)}
              aria-label={`Exporter en ${format.toUpperCase()}`}
            >
              <ArrowDownToLine />
              {format.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
