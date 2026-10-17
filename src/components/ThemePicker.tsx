import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { Monitor, Moon, Sun } from "lucide-react";
import { PreferenceGroup } from "./PreferenceGroup";
import { themeAtom } from "../state/theme";

export function ThemePicker() {
  const { t } = useTranslation();
  const [theme, setTheme] = useAtom(themeAtom);
  return (
    <PreferenceGroup
      label={t("Thème de l’interface")}
      value={theme}
      options={[
        {
          value: "system",
          label: t("Système"),
          ariaLabel: t("Thème système"),
          Icon: Monitor,
        },
        {
          value: "dark",
          label: t("Sombre"),
          ariaLabel: t("Thème sombre"),
          Icon: Moon,
        },
        {
          value: "light",
          label: t("Clair"),
          ariaLabel: t("Thème clair"),
          Icon: Sun,
        },
      ]}
      onChange={(value) => {
        if (value === "system" || value === "dark" || value === "light")
          setTheme(value);
      }}
    />
  );
}
