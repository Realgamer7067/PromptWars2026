import '../styles.css'

function LocatedIcon() {
  return (
    <svg className="citation-btn__icon" width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 8.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MissingIcon() {
  return (
    <svg className="citation-btn__icon" width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 8h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Renders a citation as either an actionable "View source" control (when the
 * quote was located on its declared page) or a plain, honest "Source not
 * located" indicator. Shared by StudyPack (note bullets) and QuizPlayer
 * (question feedback) so both surfaces stay visually and semantically
 * consistent.
 */
export default function CitationButton({ citation, label, onOpen, selected }) {
  if (!citation || citation.status !== 'located') {
    return (
      <span className="citation-btn citation-btn--missing">
        <MissingIcon />
        Source not located
      </span>
    )
  }

  return (
    <button
      type="button"
      className={`citation-btn${selected ? ' citation-btn--selected' : ''}`}
      onClick={() => onOpen(citation)}
      aria-label={`View source for ${label}, PDF page ${citation.pageNumber}`}
    >
      <LocatedIcon />
      PDF p. {citation.pageNumber}
    </button>
  )
}
