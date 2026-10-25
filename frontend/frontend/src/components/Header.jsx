import { Link } from "react-router-dom";
import { useLanguage, LANGUAGES } from "../i18n.jsx";

export default function Header() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="header">
      <Link to="/" className="logo">{t("appName")}</Link>
      <div className="spacer" />
      <div className="lang-switcher">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            className={`lang-btn ${lang === l.code ? "active" : ""}`}
            onClick={() => setLang(l.code)}
            aria-pressed={lang === l.code}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
