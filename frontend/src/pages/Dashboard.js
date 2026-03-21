import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Button,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  AutoStories,
  Quiz,
  School,
  Psychology,
  Logout,
  Upload,
  TrendingUp,
  Description,
  ArrowForward,
  LocalFireDepartment,
  CloudUpload,
  AutoAwesome,
  QuestionAnswer,
  DeleteOutline,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import logo from '../assets/logo.png';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Styled Components
const DashboardContainer = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #0F0B1A 0%, #1A122A 100%)',
});

const Header = styled(Box)({
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '20px 0',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
});

const FeatureCard = styled(Card)(({ bgcolor, hoverbg }) => ({
  background: bgcolor,
  borderRadius: '24px',
  padding: '32px',
  height: '280px',
  cursor: 'pointer',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
    background: hoverbg,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '150px',
    height: '150px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    transform: 'translate(30%, -30%)',
  },
}));

const IconWrapper = styled(Box)(({ iconbg }) => ({
  width: '64px',
  height: '64px',
  borderRadius: '16px',
  background: iconbg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '16px',
  '& svg': {
    fontSize: '32px',
    color: '#FFFFFF',
  },
}));

const StatsCard = styled(Paper)({
  padding: '24px',
  borderRadius: '16px',
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 24px rgba(138, 84, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.08)',
    transform: 'translateY(-4px)',
  },
});

const QuickActionButton = styled(Button)({
  borderRadius: '12px',
  padding: '12px 24px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '15px',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
});

