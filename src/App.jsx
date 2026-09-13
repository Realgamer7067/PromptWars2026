import { useEffect, useReducer, useRef } from 'react'
import './styles.css'
import Sidebar from './components/Sidebar.jsx'
import UploadPanel from './components/UploadPanel.jsx'
import StudyPack from './components/StudyPack.jsx'
import QuizPlayer from './components/QuizPlayer.jsx'
import SourceDrawer from './components/SourceDrawer.jsx'
import { extractPdfPages } from './lib/pdf.js'
import { requestStudyPack } from './lib/api.js'
import { buildStudyPackMarkdown, downloadTextFile } from './lib/export.js'
import { listRecentPacks, saveRecentPack } from './lib/storage.js'

const initialAttempt = () => ({
  answersByQuestionId: {},
  submittedQuestionIds: {},
  currentQuestionIndex: 0,
})

const initialState = {
  packs: listRecentPacks(),
  activePackId: null,
  libraryOpen: false,
  view: 'upload', // 'upload' | 'notes' | 'practice'
  stage: 'idle', // 'idle' | 'reading' | 'generating' | 'error'
  errorMessage: null,
  file: null,
  selectedFileName: null,
  subject: 'general',
  pack: null,
  sourceFilename: null,
  omittedPages: [],
  activeConceptId: null,
  attempt: initialAttempt(),
  results: null,
  drawerCitation: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_FILE':
      return { ...state, file: action.file, selectedFileName: action.file.name, stage: 'idle', errorMessage: null }
    case 'SET_SUBJECT':
      return { ...state, subject: action.subject }
    case 'START_GENERATION':
      return { ...state, stage: 'reading', errorMessage: null }
    case 'EXTRACTED':
      return { ...state, stage: 'generating', omittedPages: action.omittedPages }
    case 'GENERATION_ERROR':
      return { ...state, stage: 'error', errorMessage: action.message }
    case 'GENERATION_SUCCESS':
      return {
        ...state,
        stage: 'idle',
        view: 'notes',
        pack: action.pack,
        sourceFilename: action.sourceFilename,
        activePackId: action.pack.id,
        attempt: initialAttempt(),
        results: null,
        activeConceptId: null,
        drawerCitation: null,
        libraryOpen: false,
      }
    case 'START_PRACTICE':
      return { ...state, view: 'practice' }
    case 'BACK_TO_NOTES':
      return { ...state, view: 'notes' }
    case 'SELECT_OPTION':
      return {
        ...state,
        attempt: {
          ...state.attempt,
          answersByQuestionId: { ...state.attempt.answersByQuestionId, [action.questionId]: action.optionIndex },
        },
      }
    case 'SUBMIT_ANSWER':
      return {
        ...state,
        attempt: {
          ...state.attempt,
          submittedQuestionIds: { ...state.attempt.submittedQuestionIds, [action.questionId]: true },
        },
      }
    case 'ADVANCE': {
      const isLast = state.attempt.currentQuestionIndex >= state.pack.quiz.length - 1
      if (!isLast) {
        return {
          ...state,
          attempt: { ...state.attempt, currentQuestionIndex: state.attempt.currentQuestionIndex + 1 },
          drawerCitation: null,
        }
      }
      const missedConceptIds = []
      const missedCitations = {}
      let score = 0
      for (const q of state.pack.quiz) {
        const selected = state.attempt.answersByQuestionId[q.id]
        if (selected === q.correctIndex) {
          score += 1
        } else {
          if (!(q.conceptId in missedCitations)) missedConceptIds.push(q.conceptId)
          missedCitations[q.conceptId] = missedCitations[q.conceptId] || q.citation
        }
      }
      return { ...state, results: { score, missedConceptIds, missedCitations }, drawerCitation: null }
    }
    case 'RETRY_PRACTICE':
      return { ...state, attempt: initialAttempt(), results: null, drawerCitation: null }
    case 'REVISIT':
      return { ...state, view: 'notes', activeConceptId: action.conceptId, drawerCitation: action.citation || null }
    case 'OPEN_CITATION':
      return { ...state, drawerCitation: action.citation }
    case 'CLOSE_DRAWER':
      return { ...state, drawerCitation: null }
    case 'TOGGLE_LIBRARY':
      return { ...state, libraryOpen: !state.libraryOpen }
    case 'CLOSE_LIBRARY':
      return { ...state, libraryOpen: false }
    case 'NEW_PACK':
      return {
        ...state,
        view: 'upload',
        stage: 'idle',
        errorMessage: null,
        file: null,
        selectedFileName: null,
        pack: null,
        activePackId: null,
        attempt: initialAttempt(),
        results: null,
        activeConceptId: null,
        drawerCitation: null,
        libraryOpen: false,
      }
    case 'LOAD_PACK':
      return {
        ...state,
        view: 'notes',
        activePackId: action.entry.id,
        pack: action.entry.pack,
        sourceFilename: action.entry.filename,
        subject: action.entry.subject || 'general',
        attempt: action.entry.attempt || initialAttempt(),
        results: action.entry.results || null,
        omittedPages: action.entry.omittedPages || [],
        activeConceptId: null,
        drawerCitation: null,
        libraryOpen: false,
      }
    case 'PACKS_UPDATED':
      return { ...state, packs: action.packs }
    default:
      return state
  }
}

