import { useEffect, useRef } from "react";
import { useAtom, useAtomValue, useStore } from "jotai";
import { motion } from "motion/react";
import {
  ArrowUpFromLine,
  CodeXml,
  Download,
  FlaskConical,
  Monitor,
  Moon,
  MousePointer2,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react";
import { MovementCatalog } from "./components/MovementCatalog";
import { Preview } from "./components/Preview";
import { Appearance } from "./components/Appearance";
import { Timeline } from "./components/Timeline";
import { Button } from "./components/ui/button";
import {
  boardAtom,
  playingAtom,
  presetAtom,
  reducedMotionAtom,
  statusAtom,
} from "./state/lab";
import { themeAtom } from "./state/theme";
import { defaultPreset, parsePreset } from "./mascot/mascot-storage";
import { downloadBlob } from "./mascot/mascot-export";
import { usePlayer } from "./mascot/PlayerProvider";
import s from "./styles/lab.module.css";

function ThemePicker() {
  const [theme, setTheme] = useAtom(themeAtom);
  return (
    <div className={s.themePicker} aria-label="Thème de l’interface">
      {(
        [
          { id: "light", label: "Thème clair", Icon: Sun },
          { id: "system", label: "Thème système", Icon: Monitor },
          { id: "dark", label: "Thème sombre", Icon: Moon },
        ] as const
      ).map(({ id, label, Icon }) => (
        <Button
          key={id}
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={theme === id}
          onClick={() => setTheme(id)}
        >
          <Icon />
        </Button>
      ))}
    </div>
  );
}

function Feedback() {
  const status = useAtomValue(statusAtom);
  const reduced = useAtomValue(reducedMotionAtom);
  return (
    <div className={s.feedback}>
      {reduced && (
        <p>
          Les animations démarrent en pause selon ta préférence de mouvements
          réduits. Tu peux les lancer manuellement.
        </p>
      )}
      <p
        role="status"
        aria-label="Messages de l’atelier"
        aria-live="polite"
        aria-atomic="true"
      >
        {status}
      </p>
    </div>
  );
}

export function App() {
  const store = useStore();
  const player = usePlayer();
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        store.get(boardAtom)
      )
        return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          'button, a, input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="switch"], [role="slider"], [role="combobox"], [role="listbox"], [role="textbox"]',
        )
      )
        return;
      event.preventDefault();
      store.set(playingAtom, !store.get(playingAtom));
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [store]);
  const reset = () => {
    store.set(presetAtom, defaultPreset());
    player.choose("idle");
    store.set(statusAtom, "Le petit look de départ est de retour.");
  };
  const exportPreset = () => {
    try {
      downloadBlob(
        new Blob([JSON.stringify(store.get(presetAtom), null, 2)], {
          type: "application/json",
        }),
        "mascotlab-look.json",
      );
      store.set(statusAtom, "Look et chorégraphie exportés.");
    } catch {
      store.set(
        statusAtom,
        "Impossible d’exporter le look dans ce navigateur.",
      );
    }
  };
  const importPreset = async (input: HTMLInputElement) => {
    const selected = input.files?.[0];
    if (!selected) return;
    try {
      if (selected.size > 65536)
        throw new Error(
          "Ce fichier est trop volumineux pour un réglage de mascotte (64 Ko maximum).",
        );
      const imported = parsePreset(await selected.text());
      store.set(presetAtom, imported);
      player.choose("idle");
      store.set(statusAtom, "Look et chorégraphie importés.");
    } catch (error) {
      store.set(
        statusAtom,
        error instanceof Error
          ? error.message
          : "Impossible de lire ce fichier.",
      );
    } finally {
      input.value = "";
    }
  };
  return (
    <>
      <a className={s.skipLink} href="#atelier">
        Aller à l’atelier
      </a>
      <header className={s.topbar}>
        <a
          className={s.brand}
          href="https://plinka.eu"
          aria-label="Plinka, accueil"
        >
          <img src="/favicon.svg" alt="" />
          <span>
            plinka<span>.</span>
          </span>
        </a>
        <span className={s.headerDivider} />
        <span className={s.labTag}>
          <FlaskConical size={15} />
          MascotLab
        </span>
        <div className={s.headerActions}>
          <span className={s.localBadge}>
            <i />
            Un petit terrain de jeu
          </span>
          <ThemePicker />
        </div>
      </header>
      <main className={s.content} id="atelier">
        <motion.header
          className={s.intro}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <span className={s.eyebrow}>
              <Sparkles size={13} />
              LE LABORATOIRE DES PETITS COMPAGNONS
            </span>
            <h1>
              Un petit compagnon.
              <br />
              <span>Plein de personnalité.</span>
            </h1>
            <p>
              Donne-lui une forme, des étoiles dans les yeux et quelques petits
              mouvements.
            </p>
          </div>
          <div className={s.introActions}>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw />
              Repartir de zéro
            </Button>
            <Button variant="outline" onClick={exportPreset}>
              <Download />
              Exporter le look
            </Button>
          </div>
        </motion.header>
        <motion.div
          className={s.workspace}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <MovementCatalog />
          <Preview />
          <Appearance />
        </motion.div>
        <Timeline />
        <div className={s.bottomRow}>
          <p>
            <MousePointer2 size={14} />
            Clique sur un mouvement pour le tester. <kbd>Espace</kbd> pour faire
            une pause.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => file.current?.click()}
          >
            <ArrowUpFromLine />
            Importer un look
          </Button>
        </div>
        <Feedback />
        <footer className={s.footer}>
          <span>
            Un laboratoire Plinka · tes réglages restent dans ce navigateur.
          </span>
          <div>
            <a
              href="https://github.com/ExtraBinoss/MascotLab"
              target="_blank"
              rel="noreferrer"
            >
              <CodeXml size={13} />
              Code source
            </a>
            <a
              href="https://github.com/jeremy-prt/bloub"
              target="_blank"
              rel="noreferrer"
            >
              Inspiré de Bloub
            </a>
            <a href="/licenses/NOTICE.txt" target="_blank" rel="noreferrer">
              Crédits & licences
            </a>
          </div>
        </footer>
      </main>
      <input
        ref={file}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label="Importer un réglage de mascotte"
        onChange={(event) => void importPreset(event.currentTarget)}
      />
    </>
  );
}
