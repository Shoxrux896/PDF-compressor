import { type Language, translations } from "../i18n/translations"

interface Props {
  onSelect: (files: File[]) => void
  lang: Language
}

export function FileUploader({ onSelect, lang }: Props) {
  const t = translations[lang]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onSelect(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="file-uploader">
      <label 
        className="upload-label"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
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
    </div>
  )
}
