import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  recordResponse,
  sortBySpacedRepetition,
  getDocumentMastery,
  getConfidenceDisplay,
  getCardStats,
  resetDocument,
} from "../utils/spacedRepetition";
import TrendingUp from "@mui/icons-material/TrendingUp";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  IconButton,
  Card,
  CardContent,
  Chip,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  LinearProgress,
  Grid,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  ArrowBack,
  CloudUpload,
  Description,
  School,
  CheckCircle,
  FolderOpen,
  NavigateNext,
  NavigateBefore,
  Shuffle,
  Replay,
  AutoAwesome,
  SmartToy,
  Computer,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";

const fadeIn = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.5}`;

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
const FlashcardContainer = styled(Box)({
  perspective: "1000px",
  width: "100%",
  maxWidth: "700px",
  margin: "0 auto",
  minHeight: "320px",
  cursor: "pointer",
});
const FlashcardInner = styled(Box)(({ flipped }) => ({
  position: "relative",
  width: "100%",
  minHeight: "320px",
  transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
  transformStyle: "preserve-3d",
  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
}));
const FlashcardFace = styled(Paper)({
  position: "absolute",
  width: "100%",
  minHeight: "320px",
  backfaceVisibility: "hidden",
  borderRadius: "24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px",
  textAlign: "center",
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

const DifficultyChip = styled(Chip)(({ level }) => {
  const c = {
    easy: { bg: "rgba(107,207,127,0.15)", color: "#6BCF7F" },
    medium: { bg: "rgba(255,217,61,0.15)", color: "#FFD93D" },
    hard: { bg: "rgba(245,87,108,0.15)", color: "#F5576C" },
  }[level] || { bg: "rgba(255,217,61,0.15)", color: "#FFD93D" };
  return {
    background: c.bg,
    color: c.color,
    fontWeight: 700,
    fontSize: "13px",
  };
});

export default function Flashcards() {
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [masteredCards, setMasteredCards] = useState(new Set());
  const [aiMode, setAiMode] = useState("local");
  const [modelUsed, setModelUsed] = useState("");
  const [reviewCount, setReviewCount] = useState(0);

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
    setFlashcards([]);
    setCurrentIndex(0);
    setFlipped(false);
    setMasteredCards(new Set());
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedDocument) return;
    setGenerating(true);
    setError("");
    try {
      const response = await api.post(
        `/ai/documents/${selectedDocumentId}/flashcards`,
        { prefer: aiMode, num_items: 20 },
      );
      const cards = response.data.flashcards || [];
      setFlashcards(cards);
      setModelUsed(response.data.model_used || "");
      setCurrentIndex(0);
      setFlipped(false);
      setMasteredCards(new Set());
      setSuccess(`${cards.length} flashcards generated!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate flashcards");
    } finally {
      setGenerating(false);
    }
  };

  const filteredCards =
    difficultyFilter === "all"
      ? flashcards
      : flashcards.filter((c) => c.difficulty === difficultyFilter);
  const currentCard = filteredCards[currentIndex];

  const handleNext = () => {
    setFlipped(false);
    setTimeout(
      () => setCurrentIndex((p) => (p + 1) % filteredCards.length),
      150,
    );
  };
  const handlePrev = () => {
    setFlipped(false);
    setTimeout(
      () =>
        setCurrentIndex(
          (p) => (p - 1 + filteredCards.length) % filteredCards.length,
        ),
      150,
    );
  };
  const handleShuffle = () => {
    setFlashcards([...flashcards].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setFlipped(false);
  };
  const handleMarkMastered = () => {
    if (!currentCard) return;
    const n = new Set(masteredCards);
    n.has(currentCard.id) ? n.delete(currentCard.id) : n.add(currentCard.id);
    setMasteredCards(n);
  };
  const handleReset = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setMasteredCards(new Set());
    setDifficultyFilter("all");
    if (selectedDocumentId) {
      resetDocument(selectedDocumentId);
      setReviewCount((p) => p + 1);
    }
  };
  const mastery = selectedDocumentId
    ? getDocumentMastery(selectedDocumentId, filteredCards, reviewCount)
    : { masteryPercent: 0, mastered: 0, learning: 0, unseen: 0 };
  const progress = mastery.masteryPercent;

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, animation: `${fadeIn} 0.6s ease-out` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => navigate("/dashboard")}
              sx={{ color: "#f088c7" }}
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
                Flashcards
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", mt: 0.5 }}>
                Study with AI-generated flashcards from your documents
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

        <Box sx={{ animation: `${fadeIn} 0.6s ease-out 0.1s backwards` }}>
          {loading ? (
            <DocumentSelectorCard>
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress sx={{ color: "#F5576C" }} />
              </Box>
            </DocumentSelectorCard>
          ) : documents.length === 0 ? (
            <DocumentSelectorCard>
              <Box sx={{ textAlign: "center", py: 4 }}>
                <FolderOpen
                  sx={{ fontSize: 64, color: "rgba(245,87,108,0.5)", mb: 2 }}
                />
                <Typography variant="h6" sx={{ color: "#FFFFFF", mb: 2 }}>
                  No Documents Found
                </Typography>
                <ActionButton
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => navigate("/upload")}
                  sx={{
                    background: "linear-gradient(135deg, #F5576C, #FF8A9B)",
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
                <School sx={{ color: "#F5576C", fontSize: 28 }} />
                <Typography
                  variant="h6"
                  sx={{ color: "#FFFFFF", fontWeight: 700 }}
                >
                  Select a Document
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
                        <Description sx={{ fontSize: 20, color: "#F5576C" }} />
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
                      background: "rgba(245,87,108,0.1)",
                      mb: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Description sx={{ color: "#F5576C" }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                        {selectedDocument.original_filename}
                      </Typography>
                    </Box>
                    <Chip
                      label="Selected"
                      size="small"
                      sx={{
                        background: "rgba(107,207,127,0.2)",
                        color: "#6BCF7F",
                      }}
                    />
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        mb: 1,
                        fontSize: "14px",
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
                          borderColor: "rgba(255,255,255,0.15)",
                          "&.Mui-selected": {
                            background: "rgba(138,84,255,0.2)",
                            color: "#B88CFF",
                            borderColor: "#8A54FF",
                          },
                        }}
                      >
                        <Computer sx={{ mr: 1, fontSize: 18 }} /> Local
                      </ToggleButton>
                      <ToggleButton
                        value="groq"
                        sx={{
                          color: "rgba(255,255,255,0.6)",
                          borderColor: "rgba(255,255,255,0.15)",
                          "&.Mui-selected": {
                            background: "rgba(79,172,254,0.2)",
                            color: "#4FACFE",
                            borderColor: "#4FACFE",
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
                  startIcon={<School />}
                  onClick={handleGenerateFlashcards}
                  disabled={!selectedDocument || generating}
                  sx={{
                    background: "linear-gradient(135deg, #F5576C, #FF8A9B)",
                    color: "#fff",
                    py: 1.5,
                    "&:disabled": { background: "rgba(245,87,108,0.3)" },
                  }}
                >
                  {generating ? "Generating..." : "Generate Flashcards"}
                </ActionButton>
                {!selectedDocument && (
                  <ActionButton
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    onClick={() => navigate("/upload")}
                    sx={{
                      borderColor: "rgba(245, 87, 108, 0.5)",
                      color: "#F5576C",
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
                    <School
                      sx={{
                        color: "#F5576C",
                        animation: `${pulse} 2s infinite`,
                      }}
                    />
                    <Typography sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                      Generating Flashcards...
                    </Typography>
                  </Box>
                  <LinearProgress
                    sx={{
                      background: "rgba(245,87,108,0.2)",
                      "& .MuiLinearProgress-bar": {
                        background: "linear-gradient(90deg, #F5576C, #FF8A9B)",
                      },
                    }}
                  />
                </Box>
              )}
            </DocumentSelectorCard>
          )}
        </Box>

        {flashcards.length > 0 && !generating && (
          <Box sx={{ animation: `${fadeIn} 0.6s ease-out 0.2s backwards` }}>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: "20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                    {filteredCards.length} Cards
                  </Typography>
                  <Chip
                    label={`${mastery.mastered} mastered · ${mastery.learning} learning · ${mastery.unseen} new`}
                    sx={{
                      background:
                        progress === 100
                          ? "rgba(107,207,127,0.2)"
                          : "rgba(255,217,61,0.15)",
                      color: progress === 100 ? "#6BCF7F" : "#FFD93D",
                      fontWeight: 700,
                    }}
                  />
                  {modelUsed && (
                    <Chip
                      label={modelUsed.includes("groq") ? "Groq AI" : "Local"}
                      size="small"
                      sx={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "11px",
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {["all", "easy", "medium", "hard"].map((level) => (
                    <Chip
                      key={level}
                      label={level.charAt(0).toUpperCase() + level.slice(1)}
                      size="small"
                      onClick={() => {
                        setDifficultyFilter(level);
                        setCurrentIndex(0);
                        setFlipped(false);
                      }}
                      sx={{
                        cursor: "pointer",
                        background:
                          difficultyFilter === level
                            ? "rgba(245,87,108,0.25)"
                            : "rgba(255,255,255,0.08)",
                        color:
                          difficultyFilter === level
                            ? "#F5576C"
                            : "rgba(255,255,255,0.7)",
                        border:
                          difficultyFilter === level
                            ? "1px solid rgba(245,87,108,0.5)"
                            : "1px solid transparent",
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Shuffle">
                    <IconButton
                      onClick={handleShuffle}
                      sx={{ color: "#F5576C" }}
                    >
                      <Shuffle />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Smart Review (weakest first)">
                    <IconButton
                      onClick={() => {
                        const sorted = sortBySpacedRepetition(
                          selectedDocumentId,
                          flashcards,
                        );
                        setFlashcards(sorted);
                        setCurrentIndex(0);
                        setFlipped(false);
                      }}
                      sx={{ color: "#8A54FF" }}
                    >
                      <TrendingUp />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reset">
                    <IconButton
                      onClick={handleReset}
                      sx={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      <Replay />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  mt: 2,
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.1)",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, #F5576C, #6BCF7F)",
                    borderRadius: 3,
                  },
                }}
              />
            </Paper>

            {filteredCards.length > 0 && currentCard ? (
              <Box>
                <FlashcardContainer onClick={() => setFlipped(!flipped)}>
                  <FlashcardInner flipped={flipped}>
                    <FlashcardFace
                      sx={{
                        background:
                          "linear-gradient(135deg, rgba(245,87,108,0.15), rgba(255,138,155,0.08))",
                        border: "1px solid rgba(245,87,108,0.25)",
                      }}
                    >
                      <Chip
                        label="QUESTION"
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 20,
                          left: 20,
                          background: "rgba(245,87,108,0.2)",
                          color: "#F5576C",
                          fontWeight: 700,
                          fontSize: "11px",
                        }}
                      />
                      <DifficultyChip
                        label={currentCard.difficulty?.toUpperCase()}
                        level={currentCard.difficulty}
                        size="small"
                        sx={{ position: "absolute", top: 20, right: 20 }}
                      />
                      {(() => {
                        const stats = getCardStats(
                          selectedDocumentId,
                          currentCard,
                        );
                        const conf = getConfidenceDisplay(
                          stats.confidence,
                          stats.reviews,
                        );
                        return (
                          <Chip
                            label={conf.label}
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 56,
                              right: 20,
                              background: conf.bg,
                              color: conf.color,
                              fontWeight: 600,
                              fontSize: "11px",
                            }}
                          />
                        );
                      })()}
                      <Chip
                        label={currentCard.type}
                        size="small"
                        sx={{
                          position: "absolute",
                          bottom: 20,
                          left: 20,
                          background: "rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.5)",
                          fontSize: "11px",
                        }}
                      />
                      <Typography
                        variant="h5"
                        sx={{
                          color: "#FFFFFF",
                          fontWeight: 700,
                          lineHeight: 1.5,
                          maxWidth: "90%",
                        }}
                      >
                        {currentCard.front}
                      </Typography>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: "13px",
                          mt: 3,
                        }}
                      >
                        Click to reveal answer
                      </Typography>
                    </FlashcardFace>
                    <FlashcardFace
                      sx={{
                        transform: "rotateY(180deg)",
                        background:
                          "linear-gradient(135deg, rgba(107,207,127,0.12), rgba(78,205,196,0.08))",
                        border: "1px solid rgba(107,207,127,0.25)",
                      }}
                    >
                      <Chip
                        label="ANSWER"
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 20,
                          left: 20,
                          background: "rgba(107,207,127,0.2)",
                          color: "#6BCF7F",
                          fontWeight: 700,
                          fontSize: "11px",
                        }}
                      />
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.9)",
                          fontSize: "17px",
                          lineHeight: 1.8,
                          maxWidth: "90%",
                        }}
                      >
                        {currentCard.back}
                      </Typography>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: "13px",
                          mt: 3,
                        }}
                      >
                        Click to see question
                      </Typography>
                    </FlashcardFace>
                  </FlashcardInner>
                </FlashcardContainer>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    mt: 4,
                  }}
                >
                  <IconButton
                    onClick={handlePrev}
                    sx={{
                      color: "#FFFFFF",
                      background: "rgba(255,255,255,0.08)",
                      width: 56,
                      height: 56,
                      "&:hover": { background: "rgba(245,87,108,0.2)" },
                    }}
                  >
                    <NavigateBefore sx={{ fontSize: 32 }} />
                  </IconButton>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      fontWeight: 600,
                      minWidth: "80px",
                      textAlign: "center",
                    }}
                  >
                    {currentIndex + 1} / {filteredCards.length}
                  </Typography>
                  <IconButton
                    onClick={handleNext}
                    sx={{
                      color: "#FFFFFF",
                      background: "rgba(255,255,255,0.08)",
                      width: 56,
                      height: 56,
                      "&:hover": { background: "rgba(245,87,108,0.2)" },
                    }}
                  >
                    <NavigateNext sx={{ fontSize: 32 }} />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                    mt: 3,
                  }}
                >
                  <Button
                    onClick={() => {
                      recordResponse(selectedDocumentId, currentCard, "wrong");
                      setReviewCount((p) => p + 1);
                      handleNext();
                    }}
                    sx={{
                      borderRadius: "12px",
                      textTransform: "none",
                      fontWeight: 600,
                      px: 4,
                      py: 1.2,
                      background: "rgba(245,87,108,0.1)",
                      color: "#F5576C",
                      border: "1px solid rgba(245,87,108,0.2)",
                      fontSize: "15px",
                      "&:hover": { background: "rgba(245,87,108,0.2)" },
                    }}
                  >
                    Review Again
                  </Button>
                  <Button
                    onClick={() => {
                      recordResponse(selectedDocumentId, currentCard, "easy");
                      setReviewCount((p) => p + 1);
                      handleNext();
                    }}
                    sx={{
                      borderRadius: "12px",
                      textTransform: "none",
                      fontWeight: 600,
                      px: 4,
                      py: 1.2,
                      background: "rgba(107,207,127,0.1)",
                      color: "#6BCF7F",
                      border: "1px solid rgba(107,207,127,0.2)",
                      fontSize: "15px",
                      "&:hover": { background: "rgba(107,207,127,0.2)" },
                    }}
                  >
                    Got It
                  </Button>
                </Box>
              </Box>
            ) : (
              <Paper
                sx={{
                  p: 4,
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                  No flashcards match the selected filter.
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </Container>
    </PageContainer>
  );
}
