import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  IconButton,
  TextField,
  Chip,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  Description,
  Psychology,
  CheckCircle,
  FolderOpen,
  Send,
  AutoAwesome,
  Person,
  SmartToy,
  ContentCopy,
  Delete,
  Computer,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const typingDot = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
`;

const PageContainer = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #0F0B1A 0%, #1A122A 100%)',
  paddingTop: '40px',
  paddingBottom: '40px',
});

const DocumentSelectorCard = styled(Paper)({
  padding: '32px',
  borderRadius: '24px',
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: '24px',
});

const ChatContainer = styled(Paper)({
  borderRadius: '24px',
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: '600px',
});

const MessagesArea = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  '&::-webkit-scrollbar': { width: '6px' },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: '3px' },
});

const MessageBubble = styled(Box)(({ isUser }) => ({
  maxWidth: '80%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  display: 'flex',
  gap: '12px',
  flexDirection: isUser ? 'row-reverse' : 'row',
  animation: `${fadeIn} 0.3s ease-out`,
}));

const InputArea = styled(Box)({
  padding: '16px 24px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(255, 255, 255, 0.02)',
});

const ActionButton = styled(Button)({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  padding: '10px 24px',
});

const StyledSelect = styled(Select)({
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(138, 84, 255, 0.3)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4FACFE' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4FACFE' },
  '& .MuiSelect-select': { color: '#FFFFFF' },
  '& .MuiSvgIcon-root': { color: '#4FACFE' },
});

const SuggestedQuestion = styled(Chip)({
  cursor: 'pointer',
  background: 'rgba(79, 172, 254, 0.1)',
  border: '1px solid rgba(79, 172, 254, 0.25)',
  color: '#4FACFE',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'rgba(79, 172, 254, 0.2)',
    borderColor: '#4FACFE',
    transform: 'translateY(-2px)',
  },
});

const SUGGESTED_QUESTIONS = [
  'What are the main topics covered?',
  'Can you summarize the key findings?',
  'What methodology is described?',
  'Explain the main concepts',
  'What are the conclusions?',
];

export default function QAAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const [aiMode, setAiMode] = useState('local');

  useEffect(() => { fetchDocuments(); }, []);

  useEffect(() => {
    if (location.state?.documentId) setSelectedDocumentId(location.state.documentId);
  }, [location.state]);

  useEffect(() => {
    if (selectedDocumentId && documents.length > 0) {
      setSelectedDocument(documents.find(d => d.id === selectedDocumentId));
    }
  }, [selectedDocumentId, documents]);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents/');
      setDocuments(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load documents');
      setLoading(false);
    }
  };

  const handleDocumentSelect = (event) => {
    setSelectedDocumentId(event.target.value);
    setMessages([]);
    setChatStarted(false);
  };

  const handleSendMessage = async (messageText) => {
    const text = messageText || inputValue.trim();
    if (!text || !selectedDocument) return;

    setChatStarted(true);

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await api.post(`/ai/documents/${selectedDocumentId}/ask`, {
        question: text,
        prefer: aiMode,
      });

      const aiResponse = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.data.sources || [],
        modelUsed: response.data.model_used,
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to get response';
      const errorResponse = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMsg}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    setChatStarted(false);
  };

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, animation: `${fadeIn} 0.6s ease-out` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ color: '#4FACFE' }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: { xs: '28px', md: '36px' } }}>
                Q&A Assistant
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
                Ask questions about your documents and get instant answers
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>{success}</Alert>}

        <Box sx={{ animation: `${fadeIn} 0.6s ease-out 0.1s backwards` }}>
          {loading ? (
            <DocumentSelectorCard>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#4FACFE' }} />
              </Box>
            </DocumentSelectorCard>
          ) : documents.length === 0 ? (
            <DocumentSelectorCard>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <FolderOpen sx={{ fontSize: 64, color: 'rgba(79, 172, 254, 0.5)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>No Documents Found</Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3 }}>
                  Upload a document first to start asking questions
                </Typography>
                <ActionButton
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => navigate('/upload')}
                  sx={{ background: 'linear-gradient(135deg, #4FACFE, #00F2FE)', color: '#fff' }}
                >
                  Upload Document
                </ActionButton>
              </Box>
            </DocumentSelectorCard>
          ) : (
            <DocumentSelectorCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Psychology sx={{ color: '#4FACFE', fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                  Select a Document to Chat With
                </Typography>
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Choose a document</InputLabel>
                <StyledSelect value={selectedDocumentId} onChange={handleDocumentSelect} label="Choose a document">
                  {documents.map((doc) => (
                    <MenuItem key={doc.id} value={doc.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description sx={{ fontSize: 20, color: '#4FACFE' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{doc.original_filename}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                            {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </StyledSelect>
              </FormControl>

              {selectedDocument && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(79, 172, 254, 0.1)', display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Description sx={{ color: '#4FACFE' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>{selectedDocument.original_filename}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Ready to chat</Typography>
                    </Box>
                    <Chip label="Active" size="small" sx={{ background: 'rgba(107,207,127,0.2)', color: '#6BCF7F' }} />
                  </Box>
                  <ToggleButtonGroup value={aiMode} exclusive onChange={(e, val) => { if (val) setAiMode(val); }} size="small">
                    <ToggleButton value="local" sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.15)', '&.Mui-selected': { background: 'rgba(138,84,255,0.2)', color: '#B88CFF', borderColor: '#8A54FF' } }}>
                      <Computer sx={{ mr: 0.5, fontSize: 16 }} /> Local
                    </ToggleButton>
                    <ToggleButton value="groq" sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.15)', '&.Mui-selected': { background: 'rgba(79,172,254,0.2)', color: '#4FACFE', borderColor: '#4FACFE' } }}>
                      <SmartToy sx={{ mr: 0.5, fontSize: 16 }} /> Cloud
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}
            </DocumentSelectorCard>
          )}
        </Box>

        {selectedDocument && (
          <Box sx={{ animation: `${fadeIn} 0.6s ease-out 0.2s backwards` }}>
            <ChatContainer>
              <MessagesArea>
                {!chatStarted && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Avatar sx={{ width: 72, height: 72, background: 'linear-gradient(135deg, #4FACFE, #00F2FE)', mx: 'auto', mb: 3 }}>
                      <SmartToy sx={{ fontSize: 36 }} />
                    </Avatar>
                    <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 1 }}>
                      Ask me anything about your document
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 4, maxWidth: '500px', mx: 'auto' }}>
                      I'll analyze "{selectedDocument.original_filename}" and answer your questions using {aiMode === 'groq' ? 'Cloud AI' : 'Local AI'}.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <SuggestedQuestion key={i} label={q} onClick={() => handleSendMessage(q)} />
                      ))}
                    </Box>
                  </Box>
                )}

                {messages.map((msg) => (
                  <MessageBubble key={msg.id} isUser={msg.role === 'user'}>
                    <Avatar sx={{ width: 36, height: 36, background: msg.role === 'user' ? 'linear-gradient(135deg, #8A54FF, #9F6EFF)' : 'linear-gradient(135deg, #4FACFE, #00F2FE)', flexShrink: 0 }}>
                      {msg.role === 'user' ? <Person sx={{ fontSize: 20 }} /> : <SmartToy sx={{ fontSize: 20 }} />}
                    </Avatar>
                    <Box sx={{ maxWidth: 'calc(100% - 48px)' }}>
                      <Paper sx={{
                        p: 2.5,
                        borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: msg.role === 'user' ? 'linear-gradient(135deg, rgba(138,84,255,0.25), rgba(159,110,255,0.15))' : msg.isError ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${msg.role === 'user' ? 'rgba(138,84,255,0.3)' : msg.isError ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </Typography>
                        {msg.sources && msg.sources.length > 0 && (
                          <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <AutoAwesome sx={{ fontSize: 14 }} /> Sources from document:
                            </Typography>
                            {msg.sources.map((src, i) => (
                              <Typography key={i} variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', ml: 2, mb: 0.5, fontStyle: 'italic' }}>
                                [{i + 1}] {src.text || src}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {msg.modelUsed && (
                          <Chip
                            label={msg.modelUsed.includes('groq') ? 'Groq AI' : 'FLAN-T5'}
                            size="small"
                            sx={{ mt: 1, height: '20px', fontSize: '10px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
                          />
                        )}
                      </Paper>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, px: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>{msg.timestamp}</Typography>
                        {msg.role === 'assistant' && !msg.isError && (
                          <IconButton size="small" onClick={() => handleCopyMessage(msg.content)} sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#4FACFE' } }}>
                            <ContentCopy sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </MessageBubble>
                ))}

                {isTyping && (
                  <MessageBubble isUser={false}>
                    <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #4FACFE, #00F2FE)', flexShrink: 0 }}>
                      <SmartToy sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Paper sx={{ p: 2, borderRadius: '20px 20px 20px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 1, alignItems: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', background: '#4FACFE', animation: `${typingDot} 1.4s infinite`, animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </Paper>
                  </MessageBubble>
                )}
                <div ref={messagesEndRef} />
              </MessagesArea>

              <InputArea>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Ask a question about your document..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isTyping}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px', background: 'rgba(255,255,255,0.06)', color: '#FFFFFF',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(79,172,254,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: '#4FACFE' },
                        '& textarea': { color: '#FFFFFF' },
                      },
                    }}
                  />
                  <IconButton
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    sx={{ background: 'linear-gradient(135deg, #4FACFE, #00F2FE)', color: '#fff', width: 48, height: 48, '&:hover': { background: 'linear-gradient(135deg, #3E9BED, #00E1ED)' }, '&:disabled': { background: 'rgba(79,172,254,0.2)', color: 'rgba(255,255,255,0.3)' } }}
                  >
                    <Send />
                  </IconButton>
                </Box>
                {chatStarted && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
                    <Button size="small" startIcon={<Delete />} onClick={handleClearChat} sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'none', fontSize: '12px', '&:hover': { color: '#EF4444', background: 'rgba(239,68,68,0.1)' } }}>
                      Clear chat
                    </Button>
                  </Box>
                )}
              </InputArea>
            </ChatContainer>
          </Box>
        )}
      </Container>
    </PageContainer>
  );
}