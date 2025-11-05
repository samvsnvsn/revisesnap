"use client";
import { useEffect, useState } from "react";

function getWeeklyGoal(): number {
  try {
    const profile = JSON.parse(localStorage.getItem("rs_profile") || "{}");
    return profile.weeklyGoal || 4;
  } catch {
    return 4;
  }
}

function getThisWeekSessions(): number {
  try {
    const sessions = JSON.parse(localStorage.getItem("rs_review_sessions") || "{}");
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    let count = 0;
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const key = day.toISOString().split('T')[0];
      if (sessions[key]) count += sessions[key];
    }
    return count;
  } catch {
    return 0;
  }
}

function getDueCardsCount(): number {
  try {
    const cards = JSON.parse(localStorage.getItem("rs_review_cards") || "[]");
    const now = Date.now();
    return cards.filter((c: any) => c.nextReview <= now).length;
  } catch {
    return 0;
  }
}

export default function Page() {
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [progress, setProgress] = useState(0);
  const [dueCards, setDueCards] = useState(0);

  useEffect(() => {
    setWeeklyGoal(getWeeklyGoal());
    setProgress(getThisWeekSessions());
    setDueCards(getDueCardsCount());
  }, []);

  const percentage = weeklyGoal > 0 ? Math.min(100, Math.round((progress / weeklyGoal) * 100)) : 0;

  return (
    <div>
      <div className="card">
        <h1 className="h1">Ready for 5 minutes?</h1>
        <p className="p">Quickly scan your material and start a short session.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <a className="btn btn-primary" href="/scan">📷 Scan</a>
          <a className="btn btn-ghost" href="/material">📄 Recent notes</a>
          <a className="btn btn-ghost" href="/notes/blank">✏️ Blank page</a>
        </div>
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="card">
          <b>📚 Review Cards</b>
          <p className="p" style={{ marginTop: 6 }}>
            {dueCards > 0 ? (
              <>You have <strong>{dueCards}</strong> cards due for review!</>
            ) : (
              "No cards due right now. Great work! 🎉"
            )}
          </p>
          {dueCards > 0 && (
            <a className="btn btn-primary" href="/review" style={{ marginTop: 8, display: "inline-block" }}>
              Start Review
            </a>
          )}
        </div>

        <div className="card">
          <b>🎯 Weekly Goal</b>
          <p className="p" style={{ marginTop: 6 }}>
            Do {weeklyGoal} short sessions · progress {progress}/{weeklyGoal}
          </p>
          <div style={{ marginTop: 10, background: "#e5e7eb", borderRadius: 8, overflow: "hidden", height: 24 }}>
            <div
              style={{
                width: `${percentage}%`,
                height: "100%",
                background: percentage >= 100 ? "#10b981" : "#f43f5e",
                transition: "width 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {percentage}%
            </div>
          </div>
          {progress >= weeklyGoal && (
            <p className="p" style={{ marginTop: 6, color: "#10b981", fontWeight: 600 }}>
              ✅ Goal completed!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
