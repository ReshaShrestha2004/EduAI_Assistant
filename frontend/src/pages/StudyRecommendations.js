import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import ReactMarkdown from "react-markdown";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Grid,
  Divider,
} from "@mui/material";
import {
  ArrowBack,
  AutoAwesome,
  School,
  Quiz,
  Psychology,
  Description,
  CheckCircle,
  TrendingUp,
  Warning,
  ArrowForward,
  Lightbulb,
  MenuBook,
  Refresh,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";

const fadeIn = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
const slideIn = keyframes`from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}`;

const PageContainer = styled(Box)({
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0F0B1A 0%, #1A122A 100%)",
  paddingTop: "40px",
  paddingBottom: "40px",
});
const ActionButton = styled(Button)({
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 600,
  padding: "10px 24px",
});

const TopicCard = styled(Paper)(({ priority }) => {
  const borderColor =
    priority === "high"
      ? "rgba(245,87,108,0.3)"
      : priority === "medium"
        ? "rgba(255,217,61,0.3)"
        : "rgba(107,207,127,0.3)";
  return {
    padding: "24px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    border: `1px solid ${borderColor}`,
    transition: "all 0.3s ease",
    "&:hover": {
      background: "rgba(255,255,255,0.06)",
      transform: "translateY(-2px)",
    },
  };
});

const markdownComponents = {
  p: ({ children }) => (
    <Typography
      sx={{
        color: "rgba(255,255,255,0.8)",
        lineHeight: 1.7,
        mb: 1,
        fontSize: "15px",
      }}
    >
      {children}
    </Typography>
  ),
  strong: ({ children }) => (
    <strong style={{ color: "#FFFFFF", fontWeight: 700 }}>{children}</strong>
  ),
  li: ({ children }) => (
    <Typography
      component="li"
      sx={{
        color: "rgba(255,255,255,0.8)",
        lineHeight: 1.7,
        ml: 2,
        mb: 0.5,
        fontSize: "14px",
      }}
    >
      {children}
    </Typography>
  ),
  ul: ({ children }) => (
    <Box component="ul" sx={{ pl: 2, mb: 1 }}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" sx={{ pl: 2, mb: 1 }}>
      {children}
    </Box>
  ),
};

const priorityConfig = {
  high: {
    color: "#F5576C",
    bg: "rgba(245,87,108,0.12)",
    label: "High Priority",
    icon: <Warning sx={{ fontSize: 16 }} />,
  },
  medium: {
    color: "#FFD93D",
    bg: "rgba(255,217,61,0.12)",
    label: "Medium Priority",
    icon: <TrendingUp sx={{ fontSize: 16 }} />,
  },
  low: {
    color: "#6BCF7F",
    bg: "rgba(107,207,127,0.12)",
    label: "Low Priority",
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
  },
};

export default function StudyRecommendations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const quizData = location.state;

  useEffect(() => {
    if (quizData && quizData.documentId && quizData.wrongAnswers) {
      fetchRecommendations();
    } else {
      setError("No quiz data found. Please complete a quiz first.");
      setLoading(false);
    }
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post(
        `/ai/documents/${quizData.documentId}/recommendations`,
        {
          wrong_answers: quizData.wrongAnswers,
          all_questions: quizData.allQuestions,
          prefer: quizData.aiMode || "groq",
        },
      );
      setRecommendations(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to generate recommendations",
      );
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceConfig = (performance) => {
    switch (performance) {
      case "excellent":
        return {
          color: "#6BCF7F",
          label: "Excellent",
          bg: "rgba(107,207,127,0.1)",
        };
      case "good":
        return { color: "#4FACFE", label: "Good", bg: "rgba(79,172,254,0.1)" };
      case "satisfactory":
        return {
          color: "#B88CFF",
          label: "Satisfactory",
          bg: "rgba(138,84,255,0.1)",
        };
      default:
        return {
          color: "#F5576C",
          label: "Needs Improvement",
          bg: "rgba(245,87,108,0.1)",
        };
    }
  };

  return (
    <PageContainer>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, animation: `${fadeIn} 0.6s ease-out` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ color: "#8A54FF" }}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: "#FFFFFF",
                  fontSize: { xs: "28px", md: "36px" },
                }}
              >
                Study Recommendations
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", mt: 0.5 }}>
                Personalized study plan based on your quiz performance
              </Typography>
            </Box>
            {recommendations && (
              <ActionButton
                startIcon={<Refresh />}
                onClick={fetchRecommendations}
                sx={{
                  borderColor: "rgba(138,84,255,0.3)",
                  color: "#8A54FF",
                  border: "1px solid rgba(138,84,255,0.3)",
                  "&:hover": { background: "rgba(138,84,255,0.1)" },
                }}
              >
                Regenerate
              </ActionButton>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Paper
            sx={{
              p: 6,
              borderRadius: "20px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
            }}
          >
            <CircularProgress sx={{ color: "#8A54FF", mb: 3 }} size={48} />
            <Typography
              sx={{
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "18px",
                mb: 1,
              }}
            >
              Analyzing your quiz results...
            </Typography>
            <Typography
              sx={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}
            >
              Identifying weak topics and creating your personalized study plan
            </Typography>
          </Paper>
        )}

        {/* Results */}
        {!loading && recommendations && (
          <>
            {/* Score Overview */}
            <Paper
              sx={{
                p: 4,
                mb: 3,
                borderRadius: "20px",
                background: `linear-gradient(135deg, ${getPerformanceConfig(recommendations.overall_performance).bg}, rgba(255,255,255,0.03))`,
                border: `1px solid ${getPerformanceConfig(recommendations.overall_performance).color}33`,
                animation: `${fadeIn} 0.6s ease-out 0.1s backwards`,
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "13px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        mb: 1,
                      }}
                    >
                      Quiz Score
                    </Typography>
                    <Typography
                      sx={{
                        color: getPerformanceConfig(
                          recommendations.overall_performance,
                        ).color,
                        fontWeight: 900,
                        fontSize: "56px",
                        lineHeight: 1,
                      }}
                    >
                      {recommendations.score}%
                    </Typography>
                    <Chip
                      label={
                        getPerformanceConfig(
                          recommendations.overall_performance,
                        ).label
                      }
                      size="small"
                      sx={{
                        mt: 1,
                        background: getPerformanceConfig(
                          recommendations.overall_performance,
                        ).bg,
                        color: getPerformanceConfig(
                          recommendations.overall_performance,
                        ).color,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "13px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      mb: 1.5,
                    }}
                  >
                    Analysis
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.8)",
                      lineHeight: 1.7,
                      fontSize: "15px",
                    }}
                  >
                    {recommendations.overall_analysis}
                  </Typography>
                  {recommendations.encouragement && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: "12px",
                        background: "rgba(138,84,255,0.06)",
                        border: "1px solid rgba(138,84,255,0.12)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                      }}
                    >
                      <Lightbulb
                        sx={{ color: "#B88CFF", fontSize: 20, mt: 0.3 }}
                      />
                      <Typography
                        sx={{
                          color: "#B88CFF",
                          fontSize: "14px",
                          lineHeight: 1.6,
                          fontStyle: "italic",
                        }}
                      >
                        {recommendations.encouragement}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* Weak Topics */}
            {recommendations.weak_topics &&
              recommendations.weak_topics.length > 0 && (
                <Box
                  sx={{
                    mb: 3,
                    animation: `${fadeIn} 0.6s ease-out 0.2s backwards`,
                  }}
                >
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: "20px",
                      mb: 2,
                    }}
                  >
                    Topics to Focus On
                  </Typography>
                  <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
                    {recommendations.weak_topics.map((topic, idx) => {
                      const pConfig =
                        priorityConfig[topic.priority] || priorityConfig.medium;
                      return (
                        <Grid
                          item
                          xs={12}
                          md={6}
                          key={idx}
                          sx={{ display: "flex" }}
                        >
                          <TopicCard
                            priority={topic.priority}
                            sx={{
                              animation: `${slideIn} 0.4s ease-out ${idx * 0.1}s backwards`,
                              width: "100%",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 2,
                              }}
                            >
                              <Typography
                                sx={{
                                  color: "#FFFFFF",
                                  fontWeight: 700,
                                  fontSize: "17px",
                                  flex: 1,
                                  mr: 1,
                                }}
                              >
                                {topic.topic}
                              </Typography>
                              <Chip
                                icon={pConfig.icon}
                                label={pConfig.label}
                                size="small"
                                sx={{
                                  background: pConfig.bg,
                                  color: pConfig.color,
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  flexShrink: 0,
                                  "& .MuiChip-icon": { color: pConfig.color },
                                }}
                              />
                            </Box>

                            {topic.description && (
                              <Typography
                                sx={{
                                  color: "rgba(255,255,255,0.5)",
                                  fontSize: "13px",
                                  mb: 1.5,
                                  minHeight: "20px",
                                }}
                              >
                                {topic.description}
                              </Typography>
                            )}

                            {topic.why_weak && (
                              <Box
                                sx={{
                                  p: 2,
                                  borderRadius: "10px",
                                  background: "rgba(255,255,255,0.03)",
                                  mb: 2,
                                  minHeight: "48px",
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: "rgba(255,255,255,0.6)",
                                    fontSize: "13px",
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {topic.why_weak}
                                </Typography>
                              </Box>
                            )}

                            {topic.study_tips &&
                              topic.study_tips.length > 0 && (
                                <Box sx={{ mb: 2, flexGrow: 1 }}>
                                  <Typography
                                    sx={{
                                      color: "rgba(255,255,255,0.5)",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      mb: 1,
                                    }}
                                  >
                                    Study Tips
                                  </Typography>
                                  {topic.study_tips
                                    .slice(0, 3)
                                    .map((tip, tIdx) => (
                                      <Box
                                        key={tIdx}
                                        sx={{
                                          display: "flex",
                                          alignItems: "flex-start",
                                          gap: 1,
                                          mb: 0.5,
                                        }}
                                      >
                                        <CheckCircle
                                          sx={{
                                            color: "#8A54FF",
                                            fontSize: 14,
                                            mt: 0.5,
                                            flexShrink: 0,
                                          }}
                                        />
                                        <Typography
                                          sx={{
                                            color: "rgba(255,255,255,0.7)",
                                            fontSize: "13px",
                                            lineHeight: 1.5,
                                          }}
                                        >
                                          {tip}
                                        </Typography>
                                      </Box>
                                    ))}
                                </Box>
                              )}

                            {/* Action buttons for this topic */}
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                mt: "auto",
                                pt: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Button
                                size="small"
                                startIcon={<School sx={{ fontSize: 14 }} />}
                                onClick={() =>
                                  navigate("/flashcards", {
                                    state: { documentId: quizData.documentId },
                                  })
                                }
                                sx={{
                                  fontSize: "12px",
                                  color: "#F5576C",
                                  background: "rgba(245,87,108,0.08)",
                                  borderRadius: "8px",
                                  textTransform: "none",
                                  fontWeight: 600,
                                  "&:hover": {
                                    background: "rgba(245,87,108,0.15)",
                                  },
                                }}
                              >
                                Flashcards
                              </Button>
                              <Button
                                size="small"
                                startIcon={
                                  <AutoAwesome sx={{ fontSize: 14 }} />
                                }
                                onClick={() =>
                                  navigate("/summaries", {
                                    state: { documentId: quizData.documentId },
                                  })
                                }
                                sx={{
                                  fontSize: "12px",
                                  color: "#667EEA",
                                  background: "rgba(102,126,234,0.08)",
                                  borderRadius: "8px",
                                  textTransform: "none",
                                  fontWeight: 600,
                                  "&:hover": {
                                    background: "rgba(102,126,234,0.15)",
                                  },
                                }}
                              >
                                Summary
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Psychology sx={{ fontSize: 14 }} />}
                                onClick={() =>
                                  navigate("/qa-assistant", {
                                    state: { documentId: quizData.documentId },
                                  })
                                }
                                sx={{
                                  fontSize: "12px",
                                  color: "#4FACFE",
                                  background: "rgba(79,172,254,0.08)",
                                  borderRadius: "8px",
                                  textTransform: "none",
                                  fontWeight: 600,
                                  "&:hover": {
                                    background: "rgba(79,172,254,0.15)",
                                  },
                                }}
                              >
                                Ask AI
                              </Button>
                            </Box>
                          </TopicCard>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

            {/* Study Plan */}
            {recommendations.study_plan &&
              recommendations.study_plan.length > 0 && (
                <Paper
                  sx={{
                    p: 4,
                    mb: 3,
                    borderRadius: "20px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(138,84,255,0.15)",
                    animation: `${fadeIn} 0.6s ease-out 0.3s backwards`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 3,
                    }}
                  >
                    <MenuBook sx={{ color: "#8A54FF" }} />
                    <Typography
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "20px",
                      }}
                    >
                      Recommended Study Plan
                    </Typography>
                  </Box>
                  {recommendations.study_plan.map((step, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        mb: 2,
                        animation: `${slideIn} 0.4s ease-out ${0.3 + idx * 0.1}s backwards`,
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "10px",
                          flexShrink: 0,
                          background: "rgba(138,84,255,0.12)",
                          border: "1px solid rgba(138,84,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#B88CFF",
                            fontWeight: 700,
                            fontSize: "14px",
                          }}
                        >
                          {idx + 1}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.8)",
                          fontSize: "15px",
                          lineHeight: 1.6,
                          pt: 0.5,
                        }}
                      >
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              )}

            {/* Quick Actions */}
            <Paper
              sx={{
                p: 4,
                borderRadius: "20px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                animation: `${fadeIn} 0.6s ease-out 0.4s backwards`,
              }}
            >
              <Typography
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "20px",
                  mb: 3,
                }}
              >
                Next Steps
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <ActionButton
                    fullWidth
                    variant="outlined"
                    startIcon={<Quiz />}
                    onClick={() =>
                      navigate("/quizzes", {
                        state: { documentId: quizData.documentId },
                      })
                    }
                    sx={{
                      py: 2,
                      borderColor: "rgba(138,84,255,0.3)",
                      color: "#B88CFF",
                      flexDirection: "column",
                      gap: 1,
                      "&:hover": {
                        background: "rgba(138,84,255,0.08)",
                        borderColor: "#8A54FF",
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                      Retake Quiz
                    </Typography>
                    <Typography
                      sx={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}
                    >
                      Test yourself again
                    </Typography>
                  </ActionButton>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ActionButton
                    fullWidth
                    variant="outlined"
                    startIcon={<School />}
                    onClick={() =>
                      navigate("/flashcards", {
                        state: { documentId: quizData.documentId },
                      })
                    }
                    sx={{
                      py: 2,
                      borderColor: "rgba(245,87,108,0.3)",
                      color: "#F5576C",
                      flexDirection: "column",
                      gap: 1,
                      "&:hover": {
                        background: "rgba(245,87,108,0.08)",
                        borderColor: "#F5576C",
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                      Study Flashcards
                    </Typography>
                    <Typography
                      sx={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}
                    >
                      Review key concepts
                    </Typography>
                  </ActionButton>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ActionButton
                    fullWidth
                    variant="outlined"
                    startIcon={<AutoAwesome />}
                    onClick={() =>
                      navigate("/summaries", {
                        state: { documentId: quizData.documentId },
                      })
                    }
                    sx={{
                      py: 2,
                      borderColor: "rgba(102,126,234,0.3)",
                      color: "#667EEA",
                      flexDirection: "column",
                      gap: 1,
                      "&:hover": {
                        background: "rgba(102,126,234,0.08)",
                        borderColor: "#667EEA",
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                      Read Summary
                    </Typography>
                    <Typography
                      sx={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}
                    >
                      Review the material
                    </Typography>
                  </ActionButton>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ActionButton
                    fullWidth
                    variant="outlined"
                    startIcon={<Psychology />}
                    onClick={() =>
                      navigate("/qa-assistant", {
                        state: { documentId: quizData.documentId },
                      })
                    }
                    sx={{
                      py: 2,
                      borderColor: "rgba(79,172,254,0.3)",
                      color: "#4FACFE",
                      flexDirection: "column",
                      gap: 1,
                      "&:hover": {
                        background: "rgba(79,172,254,0.08)",
                        borderColor: "#4FACFE",
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                      Ask Questions
                    </Typography>
                    <Typography
                      sx={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}
                    >
                      Get clarification
                    </Typography>
                  </ActionButton>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}

        {/* No quiz data */}
        {!loading && !recommendations && !error && (
          <Paper
            sx={{
              p: 6,
              borderRadius: "20px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
            }}
          >
            <Quiz sx={{ fontSize: 64, color: "rgba(138,84,255,0.3)", mb: 2 }} />
            <Typography
              variant="h5"
              sx={{ color: "#FFFFFF", fontWeight: 700, mb: 1 }}
            >
              No Quiz Data Available
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", mb: 3 }}>
              Complete a quiz first to get personalized study recommendations
            </Typography>
            <ActionButton
              variant="contained"
              startIcon={<Quiz />}
              onClick={() => navigate("/quizzes")}
              sx={{
                background: "linear-gradient(135deg, #8A54FF, #9F6EFF)",
                color: "#fff",
              }}
            >
              Take a Quiz
            </ActionButton>
          </Paper>
        )}
      </Container>
    </PageContainer>
  );
}
