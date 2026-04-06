import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  LinearProgress,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
} from "@mui/material";
import {
  ArrowBack,
  CloudUpload,
  Description,
  Quiz,
  CheckCircle,
  Cancel,
  FolderOpen,
  NavigateNext,
  Replay,
  AutoAwesome,
  School,
  SmartToy,
  Computer,
  Add,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";

const fadeIn = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.5}`;
const scaleIn = keyframes`from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}`;

const PageContainer = styled(Box)({
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0F0B1A 0%, #1A122A 100%)",
  paddingTop: "40px",
  paddingBottom: "40px",
});
const DocumentSelectorCard = styled(Paper)({
  padding: "32px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.1)",
  marginBottom: "24px",
});
const QuestionCard = styled(Paper)({
  padding: "32px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.1)",
});
const ActionButton = styled(Button)({
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 600,
  padding: "10px 24px",
});
const StyledSelect = styled(Select)({
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(138,84,255,0.3)" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#8A54FF" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#8A54FF" },
  "& .MuiSelect-select": { color: "#FFFFFF" },
  "& .MuiSvgIcon-root": { color: "#8A54FF" },
});
const ResultCard = styled(Paper)({
  padding: "40px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.1)",
  animation: `${scaleIn} 0.5s ease-out`,
});

const OptionCard = styled(Paper)(({
  selected,
  correct,
  incorrect,
  showResult,
}) => {
  let bg = "rgba(255,255,255,0.04)",
    border = "1px solid rgba(255,255,255,0.1)";
  if (showResult && correct) {
    bg = "rgba(107,207,127,0.12)";
    border = "1px solid rgba(107,207,127,0.4)";
  } else if (showResult && incorrect) {
    bg = "rgba(239,68,68,0.12)";
    border = "1px solid rgba(239,68,68,0.4)";
  } else if (selected) {
    bg = "rgba(138,84,255,0.12)";
    border = "1px solid rgba(138,84,255,0.4)";
  }
  return {
    padding: "16px 20px",
    borderRadius: "16px",
    background: bg,
    border,
    cursor: showResult ? "default" : "pointer",
    transition: "all 0.2s ease",
    ...(!showResult && {
      "&:hover": {
        background: "rgba(138,84,255,0.08)",
        borderColor: "rgba(138,84,255,0.3)",
        transform: "translateX(4px)",
      },
    }),
  };
});

const DifficultyChip = styled(Chip)(({ level }) => {
  const c = {
    recall: { bg: "rgba(138,84,255,0.15)", color: "#B88CFF" },
    comprehension: { bg: "rgba(79,172,254,0.15)", color: "#4FACFE" },
    application: { bg: "rgba(245,87,108,0.15)", color: "#F5576C" },
  }[level] || { bg: "rgba(138,84,255,0.15)", color: "#B88CFF" };
  return {
    background: c.bg,
    color: c.color,
    fontWeight: 700,
    fontSize: "12px",
  };
});

const markdownComponents = {
  p: ({ children }) => (
    <Typography
      sx={{
        color: "rgba(255,255,255,0.75)",
        lineHeight: 1.7,
        mb: 1,
        fontSize: "14px",
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
        color: "rgba(255,255,255,0.75)",
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

export default function Quizzes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [aiMode, setAiMode] = useState("local");
  const [modelUsed, setModelUsed] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, []);
  useEffect(() => {
    if (location.state?.documentId)
      setSelectedDocumentId(location.state.documentId);
  }, [location.state]);
  useEffect(() => {
    if (selectedDocumentId && documents.length > 0)
      setSelectedDocument(documents.find((d) => d.id === selectedDocumentId));
  }, [selectedDocumentId, documents]);

  const fetchDocuments = async () => {
    try {
      const r = await api.get("/documents/");
      setDocuments(r.data);
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };
  const handleDocumentSelect = (event) => {
    setSelectedDocumentId(event.target.value);
    resetQuiz();
  };

  const handleGenerateQuiz = async () => {
    if (!selectedDocument) return;
    setGenerating(true);
    setError("");
    setShowReview(false);
    try {
      const response = await api.post(
        `/ai/documents/${selectedDocumentId}/mcqs`,
        { prefer: aiMode, num_items: 10, difficulty: difficultyFilter },
      );
      const mcqs = response.data.questions || [];
      if (mcqs.length === 0) {
        setError(
          "No questions could be generated. Try a different document or AI mode.",
        );
        setGenerating(false);
        return;
      }
      setQuestions(mcqs);
      setModelUsed(response.data.model_used || "");
      setQuizStarted(true);
      setCurrentQuestionIndex(0);
      setScore(0);
      setAnswers([]);
      setQuizCompleted(false);
      setSelectedAnswer(null);
      setShowResult(false);
      setSuccess(`${mcqs.length} questions generated`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate quiz");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!selectedDocument) return;
    setGenerating(true);
    setError("");
    setShowReview(false);
    try {
      const response = await api.post(
        `/ai/documents/${selectedDocumentId}/mcqs`,
        { prefer: aiMode, num_items: 10, difficulty: difficultyFilter },
      );
      const mcqs = response.data.questions || [];
      if (mcqs.length === 0) {
        setError("Could not generate additional questions.");
        setGenerating(false);
        return;
      }
      setQuestions(mcqs);
      setModelUsed(response.data.model_used || "");
      setCurrentQuestionIndex(0);
      setScore(0);
      setAnswers([]);
      setQuizCompleted(false);
      setSelectedAnswer(null);
      setShowResult(false);
      setSuccess(`${mcqs.length} new questions ready`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to generate more questions",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (idx) => {
    if (!showResult) setSelectedAnswer(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    const q = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === q.correctAnswer;
    if (isCorrect) setScore((p) => p + 1);
    setAnswers((p) => [
      ...p,
      {
        questionIndex: currentQuestionIndex,
        selectedAnswer,
        isCorrect,
        correctAnswer: q.correctAnswer,
      },
    ]);
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      setQuizCompleted(true);
      setQuizHistory((prev) => [
        ...prev,
        {
          score,
          total: questions.length,
          difficulty: difficultyFilter,
          model: modelUsed,
          timestamp: Date.now(),
        },
      ]);
    } else {
      setCurrentQuestionIndex((p) => p + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setQuizCompleted(false);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowReview(false);
  };

  const getScoreMessage = () => {
    const pct = (score / questions.length) * 100;
    if (pct >= 90) return { text: "Excellent Performance", color: "#6BCF7F" };
    if (pct >= 70) return { text: "Strong Performance", color: "#4FACFE" };
    if (pct >= 50) return { text: "Satisfactory", color: "#B88CFF" };
    return { text: "Needs Improvement", color: "#F5576C" };
  };

  const getTotalStats = () => {
    const totalCorrect = quizHistory.reduce((sum, h) => sum + h.score, 0);
    const totalQ = quizHistory.reduce((sum, h) => sum + h.total, 0);
    return {
      totalCorrect,
      totalQ,
      attempts: quizHistory.length,
      percentage: totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0,
    };
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;
  const wrongAnswers = answers.filter((a) => !a.isCorrect);
  const correctAnswersArr = answers.filter((a) => a.isCorrect);

  return (
    <PageContainer>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, animation: `${fadeIn} 0.6s ease-out` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => navigate("/dashboard")}
              sx={{ color: "#8A54FF" }}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: "#FFFFFF",
                  fontSize: { xs: "28px", md: "36px" },
                }}
              >
                Practice Tests
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", mt: 0.5 }}>
                Test your knowledge with AI generated quizzes
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
            {success}
          </Alert>
        )}

        {/* Session Stats - Always Visible When There Is History */}
        {quizHistory.length > 0 && (
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: "16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              animation: `${fadeIn} 0.3s ease-out`,
            }}
          >
            <Typography
              sx={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
                mb: 2,
              }}
            >
              Session Performance
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 5,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "28px",
                    lineHeight: 1,
                  }}
                >
                  {getTotalStats().attempts}
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "13px",
                    mt: 0.5,
                  }}
                >
                  Quizzes Taken
                </Typography>
              </Box>
              <Box
                sx={{
                  width: "1px",
                  height: "40px",
                  background: "rgba(255,255,255,0.08)",
                }}
              />
              <Box>
                <Typography
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "28px",
                    lineHeight: 1,
                  }}
                >
                  {getTotalStats().totalCorrect}
                  <span
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontWeight: 400,
                      fontSize: "16px",
                    }}
                  >
                    /{getTotalStats().totalQ}
                  </span>
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "13px",
                    mt: 0.5,
                  }}
                >
                  Correct Answers
                </Typography>
              </Box>
              <Box
                sx={{
                  width: "1px",
                  height: "40px",
                  background: "rgba(255,255,255,0.08)",
                }}
              />
              <Box>
                <Typography
                  sx={{
                    color:
                      getTotalStats().percentage >= 70
                        ? "#6BCF7F"
                        : getTotalStats().percentage >= 50
                          ? "#B88CFF"
                          : "#F5576C",
                    fontWeight: 800,
                    fontSize: "28px",
                    lineHeight: 1,
                  }}
                >
                  {getTotalStats().percentage}%
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "13px",
                    mt: 0.5,
                  }}
                >
                  Accuracy
                </Typography>
              </Box>
              <Box
                sx={{
                  width: "1px",
                  height: "40px",
                  background: "rgba(255,255,255,0.08)",
                  display: { xs: "none", md: "block" },
                }}
              />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", flex: 1 }}>
                {quizHistory.map((h, i) => {
                  const pct = Math.round((h.score / h.total) * 100);
                  return (
                    <Box key={i} sx={{ textAlign: "center", minWidth: "48px" }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mx: "auto",
                          background:
                            pct >= 70
                              ? "rgba(107,207,127,0.12)"
                              : pct >= 50
                                ? "rgba(138,84,255,0.12)"
                                : "rgba(245,87,108,0.12)",
                          border: `1px solid ${pct >= 70 ? "rgba(107,207,127,0.25)" : pct >= 50 ? "rgba(138,84,255,0.25)" : "rgba(245,87,108,0.25)"}`,
                        }}
                      >
                        <Typography
                          sx={{
                            color:
                              pct >= 70
                                ? "#6BCF7F"
                                : pct >= 50
                                  ? "#B88CFF"
                                  : "#F5576C",
                            fontWeight: 700,
                            fontSize: "13px",
                          }}
                        >
                          {pct}%
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.25)",
                          fontSize: "10px",
                          mt: 0.5,
                        }}
                      >
                        #{i + 1}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Paper>
        )}

        {/* Document Selector */}
        {!quizStarted && (
          <Box sx={{ animation: `${fadeIn} 0.6s ease-out 0.1s backwards` }}>
            {loading ? (
              <DocumentSelectorCard>
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress sx={{ color: "#8A54FF" }} />
                </Box>
              </DocumentSelectorCard>
            ) : documents.length === 0 ? (
              <DocumentSelectorCard>
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <FolderOpen
                    sx={{ fontSize: 64, color: "rgba(138,84,255,0.4)", mb: 2 }}
                  />
                  <Typography variant="h6" sx={{ color: "#FFFFFF", mb: 2 }}>
                    No Documents Found
                  </Typography>
                  <ActionButton
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={() => navigate("/upload")}
                    sx={{
                      background: "linear-gradient(135deg, #8A54FF, #9F6EFF)",
                      color: "#fff",
                    }}
                  >
                    Upload Document
                  </ActionButton>
                </Box>
              </DocumentSelectorCard>
            ) : (
              <DocumentSelectorCard>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
                >
                  <Quiz sx={{ color: "#8A54FF", fontSize: 28 }} />
                  <Typography
                    variant="h6"
                    sx={{ color: "#FFFFFF", fontWeight: 700 }}
                  >
                    Configure Your Quiz
                  </Typography>
                </Box>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>
                    Choose a document
                  </InputLabel>
                  <StyledSelect
                    value={selectedDocumentId}
                    onChange={handleDocumentSelect}
                    label="Choose a document"
                  >
                    {documents.map((doc) => (
                      <MenuItem key={doc.id} value={doc.id}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Description
                            sx={{ fontSize: 20, color: "#8A54FF" }}
                          />
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>
                              {doc.original_filename}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "rgba(0,0,0,0.6)" }}
                            >
                              {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </StyledSelect>
                </FormControl>

                {selectedDocument && (
                  <>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: "12px",
                        background: "rgba(138,84,255,0.06)",
                        mb: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Description sx={{ color: "#8A54FF" }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                          {selectedDocument.original_filename}
                        </Typography>
                      </Box>
                      <Chip
                        label="Selected"
                        size="small"
                        sx={{
                          background: "rgba(107,207,127,0.15)",
                          color: "#6BCF7F",
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.7)",
                        fontWeight: 600,
                        mb: 1.5,
                        fontSize: "14px",
                      }}
                    >
                      Difficulty Level
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        mb: 3,
                        flexWrap: "wrap",
                      }}
                    >
                      {[
                        { value: "all", label: "All Levels" },
                        { value: "recall", label: "Recall" },
                        { value: "comprehension", label: "Comprehension" },
                        { value: "application", label: "Application" },
                      ].map((level) => (
                        <Chip
                          key={level.value}
                          label={level.label}
                          onClick={() => setDifficultyFilter(level.value)}
                          sx={{
                            cursor: "pointer",
                            py: 2.5,
                            px: 1,
                            fontSize: "13px",
                            fontWeight: 600,
                            background:
                              difficultyFilter === level.value
                                ? "rgba(138,84,255,0.15)"
                                : "rgba(255,255,255,0.04)",
                            color:
                              difficultyFilter === level.value
                                ? "#B88CFF"
                                : "rgba(255,255,255,0.5)",
                            border:
                              difficultyFilter === level.value
                                ? "1px solid rgba(138,84,255,0.3)"
                                : "1px solid rgba(255,255,255,0.08)",
                            "&:hover": { background: "rgba(138,84,255,0.1)" },
                          }}
                        />
                      ))}
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          mb: 1,
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        AI Engine
                      </Typography>
                      <ToggleButtonGroup
                        value={aiMode}
                        exclusive
                        onChange={(e, v) => {
                          if (v) setAiMode(v);
                        }}
                        size="small"
                      >
                        <ToggleButton
                          value="local"
                          sx={{
                            color: "rgba(255,255,255,0.6)",
                            borderColor: "rgba(255,255,255,0.12)",
                            "&.Mui-selected": {
                              background: "rgba(138,84,255,0.15)",
                              color: "#B88CFF",
                              borderColor: "rgba(138,84,255,0.3)",
                            },
                          }}
                        >
                          <Computer sx={{ mr: 1, fontSize: 18 }} /> Local
                        </ToggleButton>
                        <ToggleButton
                          value="groq"
                          sx={{
                            color: "rgba(255,255,255,0.6)",
                            borderColor: "rgba(255,255,255,0.12)",
                            "&.Mui-selected": {
                              background: "rgba(79,172,254,0.15)",
                              color: "#4FACFE",
                              borderColor: "rgba(79,172,254,0.3)",
                            },
                          }}
                        >
                          <SmartToy sx={{ mr: 1, fontSize: 18 }} /> Cloud
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </>
                )}

                <Box sx={{ display: "flex", gap: 2 }}>
                  <ActionButton
                    fullWidth
                    variant="contained"
                    startIcon={<Quiz />}
                    onClick={handleGenerateQuiz}
                    disabled={!selectedDocument || generating}
                    sx={{
                      background: "linear-gradient(135deg, #8A54FF, #9F6EFF)",
                      color: "#fff",
                      py: 1.5,
                      "&:disabled": {
                        background: "rgba(138,84,255,0.2)",
                        color: "rgba(255,255,255,0.3)",
                      },
                    }}
                  >
                    {generating ? "Generating..." : "Start Quiz"}
                  </ActionButton>
                  {!selectedDocument && (
                    <ActionButton
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      onClick={() => navigate("/upload")}
                      sx={{
                        borderColor: "rgba(138,84,255,0.3)",
                        color: "#8A54FF",
                      }}
                    >
                      Upload New
                    </ActionButton>
                  )}
                </Box>

                {generating && (
                  <Box sx={{ mt: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <CircularProgress size={20} sx={{ color: "#8A54FF" }} />
                      <Typography
                        sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}
                      >
                        Preparing your practice test...
                      </Typography>
                    </Box>
                    <LinearProgress
                      sx={{
                        background: "rgba(138,84,255,0.1)",
                        "& .MuiLinearProgress-bar": {
                          background:
                            "linear-gradient(90deg, #8A54FF, #B88CFF)",
                        },
                      }}
                    />
                  </Box>
                )}
              </DocumentSelectorCard>
            )}
          </Box>
        )}

        {/* Quiz In Progress */}
        {quizStarted && !quizCompleted && currentQuestion && (
          <Box sx={{ animation: `${fadeIn} 0.6s ease-out` }}>
            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: "16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <Typography
                  sx={{ color: "#FFFFFF", fontWeight: 600, fontSize: "14px" }}
                >
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}
                  >
                    {score}/{answers.length} correct
                  </Typography>
                  <DifficultyChip
                    label={(
                      currentQuestion.difficulty || "recall"
                    ).toUpperCase()}
                    level={currentQuestion.difficulty || "recall"}
                    size="small"
                  />
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.06)",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, #8A54FF, #B88CFF)",
                    borderRadius: 2,
                  },
                }}
              />
            </Paper>

            <QuestionCard sx={{ mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  mb: 4,
                  lineHeight: 1.5,
                  fontSize: { xs: "18px", md: "22px" },
                }}
              >
                {currentQuestion.question}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {(currentQuestion.options || []).map((option, index) => (
                  <OptionCard
                    key={index}
                    selected={selectedAnswer === index}
                    correct={
                      showResult && index === currentQuestion.correctAnswer
                    }
                    incorrect={
                      showResult &&
                      selectedAnswer === index &&
                      index !== currentQuestion.correctAnswer
                    }
                    showResult={showResult}
                    onClick={() => handleAnswerSelect(index)}
                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        background:
                          showResult && index === currentQuestion.correctAnswer
                            ? "rgba(107,207,127,0.2)"
                            : showResult &&
                                selectedAnswer === index &&
                                index !== currentQuestion.correctAnswer
                              ? "rgba(239,68,68,0.2)"
                              : selectedAnswer === index
                                ? "rgba(138,84,255,0.2)"
                                : "rgba(255,255,255,0.04)",
                        color:
                          showResult && index === currentQuestion.correctAnswer
                            ? "#6BCF7F"
                            : showResult &&
                                selectedAnswer === index &&
                                index !== currentQuestion.correctAnswer
                              ? "#EF4444"
                              : selectedAnswer === index
                                ? "#B88CFF"
                                : "rgba(255,255,255,0.4)",
                        fontWeight: 700,
                        fontSize: "14px",
                      }}
                    >
                      {showResult && index === currentQuestion.correctAnswer ? (
                        <CheckCircle sx={{ fontSize: 20 }} />
                      ) : showResult &&
                        selectedAnswer === index &&
                        index !== currentQuestion.correctAnswer ? (
                        <Cancel sx={{ fontSize: 20 }} />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </Box>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.85)",
                        fontSize: "15px",
                        fontWeight: selectedAnswer === index ? 600 : 400,
                      }}
                    >
                      {option}
                    </Typography>
                  </OptionCard>
                ))}
              </Box>

              {showResult && currentQuestion.explanation && (
                <Box
                  sx={{
                    mt: 3,
                    p: 3,
                    borderRadius: "14px",
                    background:
                      selectedAnswer === currentQuestion.correctAnswer
                        ? "rgba(107,207,127,0.06)"
                        : "rgba(245,87,108,0.06)",
                    border: `1px solid ${selectedAnswer === currentQuestion.correctAnswer ? "rgba(107,207,127,0.15)" : "rgba(245,87,108,0.15)"}`,
                    animation: `${fadeIn} 0.3s ease-out`,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color:
                        selectedAnswer === currentQuestion.correctAnswer
                          ? "#6BCF7F"
                          : "#F5576C",
                      fontSize: "14px",
                      mb: 1,
                    }}
                  >
                    {selectedAnswer === currentQuestion.correctAnswer
                      ? "Correct"
                      : "Incorrect"}
                  </Typography>
                  <ReactMarkdown components={markdownComponents}>
                    {currentQuestion.explanation}
                  </ReactMarkdown>
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mt: 4,
                  justifyContent: "flex-end",
                }}
              >
                {!showResult ? (
                  <ActionButton
                    variant="contained"
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    sx={{
                      background: "linear-gradient(135deg, #8A54FF, #9F6EFF)",
                      color: "#fff",
                      px: 4,
                      "&:disabled": {
                        background: "rgba(138,84,255,0.15)",
                        color: "rgba(255,255,255,0.3)",
                      },
                    }}
                  >
                    Submit
                  </ActionButton>
                ) : (
                  <ActionButton
                    variant="contained"
                    endIcon={<NavigateNext />}
                    onClick={handleNextQuestion}
                    sx={{
                      background: "linear-gradient(135deg, #8A54FF, #9F6EFF)",
                      color: "#fff",
                      px: 4,
                    }}
                  >
                    {currentQuestionIndex + 1 >= questions.length
                      ? "View Results"
                      : "Next"}
                  </ActionButton>
                )}
              </Box>
            </QuestionCard>
          </Box>
        )}

        {/* Results */}
        {quizCompleted && (
          <Box sx={{ animation: `${fadeIn} 0.6s ease-out` }}>
            <ResultCard>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  mb: 3,
                }}
              >
                Quiz Complete
              </Typography>

              <Typography
                variant="h2"
                sx={{
                  color: getScoreMessage().color,
                  fontWeight: 900,
                  mb: 0.5,
                  fontSize: { xs: "48px", md: "64px" },
                }}
              >
                {Math.round((score / questions.length) * 100)}%
              </Typography>
              <Typography
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "20px",
                  mb: 0.5,
                }}
              >
                {getScoreMessage().text}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.4)", mb: 4 }}>
                {score} correct out of {questions.length} questions
              </Typography>

              {/* Score Breakdown Bar */}
              <Box sx={{ maxWidth: "400px", mx: "auto", mb: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    height: "8px",
                    borderRadius: "4px",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Box
                    sx={{
                      width: `${(score / questions.length) * 100}%`,
                      background: "#6BCF7F",
                      transition: "width 1s ease-out",
                    }}
                  />
                  <Box
                    sx={{
                      width: `${((questions.length - score) / questions.length) * 100}%`,
                      background: "rgba(245,87,108,0.4)",
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 1,
                  }}
                >
                  <Typography
                    sx={{ color: "rgba(107,207,127,0.8)", fontSize: "12px" }}
                  >
                    {score} correct
                  </Typography>
                  <Typography
                    sx={{ color: "rgba(245,87,108,0.6)", fontSize: "12px" }}
                  >
                    {questions.length - score} incorrect
                  </Typography>
                </Box>
              </Box>

              {/* Actions */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  mb: 3,
                }}
              >
                <ActionButton
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleGenerateMore}
                  disabled={generating}
                  sx={{
                    background: "linear-gradient(135deg, #8A54FF, #9F6EFF)",
                    color: "#fff",
                    px: 3,
                    "&:disabled": { background: "rgba(138,84,255,0.2)" },
                  }}
                >
                  {generating ? "Generating..." : "Generate More"}
                </ActionButton>
                <ActionButton
                  variant="outlined"
                  startIcon={<Replay />}
                  onClick={() => {
                    setQuizCompleted(false);
                    setCurrentQuestionIndex(0);
                    setScore(0);
                    setAnswers([]);
                    setSelectedAnswer(null);
                    setShowResult(false);
                  }}
                  sx={{
                    borderColor: "rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.7)",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.3)",
                      background: "rgba(255,255,255,0.04)",
                    },
                  }}
                >
                  Retake
                </ActionButton>
                <ActionButton
                  variant="outlined"
                  startIcon={<School />}
                  onClick={() =>
                    navigate("/flashcards", {
                      state: { documentId: selectedDocumentId },
                    })
                  }
                  sx={{
                    borderColor: "rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.7)",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.3)",
                      background: "rgba(255,255,255,0.04)",
                    },
                  }}
                >
                  Flashcards
                </ActionButton>
                <ActionButton
                  variant="outlined"
                  onClick={resetQuiz}
                  sx={{
                    borderColor: "rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.7)",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.3)",
                      background: "rgba(255,255,255,0.04)",
                    },
                  }}
                >
                  New Quiz
                </ActionButton>
              </Box>

              {generating && (
                <Box sx={{ mb: 3 }}>
                  <LinearProgress
                    sx={{
                      background: "rgba(138,84,255,0.1)",
                      "& .MuiLinearProgress-bar": {
                        background: "linear-gradient(90deg, #8A54FF, #B88CFF)",
                      },
                    }}
                  />
                </Box>
              )}

              {/* Review Toggle */}
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", my: 2 }} />
              <ActionButton
                fullWidth
                endIcon={showReview ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setShowReview(!showReview)}
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  py: 1.5,
                  "&:hover": {
                    background: "rgba(255,255,255,0.04)",
                    color: "#FFFFFF",
                  },
                }}
              >
                {showReview
                  ? "Hide Review"
                  : `Review All ${questions.length} Questions`}
              </ActionButton>
            </ResultCard>

            {/* Full Review */}
            <Collapse in={showReview}>
              <Box sx={{ mt: 3 }}>
                {/* Wrong Answers */}
                {wrongAnswers.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        mb: 2,
                      }}
                    >
                      Incorrect ({wrongAnswers.length})
                    </Typography>
                    {wrongAnswers.map((answer, idx) => {
                      const q = questions[answer.questionIndex];
                      if (!q) return null;
                      return (
                        <Paper
                          key={idx}
                          sx={{
                            p: 3,
                            mb: 2,
                            borderRadius: "14px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(245,87,108,0.12)",
                            animation: `${fadeIn} 0.3s ease-out ${idx * 0.05}s backwards`,
                          }}
                        >
                          <Typography
                            sx={{
                              color: "#FFFFFF",
                              fontWeight: 600,
                              mb: 2,
                              lineHeight: 1.5,
                              fontSize: "15px",
                            }}
                          >
                            <span
                              style={{
                                color: "rgba(255,255,255,0.3)",
                                marginRight: "8px",
                              }}
                            >
                              {answer.questionIndex + 1}.
                            </span>
                            {q.question}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              ml: 2,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                p: 1.5,
                                borderRadius: "10px",
                                background: "rgba(239,68,68,0.06)",
                                border: "1px solid rgba(239,68,68,0.1)",
                              }}
                            >
                              <Cancel sx={{ fontSize: 16, color: "#EF4444" }} />
                              <Typography
                                sx={{
                                  color: "rgba(239,68,68,0.8)",
                                  fontSize: "14px",
                                }}
                              >
                                Your answer: {q.options[answer.selectedAnswer]}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                p: 1.5,
                                borderRadius: "10px",
                                background: "rgba(107,207,127,0.06)",
                                border: "1px solid rgba(107,207,127,0.1)",
                              }}
                            >
                              <CheckCircle
                                sx={{ fontSize: 16, color: "#6BCF7F" }}
                              />
                              <Typography
                                sx={{
                                  color: "rgba(107,207,127,0.8)",
                                  fontSize: "14px",
                                }}
                              >
                                Correct answer: {q.options[q.correctAnswer]}
                              </Typography>
                            </Box>
                            {q.explanation && (
                              <Box
                                sx={{
                                  mt: 1,
                                  p: 2,
                                  borderRadius: "10px",
                                  background: "rgba(255,255,255,0.02)",
                                }}
                              >
                                <ReactMarkdown components={markdownComponents}>
                                  {q.explanation}
                                </ReactMarkdown>
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}

                {/* Correct Answers */}
                {correctAnswersArr.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        mb: 2,
                      }}
                    >
                      Correct ({correctAnswersArr.length})
                    </Typography>
                    {correctAnswersArr.map((answer, idx) => {
                      const q = questions[answer.questionIndex];
                      if (!q) return null;
                      return (
                        <Paper
                          key={idx}
                          sx={{
                            p: 2.5,
                            mb: 1.5,
                            borderRadius: "14px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            animation: `${fadeIn} 0.3s ease-out ${idx * 0.03}s backwards`,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <CheckCircle
                              sx={{
                                fontSize: 16,
                                color: "rgba(107,207,127,0.5)",
                              }}
                            />
                            <Typography
                              sx={{
                                color: "rgba(255,255,255,0.6)",
                                fontSize: "14px",
                                lineHeight: 1.5,
                              }}
                            >
                              <span
                                style={{
                                  color: "rgba(255,255,255,0.25)",
                                  marginRight: "6px",
                                }}
                              >
                                {answer.questionIndex + 1}.
                              </span>
                              {q.question}
                            </Typography>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        )}
      </Container>
    </PageContainer>
  );
}
