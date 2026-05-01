interface Props {
    theme: 'light' | 'dark'
    onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: Props) {
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
