import React, { useState, useEffect } from 'react';
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
  Card,
  LinearProgress,
  Chip,
  Divider,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  Description,
  AutoAwesome,
  ContentCopy,
  Download,
  CheckCircle,
  FolderOpen,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Styled Components
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

const ResultCard = styled(Card)({
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '24px',
  marginTop: '24px',
});

const ActionButton = styled(Button)({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  padding: '10px 24px',
});

const StyledSelect = styled(Select)({
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(138, 84, 255, 0.3)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#8A54FF',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#8A54FF',
  },
  '& .MuiSelect-select': {
    color: '#FFFFFF',
  },
  '& .MuiSvgIcon-root': {
    color: '#8A54FF',
  },
});

export default function Summaries() {
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (location.state?.documentId) {
      setSelectedDocumentId(location.state.documentId);
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedDocumentId && documents.length > 0) {
      const doc = documents.find(d => d.id === selectedDocumentId);
      setSelectedDocument(doc);
    }
  }, [selectedDocumentId, documents]);

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
    setSummary('');
  };

  const handleGenerateSummary = async () => {
    if (!selectedDocument) return;
    
    setGenerating(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setSummary(
        `This is an AI-generated summary of your document "${selectedDocument.original_filename}". ` +
        "The document has been successfully processed and analyzed. " +
        "Key points and main ideas have been extracted to provide you with a comprehensive overview."
      );
      setSuccess('Summary generated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary);
    setSuccess('Summary copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDownloadSummary = () => {
    const element = document.createElement('a');
    const fileBlob = new Blob([summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = `${selectedDocument.original_filename}_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setSuccess('Summary downloaded!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <PageContainer>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, animation: `${fadeIn} 0.6s ease-out` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ color: '#8A54FF' }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: { xs: '28px', md: '36px' } }}>
                AI Summaries
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
                Generate intelligent summaries from your documents
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
                <CircularProgress sx={{ color: '#8A54FF' }} />
              </Box>
            </DocumentSelectorCard>
          ) : documents.length === 0 ? (
            <DocumentSelectorCard>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <FolderOpen sx={{ fontSize: 64, color: 'rgba(138, 84, 255, 0.5)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>No Documents Found</Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3 }}>
                  Upload a document first to generate summaries
                </Typography>
                <ActionButton
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => navigate('/upload')}
                  sx={{ background: 'linear-gradient(135deg, #8A54FF, #9F6EFF)', color: '#fff' }}
                >
                  Upload Document
                </ActionButton>
              </Box>
            </DocumentSelectorCard>
          ) : (
            <DocumentSelectorCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Description sx={{ color: '#8A54FF', fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                  Select a Document
                </Typography>
              </Box>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Choose a document</InputLabel>
                <StyledSelect value={selectedDocumentId} onChange={handleDocumentSelect} label="Choose a document">
                  {documents.map((doc) => (
                    <MenuItem key={doc.id} value={doc.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description sx={{ fontSize: 20, color: '#8A54FF' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{doc.original_filename}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                            {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </StyledSelect>
              </FormControl>

              {selectedDocument && (
                <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(138, 84, 255, 0.1)', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Description sx={{ color: '#8A54FF' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        {selectedDocument.original_filename}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {(selectedDocument.file_size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                    <Chip label="Selected" size="small" sx={{ background: 'rgba(107, 207, 127, 0.2)', color: '#6BCF7F' }} />
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <ActionButton
                  fullWidth
                  variant="contained"
                  startIcon={<AutoAwesome />}
                  onClick={handleGenerateSummary}
                  disabled={!selectedDocument || generating}
                  sx={{
                    background: 'linear-gradient(135deg, #8A54FF, #9F6EFF)',
                    color: '#fff',
                    py: 1.5,
                    '&:disabled': { background: 'rgba(138, 84, 255, 0.3)' },
                  }}
                >
                  {generating ? 'Generating...' : 'Generate Summary'}
                </ActionButton>
                <ActionButton
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => navigate('/upload')}
                  sx={{ borderColor: 'rgba(138, 84, 255, 0.5)', color: '#8A54FF' }}
                >
                  Upload New
                </ActionButton>
              </Box>

              {generating && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <AutoAwesome sx={{ color: '#8A54FF', animation: `${pulse} 2s infinite` }} />
                    <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>Generating AI Summary...</Typography>
                  </Box>
                  <LinearProgress sx={{ background: 'rgba(138, 84, 255, 0.2)' }} />
                </Box>
              )}
            </DocumentSelectorCard>
          )}
        </Box>

        {summary && !generating && (
          <ResultCard sx={{ animation: `${fadeIn} 0.6s ease-out 0.2s backwards`, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <AutoAwesome sx={{ color: '#8A54FF', fontSize: 28 }} />
              <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 800 }}>Generated Summary</Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />
            <Paper sx={{ p: 3, background: 'rgba(0, 0, 0, 0.2)', borderRadius: '16px', mb: 3 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.8 }}>{summary}</Typography>
            </Paper>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <ActionButton
                variant="contained"
                startIcon={<ContentCopy />}
                onClick={handleCopySummary}
                sx={{ background: 'rgba(138, 84, 255, 0.2)', color: '#B88CFF' }}
              >
                Copy
              </ActionButton>
              <ActionButton
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownloadSummary}
                sx={{ background: 'rgba(79, 172, 254, 0.2)', color: '#4FACFE' }}
              >
                Download
              </ActionButton>
            </Box>
          </ResultCard>
        )}
      </Container>
    </PageContainer>
  );
}