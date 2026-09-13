import { useRef, useState } from 'react'
import '../styles.css'
import './UploadPanel.css'
import { LIMITS } from '../../shared/studyPack.js'

const MAX_FILE_MB = Math.round(LIMITS.maxFileBytes / (1024 * 1024))

function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return null
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) {
    return `${mb.toFixed(1).replace(/\.0$/, '')} MB`
  }
  const kb = bytes / 1024
  return `${Math.max(1, Math.round(kb))} KB`
}

// Small, clearly labelled, static example of the output — not a second
// functioning study pack. See Frontend_plan.md section 5, "Example preview".
function SamplePreviewCard() {
  return (
    <div className="upload-preview-card">
      <p className="upload-preview-card__label">Example from sample lecture</p>
      <p className="upload-preview-card__heading">Durability</p>
      <p className="upload-preview-card__note">Committed changes survive a database crash.</p>
      <p className="upload-preview-card__source-label">Source passage · PDF p. 5</p>
      <p className="upload-preview-card__excerpt">
        &ldquo;once a transaction has been committed, its effects{' '}
        <mark>survive any subsequent crash, power loss, or restart</mark> of the database
        system.&rdquo;
      </p>
    </div>
  )
}

const FEATURES = [
  {
    key: 'checked',
    title: 'Every source checked',
    text: 'Each citation is matched against the exact page it names before it ever reaches you.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'practice',
    title: 'Five-question practice set',
    text: 'One quick check on the concepts from the same lecture, no extra setup.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 7.5h6M7 10.5h6M7 13.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'revisit',
    title: 'Mistakes lead somewhere',
    text: 'Miss a question and Revisit opens the exact note and passage that explains it.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M9 4.5L4 10l5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 10H15a1 1 0 0 0 1-1V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
]

function FeatureRow() {
  return (
    <ul className="upload-features">
      {FEATURES.map((f) => (
        <li key={f.key} className="upload-features__item">
          <span className="upload-features__icon">{f.icon}</span>
          <div>
            <p className="upload-features__title">{f.title}</p>
            <p className="upload-features__text">{f.text}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function UploadPanel({
  subject,
  onSubjectChange,
  onFileChosen,
  onSubmit,
  onUseSample,
  selectedFileName,
  selectedFileSize,
  canSubmit,
  stage,
  errorMessage,
}) {
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const isBusy = stage === 'reading' || stage === 'generating'

  function handleFileInputChange(event) {
    const file = event.target.files && event.target.files[0]
    event.target.value = ''
    if (file && !isBusy) {
      onFileChosen(file)
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragActive(false)
    if (isBusy) return
    const file = event.dataTransfer.files && event.dataTransfer.files[0]
    if (file) {
      onFileChosen(file)
    }
  }

  function handleDragOver(event) {
    event.preventDefault()
    if (isBusy) return
    setIsDragActive(true)
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setIsDragActive(false)
  }

  function handleChangeFileClick() {
    if (isBusy) return
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  function handleUseSample() {
    if (isBusy) return
    onUseSample()
  }

  const fileSizeLabel = formatFileSize(selectedFileSize)

  return (
    <div className="upload-screen">
      <div className="upload-screen__glow" aria-hidden="true" />
      <div className="page-container">
      <div className="upload-grid upload-grid--with-preview">
        <div className="upload-workspace">
          <div className="upload-header">
            <img src="/logo.png" alt="" className="upload-header__mark" />
            <h1 className="upload-header__title">Your lecture, ready to revise.</h1>
            <p className="upload-header__subtext">
              Upload a PDF for revision notes, practice, and source passages.
            </p>
          </div>

          {selectedFileName ? (
            <div
              className={`upload-dropzone${isBusy ? ' upload-dropzone--busy' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                className="upload-dropzone__input upload-dropzone__input--hidden"
                type="file"
                accept="application/pdf"
                onChange={handleFileInputChange}
                disabled={isBusy}
              />
              <div className="upload-dropzone__file">
                <p className="upload-dropzone__filename">{selectedFileName}</p>
                {fileSizeLabel && <p className="upload-dropzone__filesize">{fileSizeLabel}</p>}
                <button
                  type="button"
                  className="btn-text upload-dropzone__change"
                  onClick={handleChangeFileClick}
                  disabled={isBusy}
                >
                  Change file
                </button>
              </div>
            </div>
          ) : (
            <label
              className={`upload-dropzone${isDragActive ? ' upload-dropzone--active' : ''}${isBusy ? ' upload-dropzone--busy' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                className="upload-dropzone__input"
                type="file"
                accept="application/pdf"
                onChange={handleFileInputChange}
                disabled={isBusy}
              />
              <p className="upload-dropzone__text">Drop your lecture PDF here</p>
              <span className="upload-dropzone__choose">Choose PDF</span>
              <p className="upload-dropzone__limits">Text-based PDF · up to {MAX_FILE_MB} MB</p>
            </label>
          )}

          <label className="field-label">
            Subject style
            <select
              className="select"
              value={subject}
              onChange={(event) => onSubjectChange(event.target.value)}
              disabled={isBusy}
            >
              <option value="general">General</option>
              <option value="stem">STEM</option>
              <option value="humanities">Humanities</option>
              <option value="language">Language</option>
            </select>
          </label>

          {stage === 'error' && errorMessage && (
            <div className="error-banner" role="alert">
              {errorMessage}
            </div>
          )}

          {isBusy ? (
            <div className="upload-status" aria-live="polite">
              <span className="upload-spinner" aria-hidden="true" />
              <span className="status-line">
                {stage === 'reading' ? 'Reading your PDF' : 'Creating notes and checking sources'}
              </span>
            </div>
          ) : stage === 'error' ? (
            <div className="upload-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onSubmit}
                disabled={!canSubmit}
              >
                Retry
              </button>
              <button type="button" className="btn-text" onClick={handleUseSample}>
                Try a sample lecture
              </button>
            </div>
          ) : (
            <div className="upload-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={!canSubmit || isBusy}
              >
                Create study pack
              </button>
              <button type="button" className="btn-text" onClick={handleUseSample} disabled={isBusy}>
                Try a sample lecture
              </button>
            </div>
          )}
        </div>

        <SamplePreviewCard />
      </div>

      <FeatureRow />
      </div>
    </div>
  )
}
