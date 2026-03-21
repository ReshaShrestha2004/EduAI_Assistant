import React, { useState, useEffect } from 'react';
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
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Description,
  Delete,
  CloudUpload,
  AutoAwesome,
  Psychology,
  School,
  Quiz,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const PageContainer = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #0F0B1A 0%, #1A122A 100%)',
  paddingTop: '40px',
  paddingBottom: '40px',
});

const DocumentCard = styled(Paper)({
  padding: '20px',
  borderRadius: '16px',
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.3s ease',
  height: '100%',
  minHeight: '280px',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(138, 84, 255, 0.2)',
    borderColor: 'rgba(138, 84, 255, 0.3)',
  },
});

const EmptyState = styled(Paper)({
  padding: '60px 40px',
  borderRadius: '24px',
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  textAlign: 'center',
});

export default function MyDocuments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents/');
      setDocuments(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load documents');
      setLoading(false);
    }
  };

  const handleDeleteClick = (document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/documents/${documentToDelete.id}`);
      setSuccess('Document deleted successfully!');
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      fetchDocuments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageContainer>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, animation: `${fadeIn} 0.6s ease-out` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                  My Documents
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
                  {documents.length} {documents.length === 1 ? 'document' : 'documents'} uploaded
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => navigate('/upload')}
              sx={{
                background: 'linear-gradient(135deg, #8A54FF, #9F6EFF)',
                color: '#fff',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #9F6EFF, #B88CFF)',
                },
              }}
            >
              Upload New
            </Button>
          </Box>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress sx={{ color: '#8A54FF' }} size={48} />
          </Box>
        ) : documents.length === 0 ? (
          <Box sx={{ animation: `${fadeIn} 0.6s ease-out 0.1s backwards` }}>
            <EmptyState>
              <Description sx={{ fontSize: 64, color: 'rgba(138, 84, 255, 0.5)', mb: 2 }} />
              <Typography variant="h5" sx={{ color: '#FFFFFF', mb: 2, fontWeight: 600 }}>
                No Documents Yet
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3 }}>
                Upload your first document to get started with AI-powered summaries
              </Typography>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => navigate('/upload')}
                sx={{
                  background: 'linear-gradient(135deg, #8A54FF, #9F6EFF)',
                  color: '#fff',
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #9F6EFF, #B88CFF)',
                  },
                }}
              >
                Upload Document
              </Button>
            </EmptyState>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {documents.map((doc, index) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id} sx={{ display: 'flex' }}>
                <DocumentCard
                  sx={{
                    animation: `${fadeIn} 0.6s ease-out ${index * 0.1}s backwards`,
                  }}
                >
                  {/* Document Info */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #8A54FF, #9F6EFF)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Description sx={{ color: '#FFFFFF', fontSize: 24 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
                      <Typography
                        sx={{
                          color: '#FFFFFF',
                          fontWeight: 600,
                          mb: 0.5,
                          fontSize: '15px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}
                        title={doc.original_filename}
                      >
                        {doc.original_filename}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {formatFileSize(doc.file_size)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Date */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      display: 'block',
                      mb: 2,
                    }}
                  >
                    Uploaded {formatDate(doc.uploaded_at)}
                  </Typography>

                  {/* PDF Chip */}
                  <Chip
                    label="PDF"
                    size="small"
                    sx={{
                      background: 'rgba(138, 84, 255, 0.2)',
                      color: '#B88CFF',
                      fontWeight: 600,
                      mb: 2,
                    }}
                  />

                  {/* Action Buttons — pushed to bottom */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 2, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      startIcon={<AutoAwesome />}
                      onClick={() => navigate('/summaries', { state: { documentId: doc.id } })}
                      sx={{
                        flex: 1,
                        minWidth: '100px',
                        background: 'rgba(138, 84, 255, 0.1)',
                        color: '#8A54FF',
                        textTransform: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        '&:hover': { background: 'rgba(138, 84, 255, 0.2)' },
                      }}
                    >
                      Summary
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Psychology />}
                      onClick={() => navigate('/qa-assistant', { state: { documentId: doc.id } })}
                      sx={{
                        flex: 1,
                        minWidth: '100px',
                        background: 'rgba(79, 172, 254, 0.1)',
                        color: '#4FACFE',
                        textTransform: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        '&:hover': { background: 'rgba(79, 172, 254, 0.2)' },
                      }}
                    >
                      Q&A
                    </Button>
                    <Button
                      size="small"
                      startIcon={<School />}
                      onClick={() => navigate('/flashcards', { state: { documentId: doc.id } })}
                      sx={{
                        flex: 1,
                        minWidth: '100px',
                        background: 'rgba(245, 87, 108, 0.1)',
                        color: '#F5576C',
                        textTransform: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        '&:hover': { background: 'rgba(245, 87, 108, 0.2)' },
                      }}
                    >
                      Flashcards
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Quiz />}
                      onClick={() => navigate('/quizzes', { state: { documentId: doc.id } })}
                      sx={{
                        flex: 1,
                        minWidth: '100px',
                        background: 'rgba(255, 217, 61, 0.1)',
                        color: '#FFD93D',
                        textTransform: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        '&:hover': { background: 'rgba(255, 217, 61, 0.2)' },
                      }}
                    >
                      Quiz
                    </Button>
                  </Box>

                  {/* Delete Button */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(doc)}
                      sx={{
                        color: '#EF4444',
                        background: 'rgba(239, 68, 68, 0.1)',
                        '&:hover': { background: 'rgba(239, 68, 68, 0.2)' },
                      }}
                      title="Delete"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </DocumentCard>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          PaperProps={{
            sx: {
              background: 'rgba(26, 18, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              maxWidth: '400px',
            },
          }}
        >
          <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700 }}>
            Delete Document?
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Are you sure you want to delete "{documentToDelete?.original_filename}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={handleDeleteCancel}
              disabled={deleting}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'none',
                '&:hover': { background: 'rgba(255, 255, 255, 0.05)' },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              variant="contained"
              sx={{
                background: '#EF4444',
                color: '#fff',
                textTransform: 'none',
                '&:hover': { background: '#DC2626' },
                '&:disabled': { background: 'rgba(239, 68, 68, 0.5)' },
              }}
            >
              {deleting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PageContainer>
  );
}