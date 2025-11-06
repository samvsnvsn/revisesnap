"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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

function getStudyStats() {
  try {
    const stats = JSON.parse(localStorage.getItem("rs_study_stats") || "{}");
    const today = new Date().toISOString().split('T')[0];
    const todayStats = stats[today] || { totalSeconds: 0, pomodoros: 0 };

    // Calculate week total
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let weekTotal = 0;
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const key = day.toISOString().split('T')[0];
      if (stats[key]) weekTotal += stats[key].totalSeconds;
    }

    // Calculate streak
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const key = checkDate.toISOString().split('T')[0];
      if (stats[key] && stats[key].pomodoros > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      todayMinutes: Math.round(todayStats.totalSeconds / 60),
      todayPomodoros: todayStats.pomodoros,
      weekMinutes: Math.round(weekTotal / 60),
      streak
    };
  } catch {
    return { todayMinutes: 0, todayPomodoros: 0, weekMinutes: 0, streak: 0 };
  }
}

export default function Page() {
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [progress, setProgress] = useState(0);
  const [dueCards, setDueCards] = useState(0);
  const [stats, setStats] = useState({ todayMinutes: 0, todayPomodoros: 0, weekMinutes: 0, streak: 0 });

  useEffect(() => {
    setWeeklyGoal(getWeeklyGoal());
    setProgress(getThisWeekSessions());
    setDueCards(getDueCardsCount());
    setStats(getStudyStats());
  }, []);

  const percentage = weeklyGoal > 0 ? Math.min(100, Math.round((progress / weeklyGoal) * 100)) : 0;

  return (
    <div>
      <div className="card">
        <h1 className="h1">Welcome to ReviseSnap</h1>
        <p className="p">Create notes, scan material, and review efficiently.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Link className="btn btn-primary" href="/notes/blank" style={{ flex: "1 1 auto" }}>
            ✏️ New Note
          </Link>
          <Link className="btn btn-ghost" href="/scan">📷 Scan</Link>
          <Link className="btn btn-ghost" href="/notes">📄 All Notes</Link>
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
          <div style={{ marginTop: 10, background: "#E2E8F0", borderRadius: 8, overflow: "hidden", height: 24 }}>
            <div
              style={{
                width: `${percentage}%`,
                height: "100%",
                background: percentage >= 100 ? "#10b981" : "#3B82F6",
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

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--text)" }}>📊 Study Statistics</h2>
        <div className="grid2">
          <div style={{ padding: 14, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Today</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: "var(--text)" }}>{stats.todayMinutes} min</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>🍅 {stats.todayPomodoros} pomodoros</div>
          </div>
          <div style={{ padding: 14, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>This Week</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: "var(--text)" }}>{stats.weekMinutes} min</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              {Math.round(stats.weekMinutes / 60)}h {stats.weekMinutes % 60}m
            </div>
          </div>
          <div style={{ padding: 14, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Streak</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: "var(--text)" }}>🔥 {stats.streak}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>days in a row</div>
          </div>
          <div style={{ padding: 14, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Notes</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: "var(--text)" }}>
              {typeof window !== "undefined" ? JSON.parse(localStorage.getItem("rs_notes_index") || "[]").length : 0}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>total notes created</div>
          </div>
        </div>
      </div>
    </div>
  );
}
