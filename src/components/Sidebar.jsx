import './../styles.css'

export default function Sidebar({ packs, activePackId, onSelectPack }) {
  return (
    <div className="library-panel" role="menu" aria-label="Study packs">
      {packs.length === 0 ? (
        <p className="library-panel__empty">
          Your study packs will appear here after you generate one.
        </p>
      ) : (
        <>
          <p className="library-panel__label">Study packs</p>
          <ul className="library-panel__list">
            {packs.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="menuitem"
                  className={`library-item${p.id === activePackId ? ' library-item--active' : ''}`}
                  aria-current={p.id === activePackId ? 'true' : undefined}
                  onClick={() => onSelectPack(p.id)}
                >
                  <span className="library-item__title">{p.title}</span>
                  <span className="library-item__meta">{p.filename}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="library-panel__footnote">Saved on this browser</p>
    </div>
  )
}
