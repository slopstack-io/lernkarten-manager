import { useState, useEffect, useCallback, useRef } from 'react'

const SAMPLE_CARDS = [
  { id: '1', front: 'Was ist React?', back: 'Eine JavaScript-Bibliothek für Benutzeroberflächen', category: 'Technik', learned: false },
  { id: '2', front: 'Was ist ein Hook?', back: 'Eine Funktion, die Zustand und Lifecycle in Funktionskomponenten nutzbar macht', category: 'Technik', learned: false },
  { id: '3', front: 'Hauptstadt von Frankreich?', back: 'Paris', category: 'Geografie', learned: false },
  { id: '4', front: 'Was ist Photosynthese?', back: 'Der Prozess, bei dem Pflanzen Lichtenergie in chemische Energie umwandeln', category: 'Biologie', learned: false },
  { id: '5', front: 'Was ist der ggT von 12 und 18?', back: '6', category: 'Mathe', learned: false },
  { id: '6', front: 'Wer schrieb Faust?', back: 'Johann Wolfgang von Goethe', category: 'Literatur', learned: false },
]

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export default function App() {
  // State
  const [cards, setCards] = useState(() => load('lernkarten_cards', SAMPLE_CARDS))
  const [view, setView] = useState('library') // library | study | create | categories
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const [studyIndex, setStudyIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [newCard, setNewCard] = useState({ front: '', back: '', category: '' })
  const [editingId, setEditingId] = useState(null)
  const [toast, setToast] = useState(null)

  // Persist
  useEffect(() => save('lernkarten_cards', cards), [cards])

  // Derived
  const categories = ['Alle', ...new Set(cards.map(c => c.category).filter(Boolean))]
  const filteredCards = selectedCategory === 'Alle' ? cards : cards.filter(c => c.category === selectedCategory)
  const unlearnedCards = filteredCards.filter(c => !c.learned)
  const studyDeck = unlearnedCards.length > 0 ? unlearnedCards : filteredCards
  const currentCard = studyDeck[studyIndex] || null
  const learnedCount = cards.filter(c => c.learned).length
  const progress = cards.length > 0 ? Math.round((learnedCount / cards.length) * 100) : 0

  // Toast helper
  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  // Card actions
  const addCard = useCallback(() => {
    if (!newCard.front.trim() || !newCard.back.trim()) return
    const card = {
      id: uid(),
      front: newCard.front.trim(),
      back: newCard.back.trim(),
      category: newCard.category.trim() || 'Allgemein',
      learned: false
    }
    setCards(prev => [...prev, card])
    setNewCard({ front: '', back: '', category: '' })
    showToast('Karte erstellt!')
  }, [newCard, showToast])

  const deleteCard = useCallback((id) => {
    setCards(prev => prev.filter(c => c.id !== id))
    showToast('Karte gelöscht')
  }, [showToast])

  const toggleLearned = useCallback((id) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, learned: !c.learned } : c))
  }, [])

  const startEdit = useCallback((card) => {
    setEditingId(card.id)
    setNewCard({ front: card.front, back: card.back, category: card.category })
  }, [])

  const saveEdit = useCallback(() => {
    if (!newCard.front.trim() || !newCard.back.trim()) return
    setCards(prev => prev.map(c =>
      c.id === editingId
        ? { ...c, front: newCard.front.trim(), back: newCard.back.trim(), category: newCard.category.trim() || 'Allgemein' }
        : c
    ))
    setEditingId(null)
    setNewCard({ front: '', back: '', category: '' })
    showToast('Karte aktualisiert!')
  }, [editingId, newCard, showToast])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setNewCard({ front: '', back: '', category: '' })
  }, [])

  // Study navigation
  const nextCard = useCallback(() => {
    setFlipped(false)
    setStudyIndex(prev => (prev + 1) % studyDeck.length)
  }, [studyDeck.length])

  const prevCard = useCallback(() => {
    setFlipped(false)
    setStudyIndex(prev => (prev - 1 + studyDeck.length) % studyDeck.length)
  }, [studyDeck.length])

  const markLearned = useCallback(() => {
    if (currentCard) {
      toggleLearned(currentCard.id)
      showToast('Als gelernt markiert ✓')
      if (studyIndex >= studyDeck.length - 1) {
        setStudyIndex(0)
        setFlipped(false)
      }
    }
  }, [currentCard, studyIndex, studyDeck.length, toggleLearned, showToast])

  const startStudy = useCallback(() => {
    setStudyIndex(0)
    setFlipped(false)
    setView('study')
  }, [])

  // Swipe support
  const touchStartRef = useRef(null)
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartRef.current
    if (Math.abs(diff) > 60) {
      if (diff > 0) prevCard()
      else nextCard()
    }
    touchStartRef.current = null
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>
          <span className="header-icon">🃏</span>
          {view === 'study' ? 'Lernen' : view === 'create' ? 'Erstellen' : 'Lernkarten'}
        </h1>
        <div className="header-actions">
          {view === 'library' && (
            <button className="icon-btn" onClick={() => setView('create')} title="Neue Karte">
              <span style={{ fontSize: '1.4rem' }}>+</span>
            </button>
          )}
          {view !== 'library' && (
            <button className="back-btn" onClick={() => setView('library')}>
              ← Zurück
            </button>
          )}
        </div>
      </header>

      <main className="content">
        {/* LIBRARY VIEW */}
        {view === 'library' && (
          <>
            {/* Stats */}
            <div className="stats-bar">
              <div className="stat">
                <span className="stat-num">{cards.length}</span>
                <span className="stat-label">Karten</span>
              </div>
              <div className="stat">
                <span className="stat-num">{learnedCount}</span>
                <span className="stat-label">Gelernt</span>
              </div>
              <div className="stat">
                <span className="stat-num">{progress}%</span>
                <span className="stat-label">Fortschritt</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Category Filter */}
            <div className="category-filter">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`cat-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                  {cat !== 'Alle' && (
                    <span className="cat-count">
                      {cards.filter(c => c.category === cat).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Study Button */}
            {filteredCards.length > 0 && (
              <button className="study-start-btn" onClick={startStudy}>
                <span className="study-icon">📖</span>
                <div>
                  <div className="study-title">Lernen starten</div>
                  <div className="study-sub">
                    {unlearnedCards.length} offene {unlearnedCards.length === 1 ? 'Karte' : 'Karten'}
                    {unlearnedCards.length === 0 && ' — Wiederholung!'}
                  </div>
                </div>
              </button>
            )}

            {/* Card List */}
            <div className="card-list">
              {filteredCards.map(card => (
                <div key={card.id} className={`card-item ${card.learned ? 'learned' : ''}`}>
                  <div className="card-item-content" onClick={() => startEdit(card)}>
                    <div className="card-item-front">{card.front}</div>
                    <div className="card-item-meta">
                      <span className="card-item-cat">{card.category}</span>
                      {card.learned && <span className="learned-badge">✓ Gelernt</span>}
                    </div>
                  </div>
                  <button
                    className="card-delete-btn"
                    onClick={(e) => { e.stopPropagation(); deleteCard(card.id) }}
                    title="Löschen"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {filteredCards.length === 0 && (
                <div className="empty-state">
                  <div className="empty-emoji">📭</div>
                  <p>Noch keine Karten{selectedCategory !== 'Alle' ? ` in "${selectedCategory}"` : ''}.</p>
                  <button className="create-first-btn" onClick={() => setView('create')}>
                    Erste Karte erstellen
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* STUDY VIEW */}
        {view === 'study' && (
          <div className="study-view">
            <div className="study-progress">
              <span>{studyIndex + 1} / {studyDeck.length}</span>
              <div className="study-progress-bar">
                <div
                  className="study-progress-fill"
                  style={{ width: `${((studyIndex + 1) / studyDeck.length) * 100}%` }}
                />
              </div>
            </div>

            {currentCard ? (
              <div
                className={`flashcard-container ${flipped ? 'flipped' : ''}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div className="flashcard" onClick={() => setFlipped(!flipped)}>
                  <div className="flashcard-face flashcard-front">
                    <div className="flashcard-label">Frage</div>
                    <div className="flashcard-text">{currentCard.front}</div>
                    <div className="flashcard-hint">Tippen zum Umdrehen</div>
                  </div>
                  <div className="flashcard-face flashcard-back">
                    <div className="flashcard-label">Antwort</div>
                    <div className="flashcard-text">{currentCard.back}</div>
                    <div className="flashcard-hint">Tippen für Frage</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-emoji">🎉</div>
                <h3>Alle Karten gelernt!</h3>
                <p>Du hast alle Karten in dieser Kategorie gemeistert.</p>
              </div>
            )}

            {currentCard && (
              <div className="study-controls">
                <button className="nav-btn" onClick={prevCard}>←</button>
                <button
                  className={`learn-btn ${currentCard.learned ? 'unlearn' : ''}`}
                  onClick={markLearned}
                >
                  {currentCard.learned ? '↩ Nochmal lernen' : '✓ Gelernt!'}
                </button>
                <button className="nav-btn" onClick={nextCard}>→</button>
              </div>
            )}

            {studyDeck.length > 0 && (
              <div className="study-stats">
                {studyDeck.filter(c => c.learned).length} von {studyDeck.length} gelernt
              </div>
            )}
          </div>
        )}

        {/* CREATE / EDIT VIEW */}
        {view === 'create' && (
          <div className="create-view">
            <h2 className="section-title">
              {editingId ? '✏️ Karte bearbeiten' : '✨ Neue Lernkarte'}
            </h2>
            <div className="create-form">
              <div className="form-group">
                <label>Vorderseite (Frage)</label>
                <textarea
                  placeholder="Was möchtest du lernen?"
                  value={newCard.front}
                  onChange={e => setNewCard(p => ({ ...p, front: e.target.value }))}
                  rows={3}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Rückseite (Antwort)</label>
                <textarea
                  placeholder="Die Antwort darauf..."
                  value={newCard.back}
                  onChange={e => setNewCard(p => ({ ...p, back: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Kategorie</label>
                <div className="category-input-row">
                  <input
                    placeholder="z.B. Mathe, Biologie..."
                    value={newCard.category}
                    onChange={e => setNewCard(p => ({ ...p, category: e.target.value }))}
                  />
                  <div className="quick-cats">
                    {['Technik', 'Sprachen', 'Mathe', 'Biologie', 'Allgemein'].map(cat => (
                      <button
                        key={cat}
                        className={`cat-chip-sm ${newCard.category === cat ? 'active' : ''}`}
                        onClick={() => setNewCard(p => ({ ...p, category: cat }))}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-actions">
                {editingId ? (
                  <>
                    <button className="cancel-btn" onClick={cancelEdit}>Abbrechen</button>
                    <button className="save-btn" onClick={saveEdit}>Speichern</button>
                  </>
                ) : (
                  <>
                    <button className="save-btn" onClick={addCard} style={{ width: '100%' }}>
                      ➕ Karte erstellen
                    </button>
                    {newCard.front && newCard.back && (
                      <button
                        className="save-another-btn"
                        onClick={() => { addCard(); setView('create'); }}
                      >
                        Erstellen & weitere Karte
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Preview */}
            {newCard.front && newCard.back && (
              <div className="card-preview">
                <div className="preview-label">Vorschau</div>
                <div className="preview-card">
                  <div className="preview-front"><strong>Q:</strong> {newCard.front}</div>
                  <div className="preview-back"><strong>A:</strong> {newCard.back}</div>
                  {newCard.category && <div className="preview-cat">{newCard.category}</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
