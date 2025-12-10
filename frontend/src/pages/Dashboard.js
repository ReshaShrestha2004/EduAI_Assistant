import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Quiz as QuizIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Welcome back, {user?.full_name || 'User'}!
        </Typography>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>
        <Typography variant="body1">
          <strong>Email:</strong> {user?.email}
        </Typography>
        <Typography variant="body1">
          <strong>Member since:</strong>{' '}
          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
        </Typography>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Features (Coming Soon)
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DescriptionIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Documents
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Upload and manage your study materials
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SchoolIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Summaries
              </Typography>
              <Typography variant="body2" color="textSecondary">
                AI-generated document summaries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <QuizIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Flashcards
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Auto-generated study flashcards
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
              <Typography variant="body2" color="textSecondary">
                Practice quizzes and assessments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;