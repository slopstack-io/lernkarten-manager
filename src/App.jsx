import { useState, useEffect, useCallback } from 'react'

// Storage
function load(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback } }
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

const SAMPLE_CARDS = [
  { id: '1', front: 'Was ist React?', back: 'Eine JavaScript-Bibliothek zum Erstellen von Benutzeroberflächen', category: 'Webentwicklung', learned: false },
  { id: '2', front: 'Was ist ein Service Worker?', back: 'Ein Skript, das im Hintergrund läuft und Offline-Funktionen ermöglicht', category: 'Webentwicklung', learned: false },
  { id: '3', front: 'Wie lautet die Hauptstadt von Frankreich?', back: 'Paris', category: 'Geografie', learned: false },
  { id: '4', front: 'Was ist Photosynthese?', back: 'Der Prozess, bei dem Pflanzen Sonnenlicht in Energie umwandeln', category: 'Biologie', learned: false },
  { id: '5', front: '2^10 = ?', back: '1024', category: 'Mathe', learned: false },
]

export default function App() {
  const [cards, setCards] = useState(() => load('lk_cards', SAMPLE_CARDS))
  const [view, setView] = useState('browse') // browse | create | study
  const [filterCat, setFilterCat] = useState('Alle')
  const [flipped, setFlipped] = useState({})
  const [studyIndex, setStudyIndex] = useState(0)
  const [studyFlipped, setStudyFlipped] = useState(false)
  const [newCard, setNewCard] = useState({ front: '', back: '', category: '' })

  useEffect(() => save('lk_cards', cards), [cards])

  const categories = ['Alle', ...new Set(cards.map(c => c.category))]
  const filtered = filterCat === 'Alle' ? cards : cards.filter(c => c.category === filterCat)
  const unlearned = filtered.filter(c => !c.learned)
  const learned = filtered.filter(c => c.learned)

  const addCard = useCallback(() => {
    if (!newCard.front.trim() || !newCard.back.trim()) return
    setCards(prev => [...prev, {
      id: Date.now().toString(),
      front: newCard.front.trim(),
      back: newCard.back.trim(),
      category: newCard.category.trim() || 'Allgemein',
      learned: false
    }])
    setNewCard({ front: '', back: '', category: '' })
    setView('browse')
  }, [newCard])

  const toggleLearned = useCallback((id) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, learned: !c.learned } : c))
  }, [])

  const deleteCard = useCallback((id) => {
    setCards(prev => prev.filter(c => c.id !== id))
  }, [])

  const toggleFlip = useCallback((id) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  // Study mode
  const startStudy = useCallback(() => {
    if (unlearned.length === 0) return
    setStudyIndex(0)
    setStudyFlipped(false)
    setView('study')
  }, [unlearned.length])

  const nextCard = useCallback(() => {
    if (studyIndex < unlearned.length - 1) {
      setStudyIndex(prev => prev + 1)
      setStudyFlipped(false)
    }
  }, [studyIndex, unlearned.length])

  const markLearned = useCallback(() => {
    if (unlearned[studyIndex]) {
      toggleLearned(unlearned[studyIndex].id)
      if (studyIndex < unlearned.length - 1) {
        setStudyIndex(prev => prev + 1)
        setStudyFlipped(false)
      } else {
        setView('browse')
      }
    }
  }, [studyIndex, unlearned, toggleLearned])

  return (
    <div className="app">
      <div className="header">
        <h1>🃏 Lernkarten</h1>
        <div className="header-actions">
          <button className="nav-btn" onClick={() => setView('create')}>+ Neu</button>
          {view !== 'study' && (
            <button className="nav-btn study-nav" onClick={startStudy} disabled={unlearned.length === 0}>
              Lernen ({unlearned.length})
            </button>
          )}
        </div>
      </div>

      <div className="content">
        {/* CREATE VIEW */}
        {view === 'create' && (
          <div className="create-view">
            <h2>Neue Lernkarte erstellen</h2>
            <div className="form-group">
              <label>Kategorie</label>
              <input
                placeholder="z.B. Mathe, Biologie..."
                value={newCard.category}
                onChange={e => setNewCard(p => ({ ...p, category: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Vorderseite (Frage)</label>
              <textarea
                placeholder="Was möchtest du lernen?"
                value={newCard.front}
                onChange={e => setNewCard(p => ({ ...p, front: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Rückseite (Antwort)</label>
              <textarea
                placeholder="Die Antwort..."
                value={newCard.back}
                onChange={e => setNewCard(p => ({ ...p, back: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setView('browse')}>Abbrechen</button>
              <button className="btn-primary" onClick={addCard} disabled={!newCard.front.trim() || !newCard.back.trim()}>
                Speichern
              </button>
            </div>
          </div>
        )}

        {/* STUDY VIEW */}
        {view === 'study' && unlearned[studyIndex] && (
          <div className="study-view">
            <div className="study-progress">
              {studyIndex + 1} / {unlearned.length}
            </div>
            <div className="study-card-wrapper">
              <div className={`study-card ${studyFlipped ? 'flipped' : ''}`} onClick={() => setStudyFlipped(!studyFlipped)}>
                <div className="study-card-face study-card-front">
                  <div className="study-label">Frage</div>
                  <div className="study-text">{unlearned[studyIndex].front}</div>
                  <div className="study-hint">Tippen zum Umdrehen</div>
                </div>
                <div className="study-card-face study-card-back">
                  <div className="study-label">Antwort</div>
                  <div className="study-text">{unlearned[studyIndex].back}</div>
                  <div className="study-category">{unlearned[studyIndex].category}</div>
                </div>
              </div>
            </div>
            <div className="study-actions">
              {studyFlipped && (
                <button className="btn-success" onClick={markLearned}>
                  ✅ Gelernt
                </button>
              )}
              {studyFlipped && studyIndex < unlearned.length - 1 && (
                <button className="btn-secondary" onClick={nextCard}>Weiter →</button>
              )}
              <button className="btn-secondary" onClick={() => setView('browse')}>Beenden</button>
            </div>
          </div>
        )}

        {view === 'study' && unlearned.length === 0 && (
          <div className="empty-state">
            <div className="emoji">🎉</div>
            <h2>Alle Karten gelernt!</h2>
            <p>Erstelle neue Karten oder setze gelernte Karten zurück.</p>
            <button className="btn-primary" onClick={() => setView('browse')}>Zurück</button>
          </div>
        )}

        {/* BROWSE VIEW */}
        {view === 'browse' && (
          <>
            {/* Category Filter */}
            <div className="category-bar">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`cat-btn ${filterCat === cat ? 'active' : ''}`}
                  onClick={() => setFilterCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="stats-bar">
              <div className="stat">
                <span className="stat-num">{filtered.length}</span>
                <span className="stat-label">Gesamt</span>
              </div>
              <div className="stat stat-learned">
                <span className="stat-num">{learned.length}</span>
                <span className="stat-label">Gelernt</span>
              </div>
              <div className="stat stat-open">
                <span className="stat-num">{unlearned.length}</span>
                <span className="stat-label">Offen</span>
              </div>
            </div>

            {/* Card List */}
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="emoji">📝</div>
                <h2>Noch keine Karten</h2>
                <p>Erstelle deine erste Lernkarte!</p>
                <button className="btn-primary" onClick={() => setView('create')}>+ Neue Karte</button>
              </div>
            ) : (
              <div className="card-list">
                {filtered.map(card => (
                  <div key={card.id} className={`card-item ${card.learned ? 'learned' : ''}`}>
                    <div className="card-flip-area" onClick={() => toggleFlip(card.id)}>
                      <div className="card-inner">
                        {!flipped[card.id] ? (
                          <div className="card-front">
                            <div className="card-cat-badge">{card.category}</div>
                            <div className="card-text">{card.front}</div>
                          </div>
                        ) : (
                          <div className="card-back">
                            <div className="card-text">{card.back}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className={`learn-btn ${card.learned ? 'undo' : ''}`}
                        onClick={() => toggleLearned(card.id)}
                      >
                        {card.learned ? '↩ Zurücksetzen' : '✓ Gelernt'}
                      </button>
                      <button className="delete-btn" onClick={() => deleteCard(card.id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