// Activity icon and color mapping
const ACTIVITY_CONFIG = {
  upload: { icon: <CloudUpload sx={{ fontSize: 20 }} />, color: '#8A54FF', bg: 'rgba(138, 84, 255, 0.15)' },
  summary: { icon: <AutoAwesome sx={{ fontSize: 20 }} />, color: '#667EEA', bg: 'rgba(102, 126, 234, 0.15)' },
  flashcard: { icon: <School sx={{ fontSize: 20 }} />, color: '#F5576C', bg: 'rgba(245, 87, 108, 0.15)' },
  quiz: { icon: <Quiz sx={{ fontSize: 20 }} />, color: '#FFD93D', bg: 'rgba(255, 217, 61, 0.15)' },
  qa: { icon: <QuestionAnswer sx={{ fontSize: 20 }} />, color: '#4FACFE', bg: 'rgba(79, 172, 254, 0.15)' },
  delete: { icon: <DeleteOutline sx={{ fontSize: 20 }} />, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    documents_uploaded: 0,
    flashcards_created: 0,
    quizzes_taken: 0,
    study_streak: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/activity/dashboard');
      const data = response.data;

      setStats({
        documents_uploaded: data.stats.documents_uploaded,
        flashcards_created: data.stats.flashcards_created,
        quizzes_taken: data.stats.quizzes_taken,
        study_streak: data.stats.study_streak,
      });

      setRecentActivity(data.recent_activity);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback: try individual endpoints
      try {
        const docRes = await api.get('/documents/count');
        setStats((prev) => ({ ...prev, documents_uploaded: docRes.data.count }));
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const features = [
    {
      id: 'summaries',
      title: 'AI Summaries',
      description: 'Generate intelligent summaries from your documents instantly',
      icon: <AutoStories />,
      bgColor: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      hoverBg: 'linear-gradient(135deg, #5568D3 0%, #654091 100%)',
      iconBg: 'rgba(255, 255, 255, 0.25)',
      route: '/summaries',
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      description: 'Create and study with AI-generated flashcards',
      icon: <School />,
      bgColor: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
      hoverBg: 'linear-gradient(135deg, #E082EA 0%, #E4465B 100%)',
      iconBg: 'rgba(255, 255, 255, 0.25)',
      route: '/flashcards',
    },
    {
      id: 'quizzes',
      title: 'Practice Tests',
      description: 'Test your knowledge with MCQ quizzes',
      icon: <Quiz />,
      bgColor: 'linear-gradient(135deg, #FFD93D 0%, #FF9B6A 100%)',
      hoverBg: 'linear-gradient(135deg, #F0C82C 0%, #F08A59 100%)',
      iconBg: 'rgba(255, 255, 255, 0.25)',
      route: '/quizzes',
    },
    {
      id: 'qa',
      title: 'Q&A Assistant',
      description: 'Ask questions and get instant answers',
      icon: <Psychology />,
      bgColor: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
      hoverBg: 'linear-gradient(135deg, #3E9BED 0%, #00E1ED 100%)',
      iconBg: 'rgba(255, 255, 255, 0.25)',
      route: '/qa-assistant',
    },
  ];

  return (
    <DashboardContainer>
      {/* Header */}
      <Header>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo & Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={logo}
                  alt="EduAI"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px',
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                EduAI Assistant
              </Typography>
            </Box>

            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  {user?.full_name || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {user?.email}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                  fontWeight: 700,
                }}
              >
                {user?.full_name?.charAt(0) || 'U'}
              </Avatar>
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: '#EF4444',
                  '&:hover': { background: 'rgba(239, 68, 68, 0.1)' },
                }}
              >
                <Logout />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Header>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 6 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 6, animation: `${fadeIn} 0.6s ease-out` }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#FFFFFF',
              mb: 1,
              fontSize: { xs: '28px', md: '36px' },
            }}
          >
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 400 }}>
            Ready to continue your learning journey?
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 6, animation: `${fadeIn} 0.6s ease-out 0.1s backwards` }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <QuickActionButton
              variant="contained"
              startIcon={<Upload />}
              onClick={() => navigate('/upload')}
              sx={{
                background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                color: '#fff',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568D3, #654091)',
                },
              }}
            >
              Upload Document
            </QuickActionButton>
            <QuickActionButton
              variant="outlined"
              startIcon={<Description />}
              onClick={() => navigate('/my-documents')}
              sx={{
                borderColor: '#667EEA',
                color: '#667EEA',
                '&:hover': {
                  borderColor: '#5568D3',
                  background: 'rgba(102, 126, 234, 0.05)',
                },
              }}
            >
              My Documents
            </QuickActionButton>
          </Box>
        </Box>

        {/* Stats Overview */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#8A54FF' }} />
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mb: 6 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard sx={{ animation: `${fadeIn} 0.6s ease-out 0.2s backwards` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: 'rgba(102, 126, 234, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Description sx={{ color: '#667EEA', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                      {stats.documents_uploaded}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Documents
                    </Typography>
                  </Box>
                </Box>
              </StatsCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatsCard sx={{ animation: `${fadeIn} 0.6s ease-out 0.3s backwards` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: 'rgba(245, 87, 108, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <School sx={{ color: '#F5576C', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                      {stats.flashcards_created}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Flashcards
                    </Typography>
                  </Box>
                </Box>
              </StatsCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatsCard sx={{ animation: `${fadeIn} 0.6s ease-out 0.4s backwards` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: 'rgba(255, 217, 61, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Quiz sx={{ color: '#FFD93D', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                      {stats.quizzes_taken}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Quizzes Taken
                    </Typography>
                  </Box>
                </Box>
              </StatsCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatsCard sx={{ animation: `${fadeIn} 0.6s ease-out 0.5s backwards` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: stats.study_streak > 0 ? 'rgba(255, 152, 0, 0.15)' : 'rgba(79, 172, 254, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stats.study_streak > 0 ? (
                      <LocalFireDepartment sx={{ color: '#FF9800', fontSize: 24 }} />
                    ) : (
                      <TrendingUp sx={{ color: '#4FACFE', fontSize: 24 }} />
                    )}
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                      {stats.study_streak}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Day Streak {stats.study_streak > 0 ? '🔥' : ''}
                    </Typography>
                  </Box>
                </Box>
              </StatsCard>
            </Grid>
          </Grid>
        )}

        {/* Feature Cards */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 3 }}>
            Study Tools
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 6 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={6} lg={6} xl={6} key={feature.id}>
              <FeatureCard
                bgcolor={feature.bgColor}
                hoverbg={feature.hoverBg}
                onClick={() => navigate(feature.route)}
                sx={{
                  animation: `${fadeIn} 0.6s ease-out ${0.6 + index * 0.1}s backwards`,
                }}
              >
                <CardContent
                  sx={{
                    p: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <IconWrapper iconbg={feature.iconBg}>{feature.icon}</IconWrapper>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: '#FFFFFF',
                      mb: 2,
                      fontSize: '24px',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '15px',
                      lineHeight: 1.6,
                      mb: 'auto',
                    }}
                  >
                    {feature.description}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 3,
                      color: '#FFFFFF',
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: '15px' }}>Get Started</Typography>
                    <ArrowForward sx={{ fontSize: 20 }} />
                  </Box>
                </CardContent>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity */}
        <Box sx={{ animation: `${fadeIn} 0.6s ease-out 1s backwards` }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 3 }}>
            Recent Activity
          </Typography>
          <StatsCard>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#8A54FF' }} size={32} />
              </Box>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const config = ACTIVITY_CONFIG[activity.activity_type] || ACTIVITY_CONFIG.upload;
                return (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 2,
                      borderBottom:
                        index < recentActivity.length - 1
                          ? '1px solid rgba(255, 255, 255, 0.06)'
                          : 'none',
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: config.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: config.color,
                        flexShrink: 0,
                      }}
                    >
                      {config.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: '#FFFFFF',
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {activity.title}
                      </Typography>
                      {activity.description && (
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255, 255, 255, 0.4)' }}
                        >
                          {activity.description}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      <Chip
                        label={activity.activity_type}
                        size="small"
                        sx={{
                          background: config.bg,
                          color: config.color,
                          fontWeight: 600,
                          fontSize: '11px',
                          height: '24px',
                          display: { xs: 'none', sm: 'flex' },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: 'rgba(255, 255, 255, 0.4)', whiteSpace: 'nowrap' }}
                      >
                        {getTimeAgo(activity.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            ) : (
              // Empty state - no activity yet
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Description
                  sx={{ fontSize: 48, color: 'rgba(138, 84, 255, 0.3)', mb: 2 }}
                />
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2 }}>
                  No activity yet. Start by uploading a document!
                </Typography>
                <QuickActionButton
                  variant="contained"
                  size="small"
                  startIcon={<Upload />}
                  onClick={() => navigate('/upload')}
                  sx={{
                    background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                    color: '#fff',
                  }}
                >
                  Upload Your First Document
                </QuickActionButton>
              </Box>
            )}
          </StatsCard>
        </Box>
      </Container>
    </DashboardContainer>
  );
}