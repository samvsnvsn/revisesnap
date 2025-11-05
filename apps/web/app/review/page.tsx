"use client";
import { useEffect, useState } from "react";

type ReviewCard = {
  id: string;
  front: string;
  back: string;
  easeFactor: number; // 2.5 default
  interval: number; // days
  repetitions: number;
  nextReview: number; // timestamp
  materialId?: string;
};

type SessionStats = {
  reviewed: number;
  correct: number;
  wrong: number;
};

function loadCards(): ReviewCard[] {
  try { return JSON.parse(localStorage.getItem("rs_review_cards") || "[]"); }
  catch { return []; }
}

function saveCards(cards: ReviewCard[]) {
  localStorage.setItem("rs_review_cards", JSON.stringify(cards));
}

function getDueCards(cards: ReviewCard[]): ReviewCard[] {
  const now = Date.now();
  return cards.filter(c => c.nextReview <= now);
}

// SM-2 Algorithm (SuperMemo)
function calculateNextReview(card: ReviewCard, quality: number): ReviewCard {
  // quality: 0-5 (0=wrong, 5=perfect)
  let { easeFactor, interval, repetitions } = card;

  if (quality >= 3) {
    // Correct answer
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Wrong answer - reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return { ...card, easeFactor, interval, repetitions, nextReview };
}

export default function Review() {
  const [allCards, setAllCards] = useState<ReviewCard[]>([]);
  const [dueCards, setDueCards] = useState<ReviewCard[]>([]);
  const [currentCard, setCurrentCard] = useState<ReviewCard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ reviewed: 0, correct: 0, wrong: 0 });

  useEffect(() => {
    const cards = loadCards();
    setAllCards(cards);
    const due = getDueCards(cards);
    setDueCards(due);
    if (due.length > 0) {
      setCurrentCard(due[0]);
    }
  }, []);

  function answer(quality: number) {
    if (!currentCard) return;

    const isCorrect = quality >= 3;
    const updated = calculateNextReview(currentCard, quality);

    // Update cards
    const newCards = allCards.map(c => c.id === updated.id ? updated : c);
    setAllCards(newCards);
    saveCards(newCards);

    // Update stats
    const newStats = {
      reviewed: stats.reviewed + 1,
      correct: stats.correct + (isCorrect ? 1 : 0),
      wrong: stats.wrong + (isCorrect ? 0 : 1)
    };
    setStats(newStats);

    // Record session
    recordSession();

    // Next card
    const remaining = dueCards.filter(c => c.id !== currentCard.id);
    setDueCards(remaining);
    if (remaining.length > 0) {
      setCurrentCard(remaining[0]);
      setShowAnswer(false);
    } else {
      setCurrentCard(null);
    }
  }

  function recordSession() {
    // Save to weekly goal tracking
    const today = new Date().toISOString().split('T')[0];
    const sessions = JSON.parse(localStorage.getItem("rs_review_sessions") || "{}");
    sessions[today] = (sessions[today] || 0) + 1;
    localStorage.setItem("rs_review_sessions", JSON.stringify(sessions));
  }

  function createFromMaterial() {
    // Load last scanned material
    try {
      const data = JSON.parse(localStorage.getItem("rs_last_chunks") || "");
      if (!data || !data.chunks) return alert("No material found. Scan something first!");

      const { materialId, chunks } = data;
      const text = chunks.map((c: any) => c.text).join(" ");

      // Generate simple Q&A cards from sentences
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      const newCards: ReviewCard[] = [];

      for (let i = 0; i < Math.min(6, sentences.length); i++) {
        const sent = sentences[i];
        // Create fill-in-the-blank style questions
        const words = sent.split(/\s+/);
        if (words.length < 5) continue;

        const blankIdx = Math.floor(words.length / 2);
        const blank = words[blankIdx];
        const front = words.map((w, idx) => idx === blankIdx ? "_____" : w).join(" ");

        newCards.push({
          id: Math.random().toString(36).slice(2, 10),
          front: front,
          back: blank,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          materialId
        });
      }

      const updated = [...allCards, ...newCards];
      setAllCards(updated);
      saveCards(updated);
      const due = getDueCards(updated);
      setDueCards(due);
      if (due.length > 0) setCurrentCard(due[0]);

      alert(`Created ${newCards.length} review cards!`);
    } catch (err: any) {
      alert("Error creating cards: " + err.message);
    }
  }

  if (!currentCard && dueCards.length === 0) {
    return (
      <div>
        <div className="card">
          <h1 className="h1">Review Session Complete! 🎉</h1>
          {stats.reviewed > 0 ? (
            <div>
              <p className="p" style={{ marginTop: 10 }}>
                Reviewed: {stats.reviewed} cards<br />
                Correct: {stats.correct} ({Math.round((stats.correct / stats.reviewed) * 100)}%)<br />
                Wrong: {stats.wrong}
              </p>
            </div>
          ) : (
            <p className="p" style={{ marginTop: 10 }}>No cards due for review right now.</p>
          )}
          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={createFromMaterial}>
              Create Cards from Last Scan
            </button>
            <a className="btn btn-ghost" href="/scan">Scan New Material</a>
            <a className="btn btn-ghost" href="/">Home</a>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 12 }}>
          <div className="card">
            <b>Total Cards</b>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{allCards.length}</div>
          </div>
          <div className="card">
            <b>Due Today</b>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{dueCards.length}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 className="h1">Review Session</h1>
          <div className="p">
            {dueCards.length} cards remaining
          </div>
        </div>

        {stats.reviewed > 0 && (
          <div style={{ marginBottom: 16, padding: 10, background: "#f0f9ff", borderRadius: 10 }}>
            <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
              <span>📊 Reviewed: {stats.reviewed}</span>
              <span style={{ color: "#10b981" }}>✓ Correct: {stats.correct}</span>
              <span style={{ color: "#ef4444" }}>✗ Wrong: {stats.wrong}</span>
            </div>
          </div>
        )}

        <div className="card" style={{ minHeight: 250, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#fafafa" }}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, textAlign: "center", maxWidth: 600 }}>
            {currentCard?.front}
          </div>

          {!showAnswer && (
            <button className="btn btn-primary" onClick={() => setShowAnswer(true)}>
              Show Answer
            </button>
          )}

          {showAnswer && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0369a1", marginBottom: 20 }}>
                {currentCard?.back}
              </div>
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
                How well did you know this?
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <button className="btn btn-ghost" onClick={() => answer(0)} style={{ background: "#fee2e2", color: "#991b1b" }}>
                  ❌ Wrong
                </button>
                <button className="btn btn-ghost" onClick={() => answer(3)} style={{ background: "#fef3c7", color: "#92400e" }}>
                  😐 Hard
                </button>
                <button className="btn btn-ghost" onClick={() => answer(4)} style={{ background: "#dcfce7", color: "#166534" }}>
                  😊 Good
                </button>
                <button className="btn btn-ghost" onClick={() => answer(5)} style={{ background: "#bbf7d0", color: "#15803d" }}>
                  😄 Easy
                </button>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
                Interval: {currentCard?.interval || 0} days · Reps: {currentCard?.repetitions || 0}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
