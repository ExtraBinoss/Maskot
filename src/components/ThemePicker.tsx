import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { Monitor, Moon, Sun } from "lucide-react";
import { ButtonGroup } from "./ui/button-group";
import { Button } from "./ui/button";
import { themeAtom } from "../state/theme";
import s from "../styles/workspace.module.css";

export function ThemePicker() {
  const { t } = useTranslation();
  const [theme, setTheme] = useAtom(themeAtom);
  return (
    <ButtonGroup
      className={s.themePicker}
      aria-label={t("Thème de l’interface")}
    >
      {(
        [
          {
            id: "system",
            label: "Système",
            aria: "Thème système",
            Icon: Monitor,
          },
          { id: "dark", label: "Sombre", aria: "Thème sombre", Icon: Moon },
          { id: "light", label: "Clair", aria: "Thème clair", Icon: Sun },
        ] as const
      ).map(({ id, label, aria, Icon }) => (
        <Button
          variant="outline"
          key={id}
          aria-label={t(aria)}
          aria-pressed={theme === id}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            document.documentElement.style.setProperty(
              "--theme-x",
              `${rect.x + rect.width / 2}px`,
            );
            document.documentElement.style.setProperty(
              "--theme-y",
              `${rect.y + rect.height / 2}px`,
            );
            setTheme(id);
          }}
        >
          <Icon size={14} aria-hidden />
          <span>{t(label)}</span>
        </Button>
      ))}
    </ButtonGroup>
  );
}