function friendlyErrorFor(err) {
  if (err?.name === 'AbortError') return null
  if (err?.message) return err.message
  return 'Something went wrong. Please try again.'
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const requestIdRef = useRef(0)
  const abortControllerRef = useRef(null)

  async function runGeneration(file, subjectAtSubmit) {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    const requestId = ++requestIdRef.current

    dispatch({ type: 'START_GENERATION' })

    let extraction
    try {
      extraction = await extractPdfPages(file)
    } catch (err) {
      if (requestIdRef.current !== requestId) return
      dispatch({ type: 'GENERATION_ERROR', message: friendlyErrorFor(err) })
      return
    }
    if (requestIdRef.current !== requestId) return
    dispatch({ type: 'EXTRACTED', omittedPages: extraction.omittedPages })

    try {
      const response = await requestStudyPack(extraction.pageMap, subjectAtSubmit, { signal: controller.signal })
      if (requestIdRef.current !== requestId) return

      if (response.status === 'insufficient_content') {
        dispatch({ type: 'GENERATION_ERROR', message: response.reason || 'This document does not have enough usable content.' })
        return
      }

      const pack = {
        ...response.pack,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      }

      dispatch({ type: 'GENERATION_SUCCESS', pack, sourceFilename: file.name })

      const entry = {
        id: pack.id,
        title: pack.title,
        filename: file.name,
        subject: subjectAtSubmit,
        createdAt: pack.createdAt,
        pack,
        omittedPages: extraction.omittedPages,
        attempt: null,
        results: null,
      }
      saveRecentPack(entry)
      dispatch({ type: 'PACKS_UPDATED', packs: listRecentPacks() })
    } catch (err) {
      if (requestIdRef.current !== requestId) return
      const message = friendlyErrorFor(err)
      if (message) dispatch({ type: 'GENERATION_ERROR', message })
    }
  }

  function handleSubmit() {
    if (state.file) runGeneration(state.file, state.subject)
  }

  async function handleUseSample() {
    try {
      const res = await fetch('/sample-lecture.pdf')
      const blob = await res.blob()
      const file = new File([blob], 'sample-lecture.pdf', { type: 'application/pdf' })
      dispatch({ type: 'SELECT_FILE', file })
      runGeneration(file, state.subject)
    } catch {
      dispatch({ type: 'GENERATION_ERROR', message: 'Could not load the sample lecture. Please try uploading your own PDF.' })
    }
  }

  function handleNewPack() {
    abortControllerRef.current?.abort()
    dispatch({ type: 'NEW_PACK' })
  }

  function handleSelectPack(id) {
    const entry = state.packs.find((p) => p.id === id)
    if (!entry) return
    abortControllerRef.current?.abort()
    dispatch({ type: 'LOAD_PACK', entry })
  }

  function handleExport() {
    if (!state.pack) return
    const markdown = buildStudyPackMarkdown(state.pack, state.sourceFilename, state.omittedPages)
    downloadTextFile(`${state.pack.title || 'study-pack'}.md`, markdown)
  }

  function handleRevisit(conceptId) {
    const citation = state.results?.missedCitations?.[conceptId] || null
    dispatch({ type: 'REVISIT', conceptId, citation })
  }

  function handleOutlineClick(conceptId) {
    dispatch({ type: 'REVISIT', conceptId, citation: null })
  }

  useEffect(() => {
    if (!state.activeConceptId) return
    const el = document.getElementById(`concept-${state.activeConceptId}`)
    if (!el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    el.focus?.({ preventScroll: true })
  }, [state.activeConceptId, state.view])

  const conceptTitles = Object.fromEntries((state.pack?.concepts || []).map((c) => [c.id, c.title]))

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <img src="/logo.png" alt="" className="app-header__brand-mark" />
          <span className="app-header__brand-name">StudyForge</span>
        </div>
        <div className="app-header__actions">
          <button
            type="button"
            className="btn btn-secondary"
            aria-haspopup="true"
            aria-expanded={state.libraryOpen}
            onClick={() => dispatch({ type: 'TOGGLE_LIBRARY' })}
          >
            Study packs
          </button>
          {state.libraryOpen && (
            <>
              <div className="library-panel__backdrop" onClick={() => dispatch({ type: 'CLOSE_LIBRARY' })} />
              <Sidebar
                packs={state.packs}
                activePackId={state.activePackId}
                onSelectPack={handleSelectPack}
              />
            </>
          )}
          <button type="button" className="btn btn-primary" onClick={handleNewPack}>
            + New
          </button>
        </div>
      </header>

      {state.pack && (
        <div className="pack-context">
          <div className="pack-context__row">
            <div>
              <h1 className="pack-context__title">{state.pack.title}</h1>
              <p className="pack-context__meta">
                {state.sourceFilename} · {state.pack.concepts.length} concepts · {state.pack.quiz.length} questions
              </p>
              <nav className="pack-context__nav" aria-label="Study pack sections">
                <button
                  type="button"
                  className={`pack-context__nav-btn${state.view === 'notes' ? ' pack-context__nav-btn--active' : ''}`}
                  onClick={() => dispatch({ type: 'BACK_TO_NOTES' })}
                >
                  Notes
                </button>
                <button
                  type="button"
                  className={`pack-context__nav-btn${state.view === 'practice' ? ' pack-context__nav-btn--active' : ''}`}
                  onClick={() => dispatch({ type: 'START_PRACTICE' })}
                >
                  Practice · {state.pack.quiz.length} questions
                </button>
              </nav>
            </div>
            <div className="pack-context__actions">
              <button type="button" className="btn btn-secondary" onClick={handleExport}>
                Download study pack
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="app-content">
        {state.view === 'upload' && (
          <UploadPanel
            subject={state.subject}
            onSubjectChange={(subject) => dispatch({ type: 'SET_SUBJECT', subject })}
            onFileChosen={(file) => dispatch({ type: 'SELECT_FILE', file })}
            onSubmit={handleSubmit}
            onUseSample={handleUseSample}
            selectedFileName={state.selectedFileName}
            selectedFileSize={state.file?.size ?? null}
            canSubmit={Boolean(state.file)}
            stage={state.stage}
            errorMessage={state.errorMessage}
          />
        )}

        {state.view === 'notes' && state.pack && (
          <div className="content-with-source">
            <nav className="content-with-source__side notes-outline" aria-label="In this lecture">
              <p className="notes-outline__label">In this lecture</p>
              {state.pack.concepts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`notes-outline__item${state.activeConceptId === c.id ? ' notes-outline__item--active' : ''}`}
                  onClick={() => handleOutlineClick(c.id)}
                >
                  {c.title}
                </button>
              ))}
            </nav>
            <div className="content-with-source__main">
              <StudyPack
                concepts={state.pack.concepts}
                activeConceptId={state.activeConceptId}
                selectedCitation={state.drawerCitation}
                onOpenCitation={(citation) => dispatch({ type: 'OPEN_CITATION', citation })}
              />
            </div>
            <SourceDrawer
              citation={state.drawerCitation}
              filename={state.sourceFilename}
              onClose={() => dispatch({ type: 'CLOSE_DRAWER' })}
            />
          </div>
        )}

        {state.view === 'practice' && state.pack && (
          <div className="content-with-source">
            <div className="content-with-source__main">
              <QuizPlayer
                questions={state.pack.quiz}
                attempt={state.attempt}
                conceptTitles={conceptTitles}
                selectedCitation={state.drawerCitation}
                onSelectOption={(questionId, optionIndex) => dispatch({ type: 'SELECT_OPTION', questionId, optionIndex })}
                onSubmitAnswer={(questionId) => dispatch({ type: 'SUBMIT_ANSWER', questionId })}
                onNext={() => dispatch({ type: 'ADVANCE' })}
                onOpenCitation={(citation) => dispatch({ type: 'OPEN_CITATION', citation })}
                onBackToNotes={() => dispatch({ type: 'BACK_TO_NOTES' })}
                results={state.results}
                onRevisit={handleRevisit}
                onRetry={() => dispatch({ type: 'RETRY_PRACTICE' })}
              />
            </div>
            <SourceDrawer
              citation={state.drawerCitation}
              filename={state.sourceFilename}
              onClose={() => dispatch({ type: 'CLOSE_DRAWER' })}
            />
          </div>
        )}
      </main>
    </div>
  )
}
