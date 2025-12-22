import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  Button,
  Chip,
  Alert,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  Description,
  AutoAwesome,
  Psychology,
  School,
  Quiz,
  CheckCircle,
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

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

// Styled Components
const PageContainer = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #0F0B1A 0%, #1A122A 100%)',
  paddingTop: '40px',
  paddingBottom: '40px',
});

const UploadZone = styled(Paper)(({ isDragging }) => ({
  padding: '80px 40px',
  borderRadius: '24px',
  border: `2px dashed ${isDragging ? '#8A54FF' : 'rgba(138, 84, 255, 0.3)'}`,
  background: isDragging ? 'rgba(138, 84, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(20px)',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#8A54FF',
    background: 'rgba(138, 84, 255, 0.08)',
    transform: 'translateY(-4px)',
  },
}));

const SuccessCard = styled(Paper)({
  padding: '40px',
  borderRadius: '24px',
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(107, 207, 127, 0.3)',
  textAlign: 'center',
  animation: `${scaleIn} 0.5s ease-out`,
});

const ActionCard = styled(Paper)(({ bgcolor, bordercolor }) => ({
  padding: '24px',
  borderRadius: '20px',
  background: `${bgcolor}08`,
  backdropFilter: 'blur(20px)',
  border: `2px solid ${bordercolor}30`,
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  textAlign: 'center',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-8px)',
    background: `${bgcolor}15`,
    borderColor: bordercolor,
    boxShadow: `0 12px 40px ${bordercolor}40`,
  },
}));

