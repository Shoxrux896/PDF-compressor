import { type Language, translations } from "../i18n/translations"

interface Props {
  onSelect: (files: File[]) => void
  lang: Language
}

export function FileUploader({ onSelect, lang }: Props) {
  const t = translations[lang]

  return (
    <div className="file-uploader">
      <label className="upload-label">
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden-input"
          onChange={(e) => {
            if (e.target.files) {
              onSelect(Array.from(e.target.files))
            }
          }}
        />
        <div className="upload-content">
          <span className="icon">📂</span>
          <span className="text">{t.uploadTitle}</span>
          <span className="hint">{t.uploadHint}</span>
        </div>
      </label>

      <style>{`
        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .upload-label:hover {
          border-color: var(--color-secondary);
          background: rgba(6, 182, 212, 0.05);
        }
        .hidden-input {
          display: none;
        }
        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .text {
          font-size: 1.2rem;
          font-weight: 500;
          color: var(--color-text);
        }
        .hint {
          font-size: 0.9rem;
          color: var(--color-text-dim);
        }
      `}</style>
    </div>
  )
}
