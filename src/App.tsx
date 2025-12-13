import { useState } from "react"
import { FileUploader } from "./components/FileUploader"
import { SortableImageGrid, type SortableFile } from "./components/SortableImageGrid"
import { imgToPdf, type PdfOptions } from "./utils/imgToPdf"
import { translations, type Language } from "./i18n/translations"
import { ThemeToggle } from "./components/ThemeToggle"
import { LanguageSwitch } from "./components/LanguageSwitch"

function App() {
  const [items, setItems] = useState<SortableFile[]>([])
  const [quality, setQuality] = useState(70)
  const [progress, setProgress] = useState<number | null>(null)
  const [filename, setFilename] = useState("compressed")
  const [options, setOptions] = useState<PdfOptions>({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 'small'
  })
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [lang, setLang] = useState<Language>('en')
  const t = translations[lang]

  const handleSelect = (newFiles: File[]) => {
    const newItems = newFiles.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      rotation: 0
    }))
    setItems(prev => [...prev, ...newItems])
  }

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const handleRotate = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, rotation: (item.rotation + 90) % 360 }
      }
      return item
    }))
  }

  const handleReset = () => {
    setItems([])
    setQuality(70)
    setProgress(null)
    setFilename("compressed")
    setOptions({ pageSize: 'a4', orientation: 'portrait', margin: 'small' })
  }

  async function handleConvert() {
    if (!items.length) return

    setProgress(0)
    try {
      const pdfBytes = await imgToPdf(items, quality, options, (p) => setProgress(p))
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" })

      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${filename || 'compressed'}.pdf`
      link.click()
    } finally {
      setProgress(null)
    }
  }

  return (
    <>
      <div className="top-nav" style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
        <ThemeToggle theme={theme} onToggle={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} />
        <LanguageSwitch lang={lang} onToggle={() => setLang(prev => prev === 'en' ? 'ru' : 'en')} />
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
            />
            <div className="add-more-container">
              <small>{t.dragReorder} • </small>
              <label className="add-more-label">
                {t.addMore}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleSelect(Array.from(e.target.files))}
                  style={{ display: 'none' }}
                />
              </label>
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
    </>
  )
}

export default App
