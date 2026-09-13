import { useEffect, useRef, useState } from 'react'
import '../styles.css'
import './SourceDrawer.css'

const WIDE_QUERY = '(min-width: 1100px)'
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function PageIcon() {
  return (
    <svg
      className="source-drawer__page-icon"
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 2.5h8v11l-4-2.6-4 2.6v-11z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function statusLabel(status) {
  if (status === 'located') return 'Passage located'
  if (status === 'not_found') return 'Passage not located in extracted text'
  if (status === 'invalid_page') return 'Page unavailable'
  return 'Source reference'
}

export default function SourceDrawer({ citation, filename, onClose }) {
  const [isWide, setIsWide] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(WIDE_QUERY).matches
      : true
  )
  const panelRef = useRef(null)
  const markRef = useRef(null)
  const returnFocusRef = useRef(null)

  // Track the responsive mode (docked vs modal) via matchMedia.
  useEffect(() => {
    if (!window.matchMedia) return undefined
    const mql = window.matchMedia(WIDE_QUERY)
    function handleChange(event) {
      setIsWide(event.matches)
    }
    setIsWide(mql.matches)
    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange)
      return () => mql.removeEventListener('change', handleChange)
    }
    // Older browsers.
    mql.addListener(handleChange)
    return () => mql.removeListener(handleChange)
  }, [])

  // Capture the element that had focus right before this citation opened,
  // so we can return focus to it when the drawer closes.
  useEffect(() => {
    if (citation) {
      returnFocusRef.current = document.activeElement
    }
  }, [citation])

  // Move focus into the panel when it opens in modal mode. In docked mode
  // the panel is just page content, so we leave focus wherever it was.
  useEffect(() => {
    if (citation && !isWide && panelRef.current) {
      panelRef.current.focus()
    }
  }, [citation, isWide])

  // Return focus to the triggering control when the drawer closes.
  useEffect(() => {
    if (citation) return undefined
    const target = returnFocusRef.current
    if (target && document.contains(target) && typeof target.focus === 'function') {
      target.focus()
    }
    returnFocusRef.current = null
    return undefined
  }, [citation])

  // Escape closes in both modes; Tab is trapped only in modal mode.
  useEffect(() => {
    if (!citation) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || isWide) return
      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last || !panel.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [citation, isWide, onClose])

  // Scroll the matched quote into view within the panel's own scroll
  // container, never the page/window. Kept unconditional (before the early
  // return below) so hook call order stays stable across renders.
  useEffect(() => {
    if (markRef.current) {
      markRef.current.scrollIntoView({ block: 'center' })
    }
  }, [citation])

  if (!citation) {
    return null
  }

  const { pageNumber, quote, matchStart, matchEnd, pageText, status } = citation

  const hasValidBounds =
    typeof pageText === 'string' &&
    typeof matchStart === 'number' &&
    typeof matchEnd === 'number' &&
    Number.isFinite(matchStart) &&
    Number.isFinite(matchEnd) &&
    matchStart >= 0 &&
    matchEnd <= pageText.length &&
    matchStart < matchEnd

  let bodyContent
  if (hasValidBounds) {
    bodyContent = (
      <p className="source-drawer__text" key={`${pageNumber}-${matchStart}-${matchEnd}`}>
        {pageText.slice(0, matchStart)}
        <mark ref={markRef} className="source-drawer__mark">
          {pageText.slice(matchStart, matchEnd)}
        </mark>
        {pageText.slice(matchEnd)}
      </p>
    )
  } else if (typeof pageText === 'string' && pageText.length > 0) {
    bodyContent = <p className="source-drawer__text">{pageText}</p>
  } else {
    bodyContent = <p className="source-drawer__text">{quote}</p>
  }

  const headingId = 'source-drawer-heading'

  const innerContent = (
    <>
      <div className="source-drawer__header">
        <div>
          <p className="source-drawer__filename" id={headingId}>
            {filename}
          </p>
          <p className="source-drawer__page">
            <PageIcon />
            PDF p.{pageNumber}
          </p>
          <p className="source-drawer__status">{statusLabel(status)}</p>
        </div>
        <button
          type="button"
          className="source-drawer__close"
          onClick={onClose}
          aria-label="Close source passage"
        >
          &times;
        </button>
      </div>
      <div className="source-drawer__body">
        <p className="source-drawer__caption">Extracted page text</p>
        {bodyContent}
      </div>
    </>
  )

  if (isWide) {
    return (
      <aside
        ref={panelRef}
        className="source-drawer source-drawer--docked"
        aria-labelledby={headingId}
      >
        {innerContent}
      </aside>
    )
  }

  return (
    <>
      <div className="source-drawer__backdrop" onClick={onClose} />
      <div
        ref={panelRef}
        className="source-drawer source-drawer--modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
      >
        {innerContent}
      </div>
    </>
  )
}

