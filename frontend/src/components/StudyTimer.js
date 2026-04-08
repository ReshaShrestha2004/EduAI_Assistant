import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Collapse,
} from "@mui/material";
import {
  Timer,
  PlayArrow,
  Pause,
  Stop,
  Coffee,
  MenuBook,
  Close,
  ExpandLess,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";

const pulse = keyframes`
  0%, 100% { box-shadow: 0 4px 20px rgba(138,84,255,0.3); }
  50% { box-shadow: 0 4px 30px rgba(138,84,255,0.5); }
`;

const breathe = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const STUDY_TIME = 45 * 60; // 45 minutes in seconds
const BREAK_TIME = 5 * 60; // 5 minutes in seconds

export default function StudyTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(STUDY_TIME);
  const [mode, setMode] = useState("study"); // 'study' or 'break'
  const [sessionsCompleted, setSessionsCompleted] = useState(() => {
    try {
      const saved = localStorage.getItem("eduai_pomodoro_sessions");
      const date = localStorage.getItem("eduai_pomodoro_date");
      const today = new Date().toISOString().split("T")[0];
      if (date === today && saved) return parseInt(saved);
      return 0;
    } catch {
      return 0;
    }
  });
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Save sessions count
  useEffect(() => {
    localStorage.setItem("eduai_pomodoro_sessions", String(sessionsCompleted));
    localStorage.setItem(
      "eduai_pomodoro_date",
      new Date().toISOString().split("T")[0],
    );
  }, [sessionsCompleted]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      clearInterval(intervalRef.current);
      setIsRunning(false);

      // Play notification sound
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = mode === "study" ? 800 : 600;
        gain.gain.value = 0.15;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = mode === "study" ? 1000 : 800;
          gain2.gain.value = 0.15;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.4);
        }, 350);
      } catch (e) {}

      if (mode === "study") {
        setSessionsCompleted((prev) => prev + 1);
        setMode("break");
        setTimeLeft(BREAK_TIME);
      } else {
        setMode("study");
        setTimeLeft(STUDY_TIME);
      }
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, mode]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    if (!isOpen) setIsOpen(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setMode("study");
    setTimeLeft(STUDY_TIME);
    clearInterval(intervalRef.current);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress =
    mode === "study"
      ? ((STUDY_TIME - timeLeft) / STUDY_TIME) * 100
      : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;

  const totalTime = mode === "study" ? STUDY_TIME : BREAK_TIME;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 1.5,
      }}
    >
      {/* Expanded Timer Panel */}
      <Collapse in={isOpen} unmountOnExit>
        <Paper
          sx={{
            width: 240,
            borderRadius: "20px",
            background: "rgba(15, 11, 26, 0.95)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(138,84,255,0.2)",
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {mode === "study" ? (
                <MenuBook sx={{ fontSize: 16, color: "#8A54FF" }} />
              ) : (
                <Coffee sx={{ fontSize: 16, color: "#6BCF7F" }} />
              )}
              <Typography
                sx={{
                  color: mode === "study" ? "#B88CFF" : "#6BCF7F",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {mode === "study" ? "Study Time" : "Break Time"}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setIsOpen(false)}
              sx={{
                color: "rgba(255,255,255,0.3)",
                p: 0.3,
                "&:hover": { color: "#FFFFFF" },
              }}
            >
              <ExpandLess sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Timer Display */}
          <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
            {/* Circular progress */}
            <Box
              sx={{
                position: "relative",
                width: 120,
                height: 120,
                mx: "auto",
                mb: 2,
              }}
            >
              <svg
                width="120"
                height="120"
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="6"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={mode === "study" ? "#8A54FF" : "#6BCF7F"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <Typography
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "28px",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatTime(timeLeft)}
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: "10px",
                    mt: 0.5,
                  }}
                >
                  {mode === "study" ? "45 min session" : "5 min break"}
                </Typography>
              </Box>
            </Box>

            {/* Controls */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
              }}
            >
              <Tooltip title="Reset" arrow>
                <IconButton
                  onClick={stopTimer}
                  size="small"
                  sx={{
                    color: "rgba(255,255,255,0.3)",
                    width: 36,
                    height: 36,
                    "&:hover": {
                      color: "#EF4444",
                      background: "rgba(239,68,68,0.1)",
                    },
                  }}
                >
                  <Stop sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <IconButton
                onClick={toggleTimer}
                sx={{
                  width: 48,
                  height: 48,
                  background: isRunning
                    ? "rgba(255,255,255,0.08)"
                    : mode === "study"
                      ? "linear-gradient(135deg, #8A54FF, #9F6EFF)"
                      : "linear-gradient(135deg, #6BCF7F, #4ECDC4)",
                  color: "#FFFFFF",
                  "&:hover": {
                    background: isRunning
                      ? "rgba(255,255,255,0.12)"
                      : mode === "study"
                        ? "linear-gradient(135deg, #9F6EFF, #B88CFF)"
                        : "linear-gradient(135deg, #7DE5DD, #6BCF7F)",
                  },
                }}
              >
                {isRunning ? (
                  <Pause sx={{ fontSize: 22 }} />
                ) : (
                  <PlayArrow sx={{ fontSize: 22 }} />
                )}
              </IconButton>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: "11px",
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {sessionsCompleted}
                  <br />
                  <span style={{ fontSize: "9px" }}>done</span>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Collapse>

      {/* Floating Button */}
      <Tooltip
        title={
          isOpen
            ? ""
            : isRunning
              ? `${formatTime(timeLeft)} remaining`
              : "Study Timer"
        }
        arrow
        placement="left"
      >
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            width: 56,
            height: 56,
            background: isRunning
              ? mode === "study"
                ? "linear-gradient(135deg, #8A54FF, #9F6EFF)"
                : "linear-gradient(135deg, #6BCF7F, #4ECDC4)"
              : "rgba(15, 11, 26, 0.9)",
            backdropFilter: "blur(20px)",
            border: isRunning ? "none" : "1px solid rgba(138,84,255,0.25)",
            color: "#FFFFFF",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            animation: isRunning ? `${pulse} 3s ease-in-out infinite` : "none",
            transition: "all 0.3s ease",
            "&:hover": {
              background: isRunning
                ? mode === "study"
                  ? "linear-gradient(135deg, #9F6EFF, #B88CFF)"
                  : "linear-gradient(135deg, #7DE5DD, #6BCF7F)"
                : "rgba(138,84,255,0.15)",
              transform: "scale(1.05)",
            },
          }}
        >
          {isRunning ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
              </Typography>
            </Box>
          ) : (
            <Timer sx={{ fontSize: 24 }} />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
