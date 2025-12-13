import { useEffect } from "react"

interface Props {
    theme: 'light' | 'dark'
    onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: Props) {
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'light') {
            root.setAttribute('data-theme', 'light');
        } else {
            root.removeAttribute('data-theme');
        }
    }, [theme])

    return (
        <button
            className="icon-btn"
            onClick={onToggle}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? '☀' : '☾'}
        </button>
    )
}
