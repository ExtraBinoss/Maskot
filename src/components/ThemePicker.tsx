import { useAtom } from "jotai";
import { Monitor, Moon, Sun } from "lucide-react";
import { themeAtom } from "../state/theme";
import s from "../styles/workspace.module.css";

export function ThemePicker() {
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
        <button
          key={id}
          title={label}
          aria-label={label}
          aria-pressed={theme === id}
          onClick={() => setTheme(id)}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
