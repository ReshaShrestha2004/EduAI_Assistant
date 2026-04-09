import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  MenuBook,
  Description,
  Schedule,
  Topic,
  Category,
} from "@mui/icons-material";
import { keyframes } from "@mui/material/styles";
import api from "../services/api";

const fadeIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;

// Cache insights so we don't re-fetch for the same document
const insightsCache = {};

export default function DocumentInsights({ documentId }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!documentId) {
      setInsights(null);
      return;
    }

    // Check cache first
    if (insightsCache[documentId]) {
      setInsights(insightsCache[documentId]);
      return;
    }

    const fetchInsights = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.get(`/ai/documents/${documentId}/insights`);
        insightsCache[documentId] = res.data;
        setInsights(res.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [documentId]);

  if (!documentId) return null;

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          py: 1.5,
          px: 0.5,
        }}
      >
        <CircularProgress size={16} sx={{ color: "rgba(138,84,255,0.5)" }} />
        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>
          Analyzing document...
        </Typography>
      </Box>
    );
  }

  if (error || !insights) return null;

  return (
    <Box
      sx={{
        mt: 2,
        p: 2.5,
        borderRadius: "14px",
        background: "rgba(138,84,255,0.04)",
        border: "1px solid rgba(138,84,255,0.1)",
        animation: `${fadeIn} 0.4s ease-out`,
      }}
    >
      {/* Stats Row */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 2 }}>
        <Tooltip title="Total pages" arrow>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Description sx={{ fontSize: 16, color: "#8A54FF" }} />
            <Typography
              sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "14px" }}
            >
              {insights.page_count}
            </Typography>
            <Typography
              sx={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}
            >
              pages
            </Typography>
          </Box>
        </Tooltip>
        <Tooltip title="Approximate word count" arrow>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <MenuBook sx={{ fontSize: 16, color: "#4FACFE" }} />
            <Typography
              sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "14px" }}
            >
              {insights.word_count > 1000
                ? `${(insights.word_count / 1000).toFixed(1)}k`
                : insights.word_count}
            </Typography>
            <Typography
              sx={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}
            >
              words
            </Typography>
          </Box>
        </Tooltip>
        <Tooltip title="Estimated reading time" arrow>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Schedule sx={{ fontSize: 16, color: "#6BCF7F" }} />
            <Typography
              sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "14px" }}
            >
              {insights.reading_time_minutes}
            </Typography>
            <Typography
              sx={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}
            >
              min read
            </Typography>
          </Box>
        </Tooltip>
      </Box>

      {/* Topics */}
      {insights.topics && insights.topics.length > 0 && (
        <Box>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 1,
            }}
          >
            Topics Detected
          </Typography>
          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
            {insights.topics.map((topic, i) => (
              <Chip
                key={i}
                label={topic}
                size="small"
                sx={{
                  background: "rgba(138,84,255,0.1)",
                  color: "#B88CFF",
                  fontWeight: 600,
                  fontSize: "12px",
                  height: "26px",
                  border: "1px solid rgba(138,84,255,0.15)",
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Sections */}
      {insights.sections && insights.sections.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 0.8,
            }}
          >
            Sections Found
          </Typography>
          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
            {insights.sections.slice(0, 6).map((section, i) => (
              <Chip
                key={i}
                label={section}
                size="small"
                sx={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "11px",
                  height: "24px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              />
            ))}
            {insights.sections.length > 6 && (
              <Chip
                label={`+${insights.sections.length - 6} more`}
                size="small"
                sx={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "11px",
                  height: "24px",
                }}
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
