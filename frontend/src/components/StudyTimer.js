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
  Close,
} from "@mui/icons-material";

const STUDY_TIME = 45 * 60;
const BREAK_TIME = 5 * 60;

export default function StudyTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(STUDY_TIME);
  const [mode, setMode] = useState("study");
  const [showBreakPopup, setShowBreakPopup] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(BREAK_TIME);
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
  const breakIntervalRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("eduai_pomo_s", String(sessions));
    localStorage.setItem(
      "eduai_pomo_d",
      new Date().toISOString().split("T")[0],
    );
  }, [sessions]);

  // Main study timer
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
      setSessions((p) => p + 1);
      // Show break popup
      setShowBreakPopup(true);
      setBreakTimeLeft(BREAK_TIME);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  // Break countdown
  useEffect(() => {
    if (showBreakPopup && breakTimeLeft > 0) {
      breakIntervalRef.current = setInterval(
        () => setBreakTimeLeft((p) => p - 1),
        1000,
      );
    } else if (showBreakPopup && breakTimeLeft === 0) {
      clearInterval(breakIntervalRef.current);
      handleBreakEnd();
    }
    return () => clearInterval(breakIntervalRef.current);
  }, [showBreakPopup, breakTimeLeft]);

  const handleBreakEnd = () => {
    setShowBreakPopup(false);
    setBreakTimeLeft(BREAK_TIME);
    setTimeLeft(STUDY_TIME);
    setMode("study");
  };

  const handleSkipBreak = () => {
    clearInterval(breakIntervalRef.current);
    handleBreakEnd();
  };

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
  const pct = ((STUDY_TIME - timeLeft) / STUDY_TIME) * 100;
  const breakPct = ((BREAK_TIME - breakTimeLeft) / BREAK_TIME) * 100;
  const accent = "#8A54FF";

  return (
    <>
      {/* ============ BREAK POPUP — CENTER SCREEN ============ */}
      {showBreakPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: "380px",
              borderRadius: "28px",
              overflow: "hidden",
              background: "#1A122A",
              border: "2px solid #22C55E",
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(34,197,94,0.2)",
              textAlign: "center",
              padding: "40px 32px",
            }}
          >
            {/* Coffee icon */}
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(34,197,94,0.15)",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Coffee style={{ fontSize: "36px", color: "#22C55E" }} />
            </div>

            <div
              style={{
                color: "#FFFFFF",
                fontSize: "24px",
                fontWeight: 800,
                marginBottom: "8px",
              }}
            >
              Study Session Complete!
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "15px",
                marginBottom: "32px",
              }}
            >
              Take a 5 minute break to recharge
            </div>

            {/* Break countdown circle */}
            <div
              style={{
                position: "relative",
                width: "160px",
                height: "160px",
                margin: "0 auto 28px",
              }}
            >
              <svg
                width="160"
                height="160"
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 68}`}
                  strokeDashoffset={`${2 * Math.PI * 68 * (1 - breakPct / 100)}`}
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
                    fontSize: "40px",
                    fontFamily: "monospace",
                    letterSpacing: "2px",
                  }}
                >
                  {fmt(breakTimeLeft)}
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  break remaining
                </span>
              </div>
            </div>

            {/* Sessions completed badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "20px",
                background: "rgba(138,84,255,0.1)",
                border: "1px solid rgba(138,84,255,0.2)",
                marginBottom: "24px",
              }}
            >
              <span
                style={{ color: "#B88CFF", fontSize: "13px", fontWeight: 600 }}
              >
                {sessions} {sessions === 1 ? "session" : "sessions"} completed
                today
              </span>
            </div>

            <div style={{ display: "block" }}>
              {/* Skip break button */}
              <div
                onClick={handleSkipBreak}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 32px",
                  borderRadius: "14px",
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "15px",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  fontFamily: "Inter, Roboto, sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                }}
              >
                Skip Break
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ SIDE PANEL ============ */}
      {isOpen && !showBreakPopup && (
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
              <MenuBook style={{ fontSize: "18px", color: accent }} />
              <span
                style={{
                  color: accent,
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Study Time
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
                  45 min session
                </span>
              </div>
            </div>

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

      {/* ============ FLOATING BUTTON ============ */}
      {!showBreakPopup && (
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
              <MenuBook style={{ fontSize: "22px" }} />
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
      )}
    </>
  );
}
