import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Collapse,
  Tooltip,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  Stop,
  Coffee,
  MenuBook,
  ExpandLess,
  Timer,
} from "@mui/icons-material";

const STUDY_TIME = 45 * 60;
const BREAK_TIME = 5 * 60;

export default function StudyTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(STUDY_TIME);
  const [mode, setMode] = useState("study");
  const [sessions, setSessions] = useState(() => {
    try {
      const s = localStorage.getItem("eduai_pomo_s");
      const d = localStorage.getItem("eduai_pomo_d");
      if (d === new Date().toISOString().split("T")[0] && s) return parseInt(s);
      return 0;
    } catch {
      return 0;
    }
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("eduai_pomo_s", String(sessions));
    localStorage.setItem(
      "eduai_pomo_d",
      new Date().toISOString().split("T")[0],
    );
  }, [sessions]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.value = 0.2;
        o.start();
        o.stop(ctx.currentTime + 0.3);
      } catch {}
      if (mode === "study") {
        setSessions((p) => p + 1);
        setMode("break");
        setTimeLeft(BREAK_TIME);
      } else {
        setMode("study");
        setTimeLeft(STUDY_TIME);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, mode]);

  const toggle = () => {
    setIsRunning(!isRunning);
    if (!isOpen) setIsOpen(true);
  };
  const stop = () => {
    setIsRunning(false);
    setMode("study");
    setTimeLeft(STUDY_TIME);
    clearInterval(intervalRef.current);
  };
  const fmt = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const pct =
    mode === "study"
      ? ((STUDY_TIME - timeLeft) / STUDY_TIME) * 100
      : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;
  const accent = mode === "study" ? "#8A54FF" : "#22C55E";

  return (
    <>
      {/* PANEL */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "24px",
            zIndex: 999999,
            width: "260px",
            borderRadius: "20px",
            overflow: "hidden",
            background: "#1A122A",
            border: `2px solid ${accent}`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 30px ${accent}44`,
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {mode === "study" ? (
                <MenuBook style={{ fontSize: "18px", color: accent }} />
              ) : (
                <Coffee style={{ fontSize: "18px", color: accent }} />
              )}
              <span
                style={{
                  color: accent,
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {mode === "study" ? "Study Time" : "Break Time"}
              </span>
            </div>
            <div
              onClick={() => setIsOpen(false)}
              style={{
                cursor: "pointer",
                color: "rgba(255,255,255,0.4)",
                padding: "4px",
              }}
            >
              <ExpandLess style={{ fontSize: "20px" }} />
            </div>
          </div>

          {/* Timer Circle */}
          <div style={{ padding: "28px 24px", textAlign: "center" }}>
            <div
              style={{
                position: "relative",
                width: "140px",
                height: "140px",
                margin: "0 auto 20px",
              }}
            >
              <svg
                width="140"
                height="140"
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="7"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke={accent}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - pct / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    color: "#FFFFFF",
                    fontWeight: 900,
                    fontSize: "34px",
                    fontFamily: "monospace",
                  }}
                >
                  {fmt(timeLeft)}
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "11px",
                    marginTop: "4px",
                  }}
                >
                  {mode === "study" ? "45 min session" : "5 min break"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              <div
                onClick={stop}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.4)",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <Stop style={{ fontSize: "20px" }} />
              </div>
              <div
                onClick={toggle}
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#FFFFFF",
                  background: accent,
                  boxShadow: `0 4px 20px ${accent}88`,
                }}
              >
                {isRunning ? (
                  <Pause style={{ fontSize: "28px" }} />
                ) : (
                  <PlayArrow style={{ fontSize: "28px" }} />
                )}
              </div>
              <div style={{ width: "40px", textAlign: "center" }}>
                <div
                  style={{
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "16px",
                  }}
                >
                  {sessions}
                </div>
                <div
                  style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}
                >
                  done
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BUTTON — using raw div with inline styles for guaranteed visibility */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 28px",
          borderRadius: "60px",
          cursor: "pointer",
          background: accent,
          color: "#FFFFFF",
          boxShadow: `0 0 0 5px ${accent}44, 0 8px 40px ${accent}88`,
          transition: "all 0.3s ease",
          userSelect: "none",
          minWidth: "175px",
          justifyContent: "center",
          fontFamily: "Inter, Roboto, sans-serif",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08) translateY(-3px)";
          e.currentTarget.style.boxShadow = `0 0 0 8px ${accent}55, 0 14px 50px ${accent}AA`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = `0 0 0 5px ${accent}44, 0 8px 40px ${accent}88`;
        }}
      >
        {isRunning ? (
          <>
            {mode === "study" ? (
              <MenuBook style={{ fontSize: "22px" }} />
            ) : (
              <Coffee style={{ fontSize: "22px" }} />
            )}
            <span
              style={{
                fontSize: "19px",
                fontWeight: 900,
                letterSpacing: "1.5px",
                fontFamily: "monospace",
              }}
            >
              {fmt(timeLeft)}
            </span>
          </>
        ) : (
          <>
            <Timer style={{ fontSize: "22px" }} />
            <span style={{ fontSize: "16px", fontWeight: 800 }}>
              Study Timer
            </span>
          </>
        )}
      </div>
    </>
  );
}
