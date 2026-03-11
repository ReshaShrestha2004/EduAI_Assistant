import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box, Container, Typography, Button, Paper, IconButton, Card, CardContent,
  Chip, Alert, MenuItem, Select, FormControl, InputLabel, CircularProgress,
  LinearProgress, Grid, Divider, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  ArrowBack, CloudUpload, Description, Quiz, CheckCircle, Cancel, FolderOpen,
  NavigateNext, Replay, EmojiEvents, AutoAwesome, School, SmartToy, Computer,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

const fadeIn = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.5}`;
const scaleIn = keyframes`from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}`;

const PageContainer = styled(Box)({ minHeight: '100vh', background: 'linear-gradient(180deg, #0F0B1A 0%, #1A122A 100%)', paddingTop: '40px', paddingBottom: '40px' });
const DocumentSelectorCard = styled(Paper)({ padding: '32px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' });
const QuestionCard = styled(Paper)({ padding: '32px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' });
const ActionButton = styled(Button)({ borderRadius: '12px', textTransform: 'none', fontWeight: 600, padding: '10px 24px' });
const StyledSelect = styled(Select)({ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(138,84,255,0.3)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD93D' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD93D' }, '& .MuiSelect-select': { color: '#FFFFFF' }, '& .MuiSvgIcon-root': { color: '#FFD93D' } });
const ResultCard = styled(Paper)({ padding: '48px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', animation: `${scaleIn} 0.5s ease-out` });

const OptionCard = styled(Paper)(({ selected, correct, incorrect, showResult }) => {
  let bg = 'rgba(255,255,255,0.04)', border = '1px solid rgba(255,255,255,0.1)';
  if (showResult && correct) { bg = 'rgba(107,207,127,0.15)'; border = '1px solid rgba(107,207,127,0.5)'; }
  else if (showResult && incorrect) { bg = 'rgba(239,68,68,0.15)'; border = '1px solid rgba(239,68,68,0.5)'; }
  else if (selected) { bg = 'rgba(255,217,61,0.12)'; border = '1px solid rgba(255,217,61,0.4)'; }
  return { padding: '16px 20px', borderRadius: '16px', background: bg, border, cursor: showResult ? 'default' : 'pointer', transition: 'all 0.2s ease', ...(!showResult && { '&:hover': { background: 'rgba(255,217,61,0.08)', borderColor: 'rgba(255,217,61,0.3)', transform: 'translateX(4px)' } }) };
});

const DifficultyChip = styled(Chip)(({ level }) => {
  const c = { recall: { bg: 'rgba(107,207,127,0.15)', color: '#6BCF7F' }, comprehension: { bg: 'rgba(255,217,61,0.15)', color: '#FFD93D' }, application: { bg: 'rgba(245,87,108,0.15)', color: '#F5576C' } }[level] || { bg: 'rgba(255,217,61,0.15)', color: '#FFD93D' };
  return { background: c.bg, color: c.color, fontWeight: 700, fontSize: '12px' };
});

export default function Quizzes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [aiMode, setAiMode] = useState('local');
  const [modelUsed, setModelUsed] = useState('');

  useEffect(() => { fetchDocuments(); }, []);
  useEffect(() => { if (location.state?.documentId) setSelectedDocumentId(location.state.documentId); }, [location.state]);
  useEffect(() => { if (selectedDocumentId && documents.length > 0) setSelectedDocument(documents.find(d => d.id === selectedDocumentId)); }, [selectedDocumentId, documents]);

  const fetchDocuments = async () => { try { const r = await api.get('/documents/'); setDocuments(r.data); } catch { setError('Failed to load documents'); } finally { setLoading(false); } };
  const handleDocumentSelect = (event) => { setSelectedDocumentId(event.target.value); resetQuiz(); };

  const handleGenerateQuiz = async () => {
    if (!selectedDocument) return;
    setGenerating(true); setError('');
    try {
      const response = await api.post(`/ai/documents/${selectedDocumentId}/mcqs`, { prefer: aiMode, num_items: 10, difficulty: difficultyFilter });
      const mcqs = response.data.questions || [];
      setQuestions(mcqs);
      setModelUsed(response.data.model_used || '');
      setQuizStarted(true); setCurrentQuestionIndex(0); setScore(0); setAnswers([]); setQuizCompleted(false); setSelectedAnswer(null); setShowResult(false);
      setSuccess(`${mcqs.length} questions generated!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate quiz');
    } finally { setGenerating(false); }
  };

  const handleAnswerSelect = (idx) => { if (!showResult) setSelectedAnswer(idx); };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    const q = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === q.correctAnswer;
    if (isCorrect) setScore(p => p + 1);
    setAnswers(p => [...p, { questionId: q.id, selectedAnswer, isCorrect }]);
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 >= questions.length) { setQuizCompleted(true); }
    else { setCurrentQuestionIndex(p => p + 1); setSelectedAnswer(null); setShowResult(false); }
  };

  const resetQuiz = () => { setQuestions([]); setQuizStarted(false); setCurrentQuestionIndex(0); setScore(0); setAnswers([]); setQuizCompleted(false); setSelectedAnswer(null); setShowResult(false); };

  const getScoreMessage = () => {
    const pct = (score / questions.length) * 100;
    if (pct >= 90) return { text: 'Outstanding!', color: '#6BCF7F' };
    if (pct >= 70) return { text: 'Great job!', color: '#4FACFE' };
    if (pct >= 50) return { text: 'Good effort!', color: '#FFD93D' };
    return { text: 'Keep studying!', color: '#F5576C' };
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, animation: `${fadeIn} 0.6s ease-out` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ color: '#FFD93D' }}><ArrowBack /></IconButton>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: { xs: '28px', md: '36px' } }}>Practice Tests</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>Test your knowledge with AI-generated MCQ quizzes</Typography>
            </Box>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>{success}</Alert>}

        {!quizStarted && (
          <Box sx={{ animation: `${fadeIn} 0.6s ease-out 0.1s backwards` }}>
            {loading ? (
              <DocumentSelectorCard><Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#FFD93D' }} /></Box></DocumentSelectorCard>
            ) : documents.length === 0 ? (
              <DocumentSelectorCard>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <FolderOpen sx={{ fontSize: 64, color: 'rgba(255,217,61,0.5)', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>No Documents Found</Typography>
                  <ActionButton variant="contained" startIcon={<CloudUpload />} onClick={() => navigate('/upload')} sx={{ background: 'linear-gradient(135deg, #FFD93D, #FF9B6A)', color: '#1A122A' }}>Upload Document</ActionButton>
                </Box>
              </DocumentSelectorCard>
            ) : (
              <DocumentSelectorCard>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Quiz sx={{ color: '#FFD93D', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>Configure Your Quiz</Typography>
                </Box>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>Choose a document</InputLabel>
                  <StyledSelect value={selectedDocumentId} onChange={handleDocumentSelect} label="Choose a document">
                    {documents.map(doc => (
                      <MenuItem key={doc.id} value={doc.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Description sx={{ fontSize: 20, color: '#FFD93D' }} />
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>{doc.original_filename}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.6)' }}>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </StyledSelect>
                </FormControl>

                {selectedDocument && (
                  <>
                    <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(255,217,61,0.08)', mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Description sx={{ color: '#FFD93D' }} />
                      <Box sx={{ flexGrow: 1 }}><Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>{selectedDocument.original_filename}</Typography></Box>
                      <Chip label="Selected" size="small" sx={{ background: 'rgba(107,207,127,0.2)', color: '#6BCF7F' }} />
                    </Box>

                    <Typography sx={{ color: '#FFFFFF', fontWeight: 600, mb: 2 }}>Difficulty Level</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                      {[{ value: 'all', label: 'All Levels' }, { value: 'recall', label: 'Recall' }, { value: 'comprehension', label: 'Comprehension' }, { value: 'application', label: 'Application' }].map(level => (
                        <Chip key={level.value} label={level.label} onClick={() => setDifficultyFilter(level.value)}
                          sx={{ cursor: 'pointer', py: 2.5, px: 1, fontSize: '14px', fontWeight: 600, background: difficultyFilter === level.value ? 'rgba(255,217,61,0.2)' : 'rgba(255,255,255,0.06)', color: difficultyFilter === level.value ? '#FFD93D' : 'rgba(255,255,255,0.7)', border: difficultyFilter === level.value ? '1px solid rgba(255,217,61,0.4)' : '1px solid rgba(255,255,255,0.1)' }} />
                      ))}
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 1, fontSize: '14px' }}>AI Engine</Typography>
                      <ToggleButtonGroup value={aiMode} exclusive onChange={(e, v) => { if (v) setAiMode(v); }} size="small">
                        <ToggleButton value="local" sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.15)', '&.Mui-selected': { background: 'rgba(138,84,255,0.2)', color: '#B88CFF', borderColor: '#8A54FF' } }}>
                          <Computer sx={{ mr: 1, fontSize: 18 }} /> Local
                        </ToggleButton>
                        <ToggleButton value="groq" sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.15)', '&.Mui-selected': { background: 'rgba(79,172,254,0.2)', color: '#4FACFE', borderColor: '#4FACFE' } }}>
                          <SmartToy sx={{ mr: 1, fontSize: 18 }} /> Cloud
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <ActionButton fullWidth variant="contained" startIcon={<Quiz />} onClick={handleGenerateQuiz} disabled={!selectedDocument || generating}
                    sx={{ background: 'linear-gradient(135deg, #FFD93D, #FF9B6A)', color: '#1A122A', py: 1.5, '&:disabled': { background: 'rgba(255,217,61,0.3)', color: 'rgba(255,255,255,0.4)' } }}>
                    {generating ? 'Generating...' : 'Start Quiz'}
                  </ActionButton>
                  <ActionButton variant="outlined" startIcon={<CloudUpload />} onClick={() => navigate('/upload')} sx={{ borderColor: 'rgba(255,217,61,0.4)', color: '#FFD93D' }}>Upload New</ActionButton>
                </Box>

                {generating && (
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Quiz sx={{ color: '#FFD93D', animation: `${pulse} 2s infinite` }} />
                      <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>Generating Quiz Questions...</Typography>
                    </Box>
                    <LinearProgress sx={{ background: 'rgba(255,217,61,0.2)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #FFD93D, #FF9B6A)' } }} />
                  </Box>
                )}
              </DocumentSelectorCard>
            )}
          </Box>
        )}

        {quizStarted && !quizCompleted && currentQuestion && (
          <Box sx={{ animation: `${fadeIn} 0.6s ease-out` }}>
            <Paper sx={{ p: 2.5, mb: 3, borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>Question {currentQuestionIndex + 1} of {questions.length}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip label={`Score: ${score}/${answers.length}`} size="small" sx={{ background: 'rgba(107,207,127,0.15)', color: '#6BCF7F', fontWeight: 700 }} />
                  <DifficultyChip label={(currentQuestion.difficulty || 'recall').toUpperCase()} level={currentQuestion.difficulty || 'recall'} size="small" />
                </Box>
              </Box>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #FFD93D, #FF9B6A)', borderRadius: 3 } }} />
            </Paper>

            <QuestionCard sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 4, lineHeight: 1.5 }}>{currentQuestion.question}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(currentQuestion.options || []).map((option, index) => (
                  <OptionCard key={index} selected={selectedAnswer === index} correct={showResult && index === currentQuestion.correctAnswer} incorrect={showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer} showResult={showResult}
                    onClick={() => handleAnswerSelect(index)} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: showResult && index === currentQuestion.correctAnswer ? 'rgba(107,207,127,0.3)' : showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer ? 'rgba(239,68,68,0.3)' : selectedAnswer === index ? 'rgba(255,217,61,0.25)' : 'rgba(255,255,255,0.06)',
                      color: showResult && index === currentQuestion.correctAnswer ? '#6BCF7F' : showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer ? '#EF4444' : selectedAnswer === index ? '#FFD93D' : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '14px' }}>
                      {showResult && index === currentQuestion.correctAnswer ? <CheckCircle sx={{ fontSize: 20 }} /> : showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer ? <Cancel sx={{ fontSize: 20 }} /> : String.fromCharCode(65 + index)}
                    </Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: selectedAnswer === index ? 600 : 400 }}>{option}</Typography>
                  </OptionCard>
                ))}
              </Box>

              {showResult && currentQuestion.explanation && (
                <Box sx={{ mt: 3, p: 3, borderRadius: '16px', background: selectedAnswer === currentQuestion.correctAnswer ? 'rgba(107,207,127,0.08)' : 'rgba(245,87,108,0.08)', border: `1px solid ${selectedAnswer === currentQuestion.correctAnswer ? 'rgba(107,207,127,0.2)' : 'rgba(245,87,108,0.2)'}`, animation: `${fadeIn} 0.3s ease-out` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AutoAwesome sx={{ fontSize: 18, color: selectedAnswer === currentQuestion.correctAnswer ? '#6BCF7F' : '#F5576C' }} />
                    <Typography sx={{ fontWeight: 700, color: selectedAnswer === currentQuestion.correctAnswer ? '#6BCF7F' : '#F5576C' }}>
                      {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>{currentQuestion.explanation}</Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                {!showResult ? (
                  <ActionButton variant="contained" onClick={handleSubmitAnswer} disabled={selectedAnswer === null}
                    sx={{ background: 'linear-gradient(135deg, #FFD93D, #FF9B6A)', color: '#1A122A', px: 4, '&:disabled': { background: 'rgba(255,217,61,0.2)', color: 'rgba(255,255,255,0.3)' } }}>Submit Answer</ActionButton>
                ) : (
                  <ActionButton variant="contained" endIcon={<NavigateNext />} onClick={handleNextQuestion}
                    sx={{ background: 'linear-gradient(135deg, #FFD93D, #FF9B6A)', color: '#1A122A', px: 4 }}>
                    {currentQuestionIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
                  </ActionButton>
                )}
              </Box>
            </QuestionCard>
          </Box>
        )}

        {quizCompleted && (
          <Box sx={{ animation: `${fadeIn} 0.6s ease-out` }}>
            <ResultCard>
              <EmojiEvents sx={{ fontSize: 80, color: getScoreMessage().color, mb: 2 }} />
              <Typography variant="h3" sx={{ color: '#FFFFFF', fontWeight: 900, mb: 1 }}>{getScoreMessage().text}</Typography>
              <Typography variant="h4" sx={{ color: getScoreMessage().color, fontWeight: 800, mb: 1 }}>{score} / {questions.length}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 4, fontSize: '18px' }}>You scored {Math.round((score / questions.length) * 100)}%</Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 4, flexWrap: 'wrap' }}>
                <Box sx={{ textAlign: 'center' }}><Typography variant="h4" sx={{ color: '#6BCF7F', fontWeight: 800 }}>{score}</Typography><Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Correct</Typography></Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                <Box sx={{ textAlign: 'center' }}><Typography variant="h4" sx={{ color: '#EF4444', fontWeight: 800 }}>{questions.length - score}</Typography><Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Incorrect</Typography></Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <ActionButton variant="contained" startIcon={<Replay />} onClick={() => { resetQuiz(); handleGenerateQuiz(); }}
                  sx={{ background: 'linear-gradient(135deg, #FFD93D, #FF9B6A)', color: '#1A122A', px: 4 }}>Retake Quiz</ActionButton>
                <ActionButton variant="outlined" startIcon={<School />} onClick={() => navigate('/flashcards', { state: { documentId: selectedDocumentId } })}
                  sx={{ borderColor: 'rgba(245,87,108,0.5)', color: '#F5576C' }}>Study Flashcards</ActionButton>
                <ActionButton variant="outlined" onClick={resetQuiz} sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)' }}>New Quiz</ActionButton>
              </Box>
            </ResultCard>
          </Box>
        )}
      </Container>
    </PageContainer>
  );
}