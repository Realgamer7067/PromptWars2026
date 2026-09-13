import '../styles.css'
import './StudyPack.css'
import CitationButton from './CitationButton.jsx'

function citationsEqual(a, b) {
  if (!a || !b) return false
  const pageA = a.pageNumber ?? null
  const pageB = b.pageNumber ?? null
  const quoteA = a.quote ?? null
  const quoteB = b.quote ?? null
  return pageA === pageB && quoteA === quoteB
}

export default function StudyPack({
  concepts,
  activeConceptId,
  selectedCitation,
  onOpenCitation,
}) {
  const safeConcepts = concepts || []

  return (
    <div className="study-pack">
      {safeConcepts.map((concept) => (
        <section
          key={concept.id}
          id={`concept-${concept.id}`}
          tabIndex={-1}
          className={`study-pack__concept${
            activeConceptId === concept.id ? ' study-pack__concept--active' : ''
          }`}
        >
          <h2 className="study-pack__concept-title">{concept.title}</h2>
          <ul className="study-pack__bullets">
            {(concept.bullets || []).map((bullet, index) => (
              <li className="study-pack__bullet" key={index}>
                <span className="study-pack__bullet-text">{bullet.text}</span>
                <CitationButton
                  citation={bullet.citation}
                  label={concept.title}
                  onOpen={onOpenCitation}
                  selected={citationsEqual(bullet.citation, selectedCitation)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
