import { ArrowUpRight, CodeXml } from "lucide-react";
import { m } from "motion/react";
import { ThemePicker } from "./ThemePicker";
import s from "../styles/about.module.css";

export default function About() {
  return (
    <m.section
      id="about"
      className={s.about}
      aria-label="À propos de Maskot"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={s.content}>
        <span className={s.tag}>A LITTLE CHARACTER STUDIO</span>
        <h2>
          Grok bot inspired.
          <br />
          <span>Made to be yours.</span>
        </h2>
        <p className={s.description}>
          Une silhouette, deux yeux, tout un caractère. Crée ton petit
          compagnon, trouve son regard et donne-lui vie.
        </p>
        <section className={s.preferences} aria-label="Préférences">
          <h3>Apparence</h3>
          <div className={s.themeRow}>
            <span>Le thème de l’atelier</span>
            <ThemePicker />
          </div>
        </section>
        <section className={s.links}>
          <h3>À propos</h3>
          <a
            href="https://github.com/ExtraBinoss/Maskot"
            target="_blank"
            rel="noreferrer"
          >
            <CodeXml size={17} />
            <span>Voir le projet sur GitHub</span>
            <ArrowUpRight size={14} />
          </a>
          <a href="https://plinka.eu" target="_blank" rel="noreferrer">
            <span>Un petit outil signé Plinka</span>
            <ArrowUpRight size={14} />
          </a>
        </section>
        <p className={s.credits}>
          Inspiré du Grok bot et de{" "}
          <a
            href="https://github.com/jeremy-prt/bloub"
            target="_blank"
            rel="noreferrer"
          >
            Bloub, par Jérémy Perret
          </a>
          . Moteur adapté de Beam.{" "}
          <a href="/licenses/NOTICE.txt" target="_blank" rel="noreferrer">
            Crédits & licences ↗
          </a>
        </p>
        <footer className={s.footer}>
          <p>
            Créé avec <span aria-label="amour">♥</span> par{" "}
            <a
              href="https://x.com/ExtraBinoss"
              target="_blank"
              rel="noreferrer"
            >
              @ExtraBinoss
            </a>
          </p>
          <a href="https://plinka.eu" target="_blank" rel="noreferrer">
            © {new Date().getFullYear()} Plinka <ArrowUpRight size={12} />
          </a>
        </footer>
      </div>
      <a
        className={s.wordmark}
        href="https://plinka.eu"
        target="_blank"
        rel="noreferrer"
        aria-label="Maskot, un projet Plinka"
      >
        maskot.
      </a>
    </m.section>
  );
}
