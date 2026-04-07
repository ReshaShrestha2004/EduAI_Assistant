import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
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
  LinearProgress,
  Tooltip,
  TextField,
  Checkbox,
} from "@mui/material";
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
  Add,
  Remove,
  CheckCircle,
  Close,
  Edit,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";
import logo from "../assets/logo.png";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const subtlePulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

const countUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// Styled Components (all original ones preserved)
const DashboardContainer = styled(Box)({
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0F0B1A 0%, #1A122A 100%)",
});

const Header = styled(Box)({
  background: "rgba(255, 255, 255, 0.03)",
  backdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  padding: "20px 0",
  position: "sticky",
  top: 0,
  zIndex: 100,
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
});

const FeatureCard = styled(Card)(({ bgcolor, hoverbg }) => ({
  background: bgcolor,
  borderRadius: "24px",
  padding: "32px",
  height: "280px",
  cursor: "pointer",
  border: "none",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  position: "relative",
  overflow: "hidden",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.15)",
    background: hoverbg,
  },
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    width: "150px",
    height: "150px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    transform: "translate(30%, -30%)",
  },
}));

const IconWrapper = styled(Box)(({ iconbg }) => ({
  width: "64px",
  height: "64px",
  borderRadius: "16px",
  background: iconbg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
  "& svg": { fontSize: "32px", color: "#FFFFFF" },
}));

const StatsCard = styled(Paper)({
  padding: "24px",
  borderRadius: "16px",
  background: "rgba(255, 255, 255, 0.05)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 8px 24px rgba(138, 84, 255, 0.3)",
    background: "rgba(255, 255, 255, 0.08)",
    transform: "translateY(-4px)",
  },
});

const QuickActionButton = styled(Button)({
  borderRadius: "12px",
  padding: "12px 24px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "15px",
  boxShadow: "none",
  "&:hover": { boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" },
});

const ACTIVITY_CONFIG = {
  upload: {
    icon: <CloudUpload sx={{ fontSize: 20 }} />,
    color: "#8A54FF",
    bg: "rgba(138, 84, 255, 0.15)",
  },
  summary: {
    icon: <AutoAwesome sx={{ fontSize: 20 }} />,
    color: "#667EEA",
    bg: "rgba(102, 126, 234, 0.15)",
  },
  flashcard: {
    icon: <School sx={{ fontSize: 20 }} />,
    color: "#F5576C",
    bg: "rgba(245, 87, 108, 0.15)",
  },
  quiz: {
    icon: <Quiz sx={{ fontSize: 20 }} />,
    color: "#FFD93D",
    bg: "rgba(255, 217, 61, 0.15)",
  },
  qa: {
    icon: <QuestionAnswer sx={{ fontSize: 20 }} />,
    color: "#4FACFE",
    bg: "rgba(79, 172, 254, 0.15)",
  },
  delete: {
    icon: <DeleteOutline sx={{ fontSize: 20 }} />,
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.15)",
  },
};

const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const MiniProgress = ({ value, max, color }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <Box sx={{ position: "relative", width: 32, height: 32 }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={32}
        thickness={3}
        sx={{ color: "rgba(255,255,255,0.06)", position: "absolute" }}
      />
      <CircularProgress
        variant="determinate"
        value={pct}
        size={32}
        thickness={3}
        sx={{ color, position: "absolute", transition: "all 0.8s ease-out" }}
      />
    </Box>
  );
};

