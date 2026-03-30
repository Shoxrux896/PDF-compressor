import { type Language } from "../i18n/translations";

interface Props {
    lang: Language;
    onToggle: () => void;
}

export function LanguageSwitch({ lang, onToggle }: Props) {
    return (
        <button
            className="icon-btn lang-btn"
            onClick={onToggle}
            aria-label="Toggle language"
        >
            {lang === 'en' ? 'RU' : (lang === 'ru' ? 'UZ' : 'EN')}
        </button>
    )
}
