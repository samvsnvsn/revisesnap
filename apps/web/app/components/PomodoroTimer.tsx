"use client";
import { useEffect, useState, useRef } from "react";

type PomodoroState = "idle" | "work" | "break" | "longBreak";

export default function PomodoroTimer() {
  const [state, setState] = useState<PomodoroState>("idle");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<any>(null);

  // Settings
  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;
  const SESSIONS_BEFORE_LONG_BREAK = 4;

  useEffect(() => {
    if (state !== "idle") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  function handleTimerComplete() {
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Play sound
    try {
      const audio = new Audio("data:audio/wav;base64,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");
      audio.play();
    } catch {}

    // Notify
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("ReviseSnap", {
        body: state === "work" ? "Work session complete! Time for a break." : "Break over! Ready for next session?",
        icon: "/icons/icon-192.png"
      });
    }

    if (state === "work") {
      const newCount = sessionsCompleted + 1;
      setSessionsCompleted(newCount);

      // Record study session
      recordStudyTime(WORK_TIME);

      if (newCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
        setState("longBreak");
        setTimeLeft(LONG_BREAK);
      } else {
        setState("break");
        setTimeLeft(SHORT_BREAK);
      }
    } else {
      setState("idle");
      setTimeLeft(WORK_TIME);
    }
  }

  function recordStudyTime(seconds: number) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stats = JSON.parse(localStorage.getItem("rs_study_stats") || "{}");

      if (!stats[today]) {
        stats[today] = { totalSeconds: 0, pomodoros: 0 };
      }

      stats[today].totalSeconds += seconds;
      stats[today].pomodoros += 1;

      localStorage.setItem("rs_study_stats", JSON.stringify(stats));
    } catch {}
  }

  function startWork() {
    setState("work");
    setTimeLeft(WORK_TIME);
  }

  function startBreak() {
    setState("break");
    setTimeLeft(SHORT_BREAK);
  }

  function pause() {
    setState("idle");
  }

  function reset() {
    setState("idle");
    setTimeLeft(WORK_TIME);
  }

  function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const stateLabels = {
    idle: "Ready",
    work: "Focus Time",
    break: "Short Break",
    longBreak: "Long Break"
  };

  const stateColors = {
    idle: "#64748B",
    work: "#F43F5E",
    break: "#10B981",
    longBreak: "#0EA5E9"
  };

  if (isMinimized) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 100,
          right: 16,
          background: stateColors[state],
          color: "#fff",
          padding: "8px 16px",
          borderRadius: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          cursor: "pointer",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 600,
          fontSize: 14
        }}
        onClick={() => setIsMinimized(false)}
      >
        <span>⏱️</span>
        <span>{timeString}</span>
        <span style={{ fontSize: 12, opacity: 0.9 }}>🍅 {sessionsCompleted}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 100,
        right: 16,
        background: "var(--surface)",
        border: `2px solid ${stateColors[state]}`,
        borderRadius: 16,
        boxShadow: "var(--shadow)",
        padding: 16,
        width: 280,
        zIndex: 40
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Pomodoro Timer</h3>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setIsMinimized(true)}
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            _
          </button>
          <button
            className="btn btn-ghost"
            onClick={reset}
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            ×
          </button>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginBottom: 16
        }}
      >
        <div style={{ fontSize: 12, color: stateColors[state], fontWeight: 600, marginBottom: 8 }}>
          {stateLabels[state]}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            fontFamily: "monospace",
            color: stateColors[state]
          }}
        >
          {timeString}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {state === "idle" && (
          <>
            <button className="btn btn-primary" onClick={startWork} style={{ flex: 1, fontSize: 13 }}>
              Start Focus
            </button>
            <button className="btn btn-ghost" onClick={startBreak} style={{ flex: 1, fontSize: 13 }}>
              Break
            </button>
          </>
        )}
        {state !== "idle" && (
          <>
            <button className="btn btn-ghost" onClick={pause} style={{ flex: 1, fontSize: 13 }}>
              Pause
            </button>
            <button className="btn btn-ghost" onClick={reset} style={{ flex: 1, fontSize: 13 }}>
              Reset
            </button>
          </>
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
          <span style={{ color: "var(--muted)" }}>Today:</span>
          <span style={{ fontWeight: 600 }}>🍅 {sessionsCompleted} pomodoros</span>
        </div>
        {"Notification" in window && Notification.permission === "default" && (
          <button
            className="btn btn-ghost"
            onClick={requestNotificationPermission}
            style={{ width: "100%", marginTop: 8, fontSize: 12, padding: "6px 12px" }}
          >
            Enable Notifications
          </button>
        )}
      </div>
    </div>
  );
}
