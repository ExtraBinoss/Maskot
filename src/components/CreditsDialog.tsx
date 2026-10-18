import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollShadow } from "./ScrollShadow";
import s from "../styles/credits.module.css";

const credits = [
  {
    name: "Grok bot",
    href: "https://x.ai/",
    description:
      "The original character idea and visual inspiration for Maskot.",
  },
  {
    name: "Bloub",
    href: "https://github.com/jeremy-prt/bloub",
    description:
      "By Jérémy Perret. The foundation for the SVG morphing engine, movements and editor layout.",
    licenses: [{ name: "MIT", href: "/licenses/Bloub-MIT.txt" }],
  },
  {
    name: "Beam",
    href: "https://github.com/BeamRecorder/Beam",
    description:
      "The original mascot workshop, ported to React for Maskot. Its engine comes from Bloub.",
  },
  {
    name: "Thinking Orbs",
    href: "https://github.com/Jakubantalik/thinking-orbs",
    description: "By Jakub Antalik. Orb geometry and animation presets.",
    licenses: [{ name: "MIT", href: "/licenses/Thinking-Orbs-MIT.txt" }],
  },
  {
    name: "Mediabunny",
    href: "https://github.com/Vanilagy/mediabunny",
    description: "By Vanilagy. Video encoding and WebM export.",
    licenses: [{ name: "MPL-2.0", href: "/licenses/Mediabunny-MPL-2.0.txt" }],
  },
  {
    name: "ReUI",
    href: "https://reui.io/components/color-picker",
    description:
      "By Keenthemes. The color picker component adapted for Maskot.",
    licenses: [{ name: "MIT", href: "/licenses/ReUI-LICENSE.txt" }],
  },
  {
    name: "Space Grotesk",
    href: "https://github.com/floriankarsten/space-grotesk",
    description: "Heading typeface by the Space Grotesk project authors.",
    licenses: [{ name: "OFL-1.1", href: "/licenses/Space-Grotesk-OFL.txt" }],
  },
  {
    name: "Source Sans 3",
    href: "https://github.com/adobe-fonts/source-sans",
    description: "Interface typeface by the Source Sans project contributors.",
    licenses: [{ name: "OFL-1.1", href: "/licenses/Source-Sans-3-OFL.txt" }],
  },
  {
    name: "Octicons",
    href: "https://github.com/primer/octicons",
    description: "By GitHub. The GitHub mark used in About.",
    licenses: [{ name: "MIT", href: "/licenses/Octicons-MIT.txt" }],
  },
];

const tools = [
  { name: "React", href: "https://react.dev/" },
  { name: "shadcn/ui", href: "https://ui.shadcn.com/" },
  { name: "Base UI", href: "https://base-ui.com/" },
  { name: "Motion", href: "https://motion.dev/" },
  { name: "Jotai", href: "https://jotai.org/" },
  { name: "Tailwind CSS", href: "https://tailwindcss.com/" },
  { name: "Lucide", href: "https://lucide.dev/" },
];

export function CreditsDialog({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger className={triggerClassName} lang="en">
        Credits &amp; licenses
      </DialogTrigger>
      <DialogContent className={s.dialog} lang="en">
        <DialogHeader className={s.header}>
          <DialogTitle className={s.title}>Credits &amp; licenses</DialogTitle>
          <DialogDescription>
            The ideas, code and tools behind Maskot.
          </DialogDescription>
        </DialogHeader>
        <ScrollShadow label="Credits" className={s.body}>
          <ul className={s.credits}>
            {credits.map((credit) => (
              <li key={credit.name}>
                <div className={s.heading}>
                  <h3>
                    <a href={credit.href} target="_blank" rel="noreferrer">
                      {credit.name}
                    </a>
                  </h3>
                  {credit.licenses?.map((license) => (
                    <a
                      className={s.license}
                      key={license.href}
                      href={license.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${credit.name} ${license.name} license`}
                    >
                      {license.name}
                    </a>
                  ))}
                </div>
                <p>{credit.description}</p>
              </li>
            ))}
          </ul>
          <section className={s.tools} aria-label="Built with">
            <h3>Built with</h3>
            <ul>
              {tools.map((tool) => (
                <li key={tool.name}>
                  <a href={tool.href} target="_blank" rel="noreferrer">
                    {tool.name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <p className={s.note}>
            Maskot is an independent project, unaffiliated with xAI.
          </p>
        </ScrollShadow>
        <DialogFooter className={s.footer}>
          <a href="/licenses/Maskot-MIT.txt" target="_blank" rel="noreferrer">
            Maskot · MIT
          </a>
          <a
            href="https://github.com/ExtraBinoss/Maskot"
            target="_blank"
            rel="noreferrer"
          >
            Source code
          </a>
          <a href="/licenses/NOTICE.txt" target="_blank" rel="noreferrer">
            Full notices
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
