import { useTheme } from "../context/ThemeProvider";
import type { ThemePreference } from "../context/themeUtils";

const cyclePreference = (preference: ThemePreference): ThemePreference => {
  if (preference === "dark") return "light";
  if (preference === "light") return "system";
  return "dark";
};

const getAriaLabel = (
  preference: ThemePreference,
  resolved: "light" | "dark",
): string => {
  if (preference === "system") {
    return resolved === "dark"
      ? "Tema do sistema (escuro). Alternar tema"
      : "Tema do sistema (claro). Alternar tema";
  }

  return resolved === "dark"
    ? "Ativar modo claro"
    : "Ativar modo escuro";
};

export function ThemeToggle() {
  const { preference, resolved, setPreference } = useTheme();

  const handleToggle = () => {
    setPreference(cyclePreference(preference));
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={getAriaLabel(preference, resolved)}
      aria-pressed={resolved === "dark"}
      title={
        preference === "system"
          ? `Sistema (${resolved === "dark" ? "escuro" : "claro"})`
          : preference === "dark"
            ? "Escuro"
            : "Claro"
      }
      className="p-1.5 rounded text-sportsbook-muted hover:text-sportsbook-fg hover:bg-sportsbook-raised transition-colors"
    >
      {resolved === "dark" ? (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;
