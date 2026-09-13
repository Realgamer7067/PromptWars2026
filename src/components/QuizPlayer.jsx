import '../styles.css'
import './QuizPlayer.css'
import CitationButton from './CitationButton'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

function citationsEqual(a, b) {
  if (!a || !b) return false
  return a.pageNumber === b.pageNumber && a.quote === b.quote
}

function PracticeView({
  questions,
  attempt,
  conceptTitles,
  selectedCitation,
  onSelectOption,
  onSubmitAnswer,
  onNext,
  onOpenCitation,
  onBackToNotes,
}) {
  const currentIndex = attempt.currentQuestionIndex || 0
  const question = questions[currentIndex]

  if (!question) {
    return null
  }

  const answersByQuestionId = attempt.answersByQuestionId || {}
  const submittedQuestionIds = attempt.submittedQuestionIds || {}
  const selectedIndex = answersByQuestionId[question.id]
  const isSubmitted = question.id in submittedQuestionIds
  const hasSelection = selectedIndex !== undefined && selectedIndex !== null
  const isLastQuestion = currentIndex === questions.length - 1
  const conceptLabel = (conceptTitles && conceptTitles[question.conceptId]) || question.question

  return (
    <div className="quiz-player">
      <div className="quiz-player__context">
        <button type="button" className="btn btn-text quiz-player__back" onClick={onBackToNotes}>
          Back to notes
        </button>
      </div>

      <p className="quiz-player__progress">
        Question {currentIndex + 1} of {questions.length}
      </p>
      <h1 className="quiz-player__question">{question.question}</h1>

      <ul className="quiz-player__options">
        {(question.options || []).map((option, index) => {
          const isCorrectOption = index === question.correctIndex
          const isSelectedOption = index === selectedIndex

          let stateClass = ''
          if (isSubmitted) {
            if (isCorrectOption) {
              stateClass = 'quiz-option--correct'
            } else if (isSelectedOption) {
              stateClass = 'quiz-option--incorrect'
            }
          } else if (isSelectedOption) {
            stateClass = 'quiz-option--selected'
          }

          return (
            <li key={question.id + '-' + index}>
              <button
                type="button"
                className={`quiz-option ${stateClass}`}
                onClick={() => !isSubmitted && onSelectOption(question.id, index)}
                disabled={isSubmitted}
                aria-pressed={isSelectedOption}
              >
                <span className="quiz-option__marker" aria-hidden="true">
                  {OPTION_LETTERS[index]}
                </span>
                <span className="quiz-option__label">{option}</span>
                {isSubmitted && isCorrectOption && (
                  <span className="quiz-option__tag quiz-option__tag--correct">Correct answer</span>
                )}
                {isSubmitted && !isCorrectOption && isSelectedOption && (
                  <span className="quiz-option__tag quiz-option__tag--incorrect">Your answer</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {isSubmitted && (
        <div className="quiz-player__feedback">
          <p className="quiz-player__feedback-explanation">{question.explanation}</p>
          <CitationButton
            citation={question.citation}
            label={conceptLabel}
            onOpen={onOpenCitation}
            selected={citationsEqual(selectedCitation, question.citation)}
          />
        </div>
      )}

      <div className="quiz-player__actions">
        {!isSubmitted && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSubmitAnswer(question.id)}
            disabled={!hasSelection}
          >
            Submit answer
          </button>
        )}
        {isSubmitted && (
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {isLastQuestion ? 'See results' : 'Next'}
          </button>
        )}
      </div>
    </div>
  )
}

function ResultsView({ results, conceptTitles, onRevisit, onRetry, onBackToNotes }) {
  const score = results.score
  const missedConceptIds = results.missedConceptIds || []

  return (
    <div className="quiz-player">
      <h1 className="quiz-results__score">{score}/5 this attempt</h1>

      {score === 5 ? (
        <p className="quiz-results__summary">
          You answered all five correctly. Review the notes or retry the practice.
        </p>
      ) : (
        <>
          <p className="quiz-results__summary">Concepts to revisit:</p>
          <ul className="quiz-results__missed-list">
            {missedConceptIds.map((conceptId) => (
              <li className="quiz-results__missed-item" key={conceptId}>
                <span className="quiz-results__missed-title">
                  {(conceptTitles && conceptTitles[conceptId]) || conceptId}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onRevisit(conceptId)}
                >
                  Revisit
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="quiz-results__actions">
        <button type="button" className="btn btn-text" onClick={onBackToNotes}>
          Back to notes
        </button>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Retry practice
        </button>
      </div>
    </div>
  )
}

export default function QuizPlayer({
  questions,
  attempt,
  conceptTitles,
  selectedCitation,
  onSelectOption,
  onSubmitAnswer,
  onNext,
  onOpenCitation,
  onBackToNotes,
  results,
  onRevisit,
  onRetry,
}) {
  const safeQuestions = questions || []
  const safeConceptTitles = conceptTitles || {}

  if (results) {
    return (
      <ResultsView
        results={results}
        conceptTitles={safeConceptTitles}
        onRevisit={onRevisit}
        onRetry={onRetry}
        onBackToNotes={onBackToNotes}
      />
    )
  }

  return (
    <PracticeView
      questions={safeQuestions}
      attempt={
        attempt || {
          answersByQuestionId: {},
          submittedQuestionIds: {},
          currentQuestionIndex: 0,
        }
      }
      conceptTitles={safeConceptTitles}
      selectedCitation={selectedCitation || null}
      onSelectOption={onSelectOption}
      onSubmitAnswer={onSubmitAnswer}
      onNext={onNext}
      onOpenCitation={onOpenCitation}
      onBackToNotes={onBackToNotes}
    />
  )
}
