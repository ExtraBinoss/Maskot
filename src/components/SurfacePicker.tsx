import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { surfaceAtom } from "../state/lab";
import s from "../styles/settings.module.css";

export function SurfacePicker() {
  const { t } = useTranslation();

  const [surface, setSurface] = useAtom(surfaceAtom);
  return (
    <div className={s.surfaceRow}>
      <span>{t("Fond du canevas")}</span>
      <div className={s.surfaces}>
        {(
          [
            { id: "paper", label: t("Fond clair") },
            { id: "dark", label: t("Fond sombre") },
            { id: "transparent", label: t("Fond transparent") },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            data-surface={id}
            aria-label={t(label)}
            title={t(label)}
            aria-pressed={surface === id}
            onClick={() => setSurface(id)}
          />
        ))}
      </div>
    </div>
  );
}