const WeeklyHeatmap = ({ activities }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekData = days.map((day, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - mondayOffset + i);
    const dateStr = date.toISOString().split("T")[0];
    const count = activities.filter((a) => {
      const actDate = new Date(a.created_at).toISOString().split("T")[0];
      return actDate === dateStr;
    }).length;
    const isToday = i === mondayOffset;
    const isFuture = date > today;
    return { day, count, isToday, isFuture, date: dateStr };
  });

  const maxCount = Math.max(...weekData.map((d) => d.count), 1);

  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
      {weekData.map((d, i) => {
        const intensity = d.isFuture ? 0 : d.count / maxCount;
        return (
          <Tooltip
            key={i}
            title={`${d.day}: ${d.count} ${d.count === 1 ? "activity" : "activities"}`}
            arrow
            placement="top"
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                flex: 1,
              }}
            >
              <Typography
                sx={{
                  color:
                    d.count > 0 && !d.isFuture
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.2)",
                  fontWeight: 700,
                  fontSize: "14px",
                  mb: 0.5,
                }}
              >
                {d.isFuture ? "" : d.count}
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  height: 48,
                  borderRadius: "10px",
                  background: d.isFuture
                    ? "rgba(255,255,255,0.02)"
                    : d.count === 0
                      ? "rgba(255,255,255,0.04)"
                      : `rgba(138, 84, 255, ${0.15 + intensity * 0.55})`,
                  border: d.isToday
                    ? "2px solid rgba(138,84,255,0.6)"
                    : "1px solid rgba(255,255,255,0.04)",
                  transition: "all 0.3s ease",
                  cursor: "default",
                  "&:hover": {
                    transform: "scaleY(1.1)",
                    background: d.isFuture
                      ? "rgba(255,255,255,0.02)"
                      : d.count === 0
                        ? "rgba(255,255,255,0.06)"
                        : `rgba(138, 84, 255, ${0.25 + intensity * 0.55})`,
                  },
                }}
              />
              <Typography
                sx={{
                  fontSize: "13px",
                  color: d.isToday ? "#B88CFF" : "rgba(255,255,255,0.4)",
                  fontWeight: d.isToday ? 700 : 500,
                  mt: 0.5,
                }}
              >
                {d.day}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
};

