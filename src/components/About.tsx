import { ArrowUpRight, CodeXml } from "lucide-react";
import s from "../styles/about.module.css";

export default function About() {
  return (
    <div className={s.about}>
      <div className={s.intro}>
        <span className={s.tag}>A LITTLE CHARACTER STUDIO</span>
        <h3>
          Grok bot inspired.
          <br />
          <span>Made to be yours.</span>
        </h3>
        <p>
          Une silhouette, un regard, un peu de mouvement. Maskot est un atelier
          pour donner du caractère à tes petits compagnons.
        </p>
        <p>
          Change tout, essaie, recommence. Et emporte ton personnage avec toi.
        </p>
      </div>
      <div className={s.credits}>
        <h4>Une histoire de courbes</h4>
        <p>
          Inspiré de l’univers du Grok bot de xAI et de{" "}
          <a
            href="https://github.com/jeremy-prt/bloub"
            target="_blank"
            rel="noreferrer"
          >
            Bloub, par Jérémy Perret
            <ArrowUpRight size={11} />
          </a>
          . Le moteur de morphing et l’atelier viennent de Beam, adaptés pour le
          web par Plinka.
        </p>
        <p>
          Un projet indépendant, sans affiliation avec xAI. Tes créations et tes
          réglages restent dans ton navigateur.
        </p>
        <a
          className={s.sourceLink}
          href="https://github.com/ExtraBinoss/Maskot"
          target="_blank"
          rel="noreferrer"
        >
          <CodeXml size={14} />
          Le code est ouvert
          <ArrowUpRight size={12} />
        </a>
        <a
          className={s.licenseLink}
          href="/licenses/NOTICE.txt"
          target="_blank"
          rel="noreferrer"
        >
          Crédits & licences
          <ArrowUpRight size={11} />
        </a>
      </div>
      <footer className={s.footer}>
        <div className={s.footerRow}>
          <span>© {new Date().getFullYear()} Plinka</span>
          <a href="https://plinka.eu" target="_blank" rel="noreferrer">
            Explorer Plinka
            <ArrowUpRight size={11} />
          </a>
        </div>
        <p>
          Imaginé et construit par{" "}
          <a href="https://x.com/ExtraBinoss" target="_blank" rel="noreferrer">
            @ExtraBinoss
          </a>
        </p>
        <a
          className={s.footerWordmark}
          href="https://plinka.eu"
          target="_blank"
          rel="noreferrer"
          aria-label="Maskot, un projet Plinka"
        >
          maskot.
        </a>
      </footer>
    </div>
  );
}