export default function UploadDocument() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const actions = [
    {
      title: 'Generate Summary',
      description: 'Get an AI-powered summary of your document',
      icon: <AutoAwesome sx={{ fontSize: 48 }} />,
      color: '#8A54FF',
      route: '/summaries',
    },
    {
      title: 'Ask Questions',
      description: 'Chat with AI about your document',
      icon: <Psychology sx={{ fontSize: 48 }} />,
      color: '#4FACFE',
      route: '/qa-assistant',
    },
    {
      title: 'Create Flashcards',
      description: 'Generate flashcards for studying',
      icon: <School sx={{ fontSize: 48 }} />,
      color: '#F5576C',
      route: '/flashcards',
    },
    {
      title: 'Take Quiz',
      description: 'Test your knowledge with MCQs',
      icon: <Quiz sx={{ fontSize: 48 }} />,
      color: '#FFD93D',
      route: '/quizzes',
    },
  ];

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
      handleUpload(selectedFile);
    } else {
      setError('Please upload a PDF file');
      setFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError('');
      handleUpload(droppedFile);
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleUpload = async (fileToUpload) => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedDocument(response.data);
      setUploading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload document');
      setUploading(false);
      setFile(null);
    }
  };

  const handleActionClick = (route) => {
    // Navigate with document ID
    navigate(route, { state: { documentId: uploadedDocument.id } });
  };

  const handleUploadAnother = () => {
    setFile(null);
    setUploadedDocument(null);
    setError('');
  };

  return (
    <PageContainer>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, animation: `${fadeIn} 0.6s ease-out` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton
              onClick={() => navigate('/dashboard')}
              sx={{
                color: '#8A54FF',
                '&:hover': { background: 'rgba(138, 84, 255, 0.1)' },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: '#FFFFFF',
                  fontSize: { xs: '28px', md: '36px' },
                }}
              >
                Upload Document
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
                Upload your PDF and choose what you want to do with it
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Upload or Success State */}
        {!uploadedDocument ? (
          <Box sx={{ animation: `${fadeIn} 0.6s ease-out 0.1s backwards` }}>
            {!uploading ? (
              <UploadZone
                isDragging={isDragging}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload-input').click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <CloudUpload
                  sx={{
                    fontSize: 80,
                    color: '#8A54FF',
                    mb: 3,
                  }}
                />
                <Typography variant="h4" sx={{ color: '#FFFFFF', mb: 2, fontWeight: 700 }}>
                  Upload Your Document
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3, fontSize: '18px' }}>
                  Drag and drop your PDF here, or click to browse
                </Typography>
                <Chip
                  label="PDF files only • Max 50 MB"
                  sx={{
                    background: 'rgba(138, 84, 255, 0.2)',
                    color: '#B88CFF',
                    fontWeight: 600,
                    fontSize: '14px',
                    py: 2.5,
                  }}
                />
              </UploadZone>
            ) : (
              <Paper
                sx={{
                  p: 6,
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center',
                }}
              >
                <CloudUpload
                  sx={{
                    fontSize: 64,
                    color: '#8A54FF',
                    mb: 3,
                    animation: `${pulse} 2s infinite`,
                  }}
                />
                <Typography variant="h5" sx={{ color: '#FFFFFF', mb: 2, fontWeight: 700 }}>
                  Uploading Document...
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3 }}>
                  {file?.name}
                </Typography>
                <LinearProgress
                  sx={{
                    maxWidth: '400px',
                    mx: 'auto',
                    height: 8,
                    borderRadius: 4,
                    background: 'rgba(138, 84, 255, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #8A54FF, #9F6EFF)',
                      borderRadius: 4,
                    },
                  }}
                />
              </Paper>
            )}
          </Box>
        ) : (
          // Success State with Action Buttons
          <Box sx={{ animation: `${fadeIn} 0.6s ease-out` }}>
            <SuccessCard>
              <CheckCircle
                sx={{
                  fontSize: 80,
                  color: '#6BCF7F',
                  mb: 3,
                }}
              />
              <Typography variant="h4" sx={{ color: '#FFFFFF', mb: 2, fontWeight: 800 }}>
                Document Uploaded Successfully!
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  mb: 1,
                }}
              >
                <Description sx={{ color: '#8A54FF', fontSize: 24 }} />
                <Typography sx={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 600 }}>
                  {uploadedDocument.original_filename}
                </Typography>
              </Box>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4 }}>
                {(uploadedDocument.file_size / 1024 / 1024).toFixed(2)} MB
              </Typography>

              <Typography variant="h5" sx={{ color: '#FFFFFF', mb: 4, fontWeight: 700 }}>
                What would you like to do?
              </Typography>

              {/* Action Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {actions.map((action, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <ActionCard
                      bgcolor={action.color}
                      bordercolor={action.color}
                      onClick={() => handleActionClick(action.route)}
                    >
                      <Box sx={{ color: action.color, mb: 2 }}>
                        {action.icon}
                      </Box>
                      <Typography
                        sx={{
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '20px',
                          mb: 1,
                        }}
                      >
                        {action.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '14px',
                        }}
                      >
                        {action.description}
                      </Typography>
                    </ActionCard>
                  </Grid>
                ))}
              </Grid>

              {/* Bottom Actions */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={handleUploadAnother}
                  sx={{
                    borderColor: 'rgba(138, 84, 255, 0.5)',
                    color: '#8A54FF',
                    borderRadius: '12px',
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#8A54FF',
                      background: 'rgba(138, 84, 255, 0.1)',
                    },
                  }}
                >
                  Upload Another Document
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/my-documents')}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '12px',
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      background: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  View All Documents
                </Button>
              </Box>
            </SuccessCard>
          </Box>
        )}

        {/* Info Section */}
        <Box sx={{ mt: 6, animation: `${fadeIn} 0.6s ease-out 0.3s backwards` }}>
          <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 3, textAlign: 'center' }}>
            Supported Features
          </Typography>
          <Grid container spacing={3}>
            {actions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    textAlign: 'center',
                    height: '100%',
                  }}
                >
                  <Box sx={{ color: action.color, mb: 2 }}>
                    {React.cloneElement(action.icon, { sx: { fontSize: 40 } })}
                  </Box>
                  <Typography sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1 }}>
                    {action.title}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                    {action.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </PageContainer>
  );
}