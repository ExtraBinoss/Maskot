import { useAtom } from "jotai";
import { surfaceAtom } from "../state/lab";
import s from "../styles/settings.module.css";

export function SurfacePicker() {
  const [surface, setSurface] = useAtom(surfaceAtom);
  return (
    <div className={s.surfaceRow}>
      <span>Fond du canevas</span>
      <div className={s.surfaces}>
        {(
          [
            { id: "paper", label: "Fond clair" },
            { id: "dark", label: "Fond sombre" },
            { id: "transparent", label: "Fond transparent" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            data-surface={id}
            aria-label={label}
            title={label}
            aria-pressed={surface === id}
            onClick={() => setSurface(id)}
          />
        ))}
      </div>
    </div>
  );
}
