import { useState, useEffect, useRef, useCallback } from "react"
import { FileUploader } from "../components/FileUploader"
import { SortableImageGrid, type SortableFile } from "../components/SortableImageGrid"
import { imgToPdf, type PdfOptions } from "../utils/imgToPdf"
import { translations, type Language } from "../i18n/translations"
import { ThemeToggle } from "../components/ThemeToggle"
import { LanguageSwitch } from "../components/LanguageSwitch"
import { logVisit, logAction } from "../utils/analytics"
import { createThumbnail } from "../utils/imageUtils"

interface HomeProps {
    theme: 'dark' | 'light'
    lang: Language
    onToggleTheme: () => void
    onToggleLang: () => void
}

export function Home({ theme, lang, onToggleTheme, onToggleLang }: HomeProps) {
    const [items, setItems] = useState<SortableFile[]>([])
    const [quality, setQuality] = useState(70)
    const [progress, setProgress] = useState<number | null>(null)
    const [convertError, setConvertError] = useState<string | null>(null)
    const [filename, setFilename] = useState("compressed")
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [options, setOptions] = useState<PdfOptions>({
        pageSize: 'a4',
        orientation: 'portrait',
        margin: 'small',
        autoCrop: true
    })

    const t = translations[lang]
    const gridRef = useRef<HTMLDivElement>(null)

    // Analytics: Log visit on mount
    useEffect(() => {
        logVisit();
    }, []);


    // Track items in ref for cleanup on unmount
    const itemsRef = useRef(items);
    itemsRef.current = items;

    useEffect(() => {
        return () => {
            itemsRef.current.forEach(item => URL.revokeObjectURL(item.preview));
        }
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in input fields
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Delete/Backspace to remove selected image
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                e.preventDefault();
                handleRemove(selectedId);
                setSelectedId(null);
                return;
            }

            // R to rotate selected image
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                if (selectedId) {
                    handleRotate(selectedId);
                } else if (items.length > 0) {
                    // Rotate last item if nothing selected
                    handleRotate(items[items.length - 1].id);
                }
                return;
            }

            // Ctrl+Enter to convert
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (items.length > 0) {
                    handleConvert();
                }
                return;
            }

            // Arrow keys to navigate selection
            if (selectedId && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                e.preventDefault();
                const currentIndex = items.findIndex(item => item.id === selectedId);
                if (currentIndex !== -1) {
                    const newIndex = e.key === 'ArrowLeft' 
                        ? Math.max(0, currentIndex - 1)
                        : Math.min(items.length - 1, currentIndex + 1);
                    setSelectedId(items[newIndex].id);
                }
            }

            // Escape to clear selection
            if (e.key === 'Escape') {
                setSelectedId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, items, handleRemove, handleRotate]);

    const handleSelect = async (newFiles: File[]) => {
        // Process thumbnails asynchronously
        const newItemsPromises = newFiles.map(async (f) => ({
            id: crypto.randomUUID(),
            file: f,
            preview: await createThumbnail(f),
            rotation: 0
        }))

        const newItems = await Promise.all(newItemsPromises);

        setItems(prev => [...prev, ...newItems])
        logAction('upload', { count: newFiles.length });
    }

    const handleRemove = useCallback((id: string) => {
        setItems(prev => {
            const item = prev.find(i => i.id === id);
            if (item) URL.revokeObjectURL(item.preview);
            return prev.filter(item => item.id !== id)
        })
    }, [])

    const handleRotate = useCallback((id: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, rotation: (item.rotation + 90) % 360 }
            }
            return item
        }))
    }, [])

    const handleReset = useCallback(() => {
        setItems(prev => {
            prev.forEach(item => URL.revokeObjectURL(item.preview));
            return [];
        })
        setQuality(70)
        setProgress(null)
        setFilename("compressed")
        setOptions({ pageSize: 'a4', orientation: 'portrait', margin: 'small', autoCrop: true })
    }, [])

    async function handleConvert() {
        if (!items.length) return

        setProgress(0)
        setConvertError(null)
        logAction('convert', { count: items.length, quality, options });

        try {
            const pdfBytes = await imgToPdf(items, quality, options, (p) => setProgress(p))
            // Slice to exact bounds — avoids SharedArrayBuffer type mismatch and oversized blob
            const blob = new Blob([pdfBytes.slice(0)], { type: "application/pdf" })

            const objectUrl = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = objectUrl
            link.download = `${filename || 'compressed'}.pdf`
            // Append to DOM so Firefox triggers the download reliably
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(objectUrl)
        } catch (err) {
            console.error('Conversion failed:', err)
            setConvertError('Conversion failed. Please try again.')
        } finally {
            setProgress(null)
        }
    }

    return (
        <>
            <div className="top-nav" style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                <LanguageSwitch lang={lang} onToggle={onToggleLang} />
            </div>

            <div className="header-actions" style={{ justifyContent: 'center', position: 'relative' }}>
                <h1>{t.title}</h1>
                {items.length > 0 && (
                    <button className="reset-btn" onClick={handleReset} style={{ position: 'absolute', right: 0 }}>
                        ↺ {t.reset}
                    </button>
                )}
            </div>

            <p className="subtitle">
                {t.subtitle}
            </p>

            <div className="card">
                {items.length === 0 ? (
                    <FileUploader onSelect={handleSelect} lang={lang} />
                ) : (
                    <>
                        <SortableImageGrid
                            items={items}
                            onReorder={setItems}
                            onRemove={handleRemove}
                            onRotate={handleRotate}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            lang={lang}
                        />
                        <div className="add-more-container">
                            <small>{t.dragReorder} • </small>
                            <label className="add-more-label">
                                {t.addMore}
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files) handleSelect(Array.from(e.target.files))
                                        e.target.value = '' // reset so same files can be picked again
                                    }}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                        <div className="shortcuts-hint">
                            <small>
                                <strong>{t.shortcuts}:</strong> {t.shortcutDelete} | {t.shortcutRotate} | {t.shortcutConvert}
                            </small>
                        </div>
                    </>
                )}

                <div className="controls-section">
                    <div className="settings-group">
                        <h3>{t.settingsTitle}</h3>
                        <div className="settings-row">
                            <label>
                                <span>{t.pageSize}</span>
                                <select
                                    value={options.pageSize}
                                    onChange={e => setOptions({ ...options, pageSize: e.target.value as any })}
                                >
                                    <option value="a4">{t.format.a4}</option>
                                    <option value="letter">{t.format.letter}</option>
                                    <option value="auto">{t.format.auto}</option>
                                </select>
                            </label>

                            <label>
                                <span>{t.orientation}</span>
                                <select
                                    value={options.orientation}
                                    onChange={e => setOptions({ ...options, orientation: e.target.value as any })}
                                    disabled={options.pageSize === 'auto'}
                                >
                                    <option value="portrait">{t.orient.portrait}</option>
                                    <option value="landscape">{t.orient.landscape}</option>
                                </select>
                            </label>

                            <label>
                                <span>{t.margins}</span>
                                <select
                                    value={options.margin}
                                    onChange={e => setOptions({ ...options, margin: e.target.value as any })}
                                    disabled={options.pageSize === 'auto'}
                                >
                                    <option value="none">{t.margin.none}</option>
                                    <option value="small">{t.margin.small}</option>
                                    <option value="normal">{t.margin.normal}</option>
                                </select>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={options.autoCrop}
                                    onChange={e => setOptions({ ...options, autoCrop: e.target.checked })}
                                />
                                <span>{t.autoCrop}</span>
                            </label>
                        </div>
                    </div>

                    <div className="settings-group">
                        <h3>{t.exportTitle}</h3>
                        <div className="settings-stack">
                            <label>
                                <div className="label-row">
                                    <span>{t.quality}</span>
                                    <span className="value-tag">{quality}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={10}
                                    max={100}
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                />
                            </label>

                            <label>
                                <span>{t.filename}</span>
                                <div className="filename-input">
                                    <input
                                        type="text"
                                        value={filename}
                                        onChange={(e) => setFilename(e.target.value)}
                                        placeholder="compressed"
                                    />
                                    <span className="ext">.pdf</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>


                {convertError && (
                    <div className="convert-error">
                        {convertError}
                    </div>
                )}
                {progress !== null ? (
                    <div className="progress-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${progress}%` }}
                        >
                            <span className="progress-text">{progress}%</span>
                        </div>
                    </div>
                ) : (
                    <button className="convert-btn" onClick={handleConvert} disabled={!items.length}>
                        {items.length > 0 ? t.convert.replace('{{count}}', String(items.length)) : t.selectFirst}
                    </button>
                )}
            </div>

            <footer style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
                <p>© 2025 Shoxrux Industries</p>
            </footer>
        </>
    )
}