// Default goals
const DEFAULT_GOALS = [
  { id: 1, text: "Upload a study document", done: false },
  { id: 2, text: "Generate a summary", done: false },
  { id: 3, text: "Complete a quiz", done: false },
  { id: 4, text: "Review flashcards", done: false },
];

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
  const [todayCount, setTodayCount] = useState(0);

  // Daily goals state
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem("eduai_goals");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset done status if it's a new day
        const lastDate = localStorage.getItem("eduai_goals_date");
        const today = new Date().toISOString().split("T")[0];
        if (lastDate !== today) {
          return parsed.map((g) => ({ ...g, done: false }));
        }
        return parsed;
      }
    } catch (e) {}
    return DEFAULT_GOALS;
  });
  const [newGoalText, setNewGoalText] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);

  // Save goals
  useEffect(() => {
    localStorage.setItem("eduai_goals", JSON.stringify(goals));
    localStorage.setItem(
      "eduai_goals_date",
      new Date().toISOString().split("T")[0],
    );
  }, [goals]);

  const toggleGoal = (id) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    );
  };

  const addGoal = () => {
    if (!newGoalText.trim()) return;
    const newId = Math.max(...goals.map((g) => g.id), 0) + 1;
    setGoals((prev) => [
      ...prev,
      { id: newId, text: newGoalText.trim(), done: false },
    ]);
    setNewGoalText("");
    setAddingGoal(false);
  };

  const removeGoal = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const completedGoals = goals.filter((g) => g.done).length;
  const goalProgress =
    goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get("/activity/dashboard");
      const data = response.data;
      setStats({
        documents_uploaded: data.stats.documents_uploaded,
        flashcards_created: data.stats.flashcards_created,
        quizzes_taken: data.stats.quizzes_taken,
        study_streak: data.stats.study_streak,
      });
      setRecentActivity(data.recent_activity);
      const today = new Date().toISOString().split("T")[0];
      const todayActivities = (data.recent_activity || []).filter(
        (a) => new Date(a.created_at).toISOString().split("T")[0] === today,
      );
      setTodayCount(todayActivities.length);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      try {
        const docRes = await api.get("/documents/count");
        setStats((prev) => ({
          ...prev,
          documents_uploaded: docRes.data.count,
        }));
      } catch (e) {}
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const features = [
    {
      id: "summaries",
      title: "AI Summaries",
      description:
        "Generate intelligent summaries from your documents instantly",
      icon: <AutoStories />,
      bgColor: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
      hoverBg: "linear-gradient(135deg, #5568D3 0%, #654091 100%)",
      iconBg: "rgba(255, 255, 255, 0.25)",
      route: "/summaries",
    },
    {
      id: "flashcards",
      title: "Flashcards",
      description: "Create and study with AI-generated flashcards",
      icon: <School />,
      bgColor: "linear-gradient(135deg, #F093FB 0%, #F5576C 100%)",
      hoverBg: "linear-gradient(135deg, #E082EA 0%, #E4465B 100%)",
      iconBg: "rgba(255, 255, 255, 0.25)",
      route: "/flashcards",
    },
    {
      id: "quizzes",
      title: "Practice Tests",
      description: "Test your knowledge with MCQ quizzes",
      icon: <Quiz />,
      bgColor: "linear-gradient(135deg, #FFD93D 0%, #FF9B6A 100%)",
      hoverBg: "linear-gradient(135deg, #F0C82C 0%, #F08A59 100%)",
      iconBg: "rgba(255, 255, 255, 0.25)",
      route: "/quizzes",
    },
    {
      id: "qa",
      title: "Q&A Assistant",
      description: "Ask questions and get instant answers",
      icon: <Psychology />,
      bgColor: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)",
      hoverBg: "linear-gradient(135deg, #3E9BED 0%, #00E1ED 100%)",
      iconBg: "rgba(255, 255, 255, 0.25)",
      route: "/qa-assistant",
    },
  ];

  return (
    <DashboardContainer>
      <Header>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #667EEA, #764BA2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={logo}
                  alt="EduAI"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "12px",
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "#FFFFFF" }}
              >
                EduAI Assistant
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  textAlign: "right",
                  display: { xs: "none", sm: "block" },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#FFFFFF" }}
                >
                  {user?.full_name || "User"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  {user?.email}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #667EEA, #764BA2)",
                  fontWeight: 700,
                }}
              >
                {user?.full_name?.charAt(0) || "U"}
              </Avatar>
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: "#EF4444",
                  "&:hover": { background: "rgba(239, 68, 68, 0.1)" },
                }}
              >
                <Logout />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Header>

      <Container maxWidth="xl" sx={{ py: 6 }}>
        {/* Welcome */}
        <Box sx={{ mb: 6, animation: `${fadeIn} 0.6s ease-out` }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "#FFFFFF",
              mb: 1,
              fontSize: { xs: "28px", md: "36px" },
            }}
          >
            Welcome back, {user?.full_name?.split(" ")[0] || "there"}!
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: "rgba(255, 255, 255, 0.7)", fontWeight: 400 }}
          >
            Ready to continue your learning journey?
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Box
          sx={{ mb: 6, animation: `${fadeIn} 0.6s ease-out 0.1s backwards` }}
        >
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <QuickActionButton
              variant="contained"
              startIcon={<Upload />}
              onClick={() => navigate("/upload")}
              sx={{
                background: "linear-gradient(135deg, #667EEA, #764BA2)",
                color: "#fff",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568D3, #654091)",
                },
              }}
            >
              Upload Document
            </QuickActionButton>
            <QuickActionButton
              variant="outlined"
              startIcon={<Description />}
              onClick={() => navigate("/my-documents")}
              sx={{
                borderColor: "#667EEA",
                color: "#667EEA",
                "&:hover": {
                  borderColor: "#5568D3",
                  background: "rgba(102, 126, 234, 0.05)",
                },
              }}
            >
              My Documents
            </QuickActionButton>
          </Box>
        </Box>

        {/* Stats */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: "#8A54FF" }} />
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mb: 5 }}>
            {[
              {
                label: "Documents",
                value: stats.documents_uploaded,
                icon: <Description sx={{ color: "#667EEA", fontSize: 24 }} />,
                bg: "rgba(102, 126, 234, 0.1)",
                color: "#667EEA",
                max: 10,
                delay: "0.2s",
              },
              {
                label: "Flashcards",
                value: stats.flashcards_created,
                icon: <School sx={{ color: "#F5576C", fontSize: 24 }} />,
                bg: "rgba(245, 87, 108, 0.1)",
                color: "#F5576C",
                max: 50,
                delay: "0.3s",
              },
              {
                label: "Quizzes Taken",
                value: stats.quizzes_taken,
                icon: <Quiz sx={{ color: "#FFD93D", fontSize: 24 }} />,
                bg: "rgba(255, 217, 61, 0.1)",
                color: "#FFD93D",
                max: 20,
                delay: "0.4s",
              },
              {
                label: `Day Streak ${stats.study_streak > 0 ? "🔥" : ""}`,
                value: stats.study_streak,
                icon:
                  stats.study_streak > 0 ? (
                    <LocalFireDepartment
                      sx={{ color: "#FF9800", fontSize: 24 }}
                    />
                  ) : (
                    <TrendingUp sx={{ color: "#4FACFE", fontSize: 24 }} />
                  ),
                bg:
                  stats.study_streak > 0
                    ? "rgba(255, 152, 0, 0.15)"
                    : "rgba(79, 172, 254, 0.1)",
                color: stats.study_streak > 0 ? "#FF9800" : "#4FACFE",
                max: 7,
                delay: "0.5s",
              },
            ].map((s, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <StatsCard
                  sx={{
                    animation: `${fadeIn} 0.6s ease-out ${s.delay} backwards`,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        background: s.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation:
                          i === 3 && stats.study_streak > 2
                            ? `${subtlePulse} 2s ease-in-out infinite`
                            : "none",
                      }}
                    >
                      {s.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 800,
                          color: "#FFFFFF",
                          animation: `${countUp} 0.5s ease-out`,
                        }}
                      >
                        {s.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                      >
                        {s.label}
                      </Typography>
                    </Box>
                    <MiniProgress value={s.value} max={s.max} color={s.color} />
                  </Box>
                </StatsCard>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Daily Goals + Weekly Activity */}
        {!loading && (
          <Grid
            container
            spacing={3}
            sx={{ mb: 6, animation: `${fadeIn} 0.6s ease-out 0.55s backwards` }}
          >
            {/* Daily Goals (Trello style) */}
            <Grid item xs={12} md={5}>
              <Paper
                sx={{
                  p: 0,
                  borderRadius: "20px",
                  overflow: "hidden",
                  background:
                    "linear-gradient(180deg, rgba(138,84,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(138,84,255,0.2)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header with progress */}
                <Box sx={{ p: 3, pb: 2 }}>
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
                        fontSize: "18px",
                        fontWeight: 700,
                      }}
                    >
                      Today's Goals
                    </Typography>
                    <Typography
                      sx={{
                        color: goalProgress === 100 ? "#6BCF7F" : "#B88CFF",
                        fontWeight: 800,
                        fontSize: "18px",
                      }}
                    >
                      {completedGoals}/{goals.length}
                    </Typography>
                  </Box>
                  {/* Progress bar */}
                  <Box
                    sx={{
                      position: "relative",
                      height: 8,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        width: `${goalProgress}%`,
                        borderRadius: 4,
                        background:
                          goalProgress === 100
                            ? "linear-gradient(90deg, #6BCF7F, #4FACFE)"
                            : "linear-gradient(90deg, #8A54FF, #B88CFF)",
                        transition: "width 0.6s ease-out",
                      }}
                    />
                  </Box>
                  {goalProgress === 100 && (
                    <Typography
                      sx={{
                        color: "#6BCF7F",
                        fontSize: "13px",
                        fontWeight: 600,
                        mt: 1,
                      }}
                    >
                      All goals completed for today
                    </Typography>
                  )}
                </Box>

                {/* Goal items */}
                <Box
                  sx={{
                    flex: 1,
                    px: 2,
                    pb: 1,
                    overflowY: "auto",
                    maxHeight: "240px",
                  }}
                >
                  {goals.map((goal, idx) => (
                    <Box
                      key={goal.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        py: 1,
                        px: 1.5,
                        mx: 0.5,
                        mb: 0.5,
                        borderRadius: "12px",
                        background: goal.done
                          ? "rgba(107,207,127,0.06)"
                          : "rgba(255,255,255,0.03)",
                        border: "1px solid",
                        borderColor: goal.done
                          ? "rgba(107,207,127,0.12)"
                          : "rgba(255,255,255,0.05)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          background: goal.done
                            ? "rgba(107,207,127,0.1)"
                            : "rgba(255,255,255,0.06)",
                          "& .delete-btn": { opacity: 1 },
                        },
                        animation: `${fadeIn} 0.3s ease-out ${idx * 0.05}s backwards`,
                      }}
                    >
                      <Checkbox
                        checked={goal.done}
                        onChange={() => toggleGoal(goal.id)}
                        size="small"
                        sx={{
                          color: "rgba(255,255,255,0.2)",
                          p: 0.5,
                          "&.Mui-checked": { color: "#6BCF7F" },
                        }}
                      />
                      <Typography
                        sx={{
                          color: goal.done
                            ? "rgba(255,255,255,0.35)"
                            : "#FFFFFF",
                          fontSize: "15px",
                          fontWeight: 500,
                          flexGrow: 1,
                          textDecoration: goal.done ? "line-through" : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {goal.text}
                      </Typography>
                      <IconButton
                        className="delete-btn"
                        size="small"
                        onClick={() => removeGoal(goal.id)}
                        sx={{
                          opacity: 0,
                          transition: "opacity 0.2s",
                          color: "rgba(255,255,255,0.2)",
                          p: 0.5,
                          "&:hover": { color: "#EF4444" },
                        }}
                      >
                        <Close sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                {/* Add goal */}
                <Box
                  sx={{
                    p: 2,
                    pt: 1,
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {addingGoal ? (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        autoFocus
                        placeholder="What do you want to accomplish?"
                        value={newGoalText}
                        onChange={(e) => setNewGoalText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addGoal();
                          if (e.key === "Escape") setAddingGoal(false);
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            background: "rgba(255,255,255,0.04)",
                            color: "#FFFFFF",
                            fontSize: "14px",
                            "& fieldset": {
                              borderColor: "rgba(138,84,255,0.3)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(138,84,255,0.5)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#8A54FF",
                            },
                            "& input": {
                              color: "#FFFFFF",
                              padding: "10px 14px",
                            },
                            "& input::placeholder": {
                              color: "rgba(255,255,255,0.3)",
                            },
                          },
                        }}
                      />
                      <IconButton
                        onClick={addGoal}
                        sx={{
                          color: "#8A54FF",
                          background: "rgba(138,84,255,0.1)",
                          borderRadius: "10px",
                          "&:hover": { background: "rgba(138,84,255,0.2)" },
                        }}
                      >
                        <CheckCircle sx={{ fontSize: 20 }} />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setAddingGoal(false);
                          setNewGoalText("");
                        }}
                        sx={{
                          color: "rgba(255,255,255,0.3)",
                          "&:hover": { color: "#EF4444" },
                        }}
                      >
                        <Close sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      fullWidth
                      startIcon={<Add />}
                      onClick={() => setAddingGoal(true)}
                      sx={{
                        color: "rgba(255,255,255,0.4)",
                        textTransform: "none",
                        fontWeight: 500,
                        fontSize: "14px",
                        borderRadius: "10px",
                        justifyContent: "flex-start",
                        py: 1,
                        "&:hover": {
                          background: "rgba(138,84,255,0.08)",
                          color: "#B88CFF",
                        },
                      }}
                    >
                      Add a goal
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Weekly Activity */}
            <Grid item xs={12} md={7}>
              <Paper
                sx={{
                  p: 0,
                  borderRadius: "20px",
                  overflow: "hidden",
                  background:
                    "linear-gradient(180deg, rgba(138,84,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(138,84,255,0.15)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#FFFFFF",
                        fontSize: "18px",
                        fontWeight: 700,
                      }}
                    >
                      This Week
                    </Typography>
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}
                    >
                      {todayCount}{" "}
                      {todayCount === 1 ? "activity" : "activities"} today
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    px: 3,
                    pb: 3,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <WeeklyHeatmap activities={recentActivity} />

                  {/* Legend */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mt: 3,
                    }}
                  >
                    {[
                      { label: "None", bg: "rgba(255,255,255,0.04)" },
                      { label: "Low", bg: "rgba(138,84,255,0.2)" },
                      { label: "Medium", bg: "rgba(138,84,255,0.4)" },
                      { label: "High", bg: "rgba(138,84,255,0.7)" },
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "3px",
                            background: item.bg,
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        />
                        <Typography
                          sx={{
                            color: "rgba(255,255,255,0.35)",
                            fontSize: "12px",
                          }}
                        >
                          {item.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Feature Cards */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#FFFFFF", mb: 3 }}
          >
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
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <IconWrapper iconbg={feature.iconBg}>
                    {feature.icon}
                  </IconWrapper>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: "#FFFFFF",
                      mb: 2,
                      fontSize: "24px",
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(255, 255, 255, 0.9)",
                      fontSize: "15px",
                      lineHeight: 1.6,
                      mb: "auto",
                    }}
                  >
                    {feature.description}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 3,
                      color: "#FFFFFF",
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: "15px" }}>
                      Get Started
                    </Typography>
                    <ArrowForward sx={{ fontSize: 20 }} />
                  </Box>
                </CardContent>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity */}
        <Box sx={{ animation: `${fadeIn} 0.6s ease-out 1s backwards` }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: "#FFFFFF", mb: 3 }}
          >
            Recent Activity
          </Typography>
          <StatsCard>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress sx={{ color: "#8A54FF" }} size={32} />
              </Box>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const config =
                  ACTIVITY_CONFIG[activity.activity_type] ||
                  ACTIVITY_CONFIG.upload;
                return (
                  <Box
                    key={activity.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      py: 2,
                      borderBottom:
                        index < recentActivity.length - 1
                          ? "1px solid rgba(255, 255, 255, 0.06)"
                          : "none",
                      animation: `${fadeIn} 0.3s ease-out ${index * 0.05}s backwards`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "10px",
                        background: config.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
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
                          color: "#FFFFFF",
                          fontSize: "14px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {activity.title}
                      </Typography>
                      {activity.description && (
                        <Typography
                          variant="caption"
                          sx={{ color: "rgba(255, 255, 255, 0.4)" }}
                        >
                          {activity.description}
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexShrink: 0,
                      }}
                    >
                      <Chip
                        label={activity.activity_type}
                        size="small"
                        sx={{
                          background: config.bg,
                          color: config.color,
                          fontWeight: 600,
                          fontSize: "11px",
                          height: "24px",
                          display: { xs: "none", sm: "flex" },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255, 255, 255, 0.4)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getTimeAgo(activity.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Description
                  sx={{ fontSize: 48, color: "rgba(138, 84, 255, 0.3)", mb: 2 }}
                />
                <Typography sx={{ color: "rgba(255, 255, 255, 0.6)", mb: 2 }}>
                  No activity yet. Start by uploading a document!
                </Typography>
                <QuickActionButton
                  variant="contained"
                  size="small"
                  startIcon={<Upload />}
                  onClick={() => navigate("/upload")}
                  sx={{
                    background: "linear-gradient(135deg, #667EEA, #764BA2)",
                    color: "#fff",
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
