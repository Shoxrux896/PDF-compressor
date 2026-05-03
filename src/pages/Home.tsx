import { useState, useEffect, useCallback } from "react"
import { FileUploader } from "../components/FileUploader"
import { SortableImageGrid, type SortableFile } from "../components/SortableImageGrid"
import { imgToPdf, type PdfOptions } from "../utils/imgToPdf"
import { translations, type Language } from "../i18n/translations"
import { ThemeToggle } from "../components/ThemeToggle"
import { LanguageSwitch } from "../components/LanguageSwitch"
import { createThumbnail } from "../utils/imageUtils"

interface HomeProps {
    theme: 'dark' | 'light'
    lang: Language
    onToggleTheme: () => void
    onToggleLang: () => void
}

interface SavedSession {
    settings: PdfOptions
    quality: number
    filename: string
    fileNames: string[]
}

export function Home({ theme, lang, onToggleTheme, onToggleLang }: HomeProps) {
    const [items, setItems] = useState<SortableFile[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [quality, setQuality] = useState(70)
    const [progress, setProgress] = useState<number | null>(null)
    const [convertError, setConvertError] = useState<string | null>(null)
    const [filename, setFilename] = useState("compressed")
    const [isConverting, setIsConverting] = useState(false)

    const [options, setOptions] = useState<PdfOptions>({
        pageSize: 'a4',
        orientation: 'portrait',
        margin: 'small',
        autoCrop: true
    })

    const t = translations[lang]

    useEffect(() => {
        const saved = localStorage.getItem('pdf-compressor-session')
        if (saved) {
            try {
                const session: SavedSession = JSON.parse(saved)
                setOptions(session.settings)
                setQuality(session.quality)
                setFilename(session.filename)
            } catch (e) {
                console.error("Failed to load session", e)
            }
        }
    }, [])

    useEffect(() => {
        const session: SavedSession = {
            settings: options,
            quality,
            filename,
            fileNames: items.map(i => i.file.name)
        }
        localStorage.setItem('pdf-compressor-session', JSON.stringify(session))
    }, [options, quality, filename, items])

    useEffect(() => {
        return () => {
            items.forEach(item => URL.revokeObjectURL(item.preview))
        }
    }, [items])

    const handleSelect = async (newFiles: File[]) => {
        const newItemsPromises = newFiles.map(async (f) => ({
            id: crypto.randomUUID(),
            file: f,
            preview: await createThumbnail(f),
            rotation: 0
        }))
        const newItems = await Promise.all(newItemsPromises)
        setItems(prev => [...prev, ...newItems])
        if (navigator.vibrate) navigator.vibrate(50)
    }

    const handleRemove = useCallback((id: string) => {
        setItems(prev => {
            const item = prev.find(i => i.id === id)
            if (item) URL.revokeObjectURL(item.preview)
            return prev.filter(item => item.id !== id)
        })
        setSelectedId(prev => (prev === id ? null : prev))
        if (navigator.vibrate) navigator.vibrate(10)
    }, [])

    const handleRotate = useCallback((id: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, rotation: (item.rotation + 90) % 360 }
            }
            return item
        }))
        if (navigator.vibrate) navigator.vibrate(10)
    }, [])

    const handleReset = useCallback(() => {
        setItems(prev => {
            prev.forEach(item => URL.revokeObjectURL(item.preview))
            return []
        })
        setSelectedId(null)
        setProgress(null)
        setConvertError(null)
        setIsConverting(false)
    }, [])

    const clearSelection = () => setSelectedId(null)

    async function handleConvert() {
        if (!items.length) return
        setIsConverting(true)
        setProgress(0)
        setConvertError(null)

        try {
            const pdfBytes = await imgToPdf(items, quality, options, (p) => setProgress(p))
            const blob = new Blob([pdfBytes.slice(0)], { type: "application/pdf" })
            const objectUrl = URL.createObjectURL(blob)

            const link = document.createElement("a")
            link.href = objectUrl
            link.download = `${filename || 'compressed'}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(objectUrl)

            if (navigator.vibrate) navigator.vibrate([50, 50, 50])
        } catch (err) {
            console.error('Conversion failed:', err)
            setConvertError('Conversion failed. Please try again.')
        } finally {
            setProgress(null)
            setIsConverting(false)
        }
    }

    return (
        <>
            <div className="top-nav">
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                <LanguageSwitch lang={lang} onToggle={onToggleLang} />
            </div>

            <div className="header-actions">
                <h1>{t.title}</h1>
                {items.length > 0 && (
                    <button className="reset-btn" onClick={handleReset}>
                        ? {t.reset}
                    </button>
                )}
            </div>

            <p className="subtitle">{t.subtitle}</p>

            <div className="card">
                {items.length === 0 ? (
                    <FileUploader onSelect={handleSelect} lang={lang} />
                ) : (
                    <>
                        <div className="toolbar">
                            <div className="selection-info">
                                {selectedId ? `${t.selected}` : `${items.length} image${items.length === 1 ? '' : 's'}`}
                            </div>
                            {selectedId && (
                                <div className="toolbar-actions">
                                    <button onClick={clearSelection} className="tool-btn">
                                        {t.clear}
                                    </button>
                                    <button onClick={() => handleRemove(selectedId)} className="tool-btn danger">
                                        ?? {t.delete}
                                    </button>
                                </div>
                            )}
                        </div>

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
                            <label className="add-more-label">
                                + {t.addMore}
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files) handleSelect(Array.from(e.target.files))
                                        e.target.value = ''
                                    }}
                                />
                            </label>
                        </div>

                        <div className="shortcuts-hint">
                            <small>
                                <strong>{t.shortcuts}:</strong> {t.shortcutDelete} • {t.shortcutRotate} • {t.shortcutConvert}
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

                {convertError && <div className="convert-error">{convertError}</div>}

                {isConverting ? (
                    <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${progress || 0}%` }}>
                            <span className="progress-text">{progress}%</span>
                        </div>
                        <p className="loading-text">Processing...</p>
                    </div>
                ) : (
                    <button className="convert-btn" onClick={handleConvert} disabled={!items.length}>
                        {items.length > 0 ? t.convert.replace('{{count}}', String(items.length)) : t.selectFirst}
                    </button>
                )}
            </div>

            <footer>
                <p>© 2025 Shoxrux Industries</p>
            </footer>
        </>
    )
}
