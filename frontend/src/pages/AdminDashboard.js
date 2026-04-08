import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  People,
  Description,
  Assessment,
  Logout,
  Delete,
  ArrowForward,
  TrendingUp,
  PersonAdd,
  AdminPanelSettings,
  Refresh,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";
import logo from "../assets/logo.png";

// Animations
const fadeIn = keyframes`
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    `;

// Styled Components
const PageContainer = styled(Box)({
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
const getUserGrowthData = (allUsers) => {
  const counts = {};

  allUsers.forEach((user) => {
    const date = new Date(user.created_at).toLocaleDateString();
    counts[date] = (counts[date] || 0) + 1;
  });

  const sortedDates = Object.keys(counts).sort(
    (a, b) => new Date(a) - new Date(b),
  );

  let total = 0;

  return sortedDates.map((date) => {
    total += counts[date];
    return {
      date,
      daily: counts[date],
      total,
    };
  });
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    activeUsers: 0,
  });
  const [userTypeStats, setUserTypeStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, recentRes, allUsersRes, typeRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users/recent"),
        api.get("/admin/users"),
        api.get("/admin/stats/usertype"),
      ]);
      setStats(statsRes.data);
      setRecentUsers(recentRes.data);
      setAllUsers(allUsersRes.data);
      setUserTypeStats(typeRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      setSuccess(
        `User "${userToDelete.full_name || userToDelete.email}" deleted successfully`,
      );
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchAllData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <PageContainer>
      {/* Header */}
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
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, color: "#FFFFFF" }}
                >
                  EduAI Admin
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Dashboard
                </Typography>
              </Box>
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
                  {user?.full_name || "Admin"}
                </Typography>
                <Chip
                  label="Administrator"
                  size="small"
                  sx={{
                    background: "linear-gradient(135deg, #8A54FF, #9F6EFF)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "10px",
                    height: "20px",
                  }}
                />
              </Box>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #8A54FF, #9F6EFF)",
                  fontWeight: 700,
                }}
              >
                {user?.full_name?.charAt(0) || "A"}
              </Avatar>
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: "#EF4444",
                  "&:hover": { background: "rgba(239,68,68,0.1)" },
                }}
              >
                <Logout />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Header>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {/* Welcome */}
        <Box sx={{ mb: 4, animation: `${fadeIn} 0.6s ease-out` }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: "#FFFFFF",
                  fontSize: { xs: "28px", md: "36px" },
                }}
              >
                Admin Dashboard
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", mt: 0.5 }}>
                System overview and user management
              </Typography>
            </Box>
            <Button
              startIcon={<Refresh />}
              onClick={fetchAllData}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                borderColor: "rgba(138,84,255,0.5)",
                color: "#8A54FF",
                border: "1px solid rgba(138,84,255,0.3)",
                "&:hover": {
                  borderColor: "#8A54FF",
                  background: "rgba(138,84,255,0.1)",
                },
              }}
            >
              Refresh Data
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#8A54FF" }} size={48} />
          </Box>
        ) : (
          <>
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatsCard
                  sx={{ animation: `${fadeIn} 0.6s ease-out 0.1s backwards` }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        background: "rgba(138,84,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <People sx={{ color: "#8A54FF", fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, color: "#FFFFFF" }}
                      >
                        {stats.totalUsers}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        Total Users
                      </Typography>
                    </Box>
                  </Box>
                </StatsCard>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatsCard
                  sx={{ animation: `${fadeIn} 0.6s ease-out 0.2s backwards` }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        background: "rgba(102,126,234,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Description sx={{ color: "#667EEA", fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, color: "#FFFFFF" }}
                      >
                        {stats.totalDocuments}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        Total Documents
                      </Typography>
                    </Box>
                  </Box>
                </StatsCard>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatsCard
                  sx={{ animation: `${fadeIn} 0.6s ease-out 0.3s backwards` }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        background: "rgba(107,207,127,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <TrendingUp sx={{ color: "#6BCF7F", fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, color: "#FFFFFF" }}
                      >
                        {stats.activeUsers}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        Active (30 days)
                      </Typography>
                    </Box>
                  </Box>
                </StatsCard>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatsCard
                  sx={{ animation: `${fadeIn} 0.6s ease-out 0.4s backwards` }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        background: "rgba(245,87,108,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AdminPanelSettings
                        sx={{ color: "#F5576C", fontSize: 24 }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, color: "#FFFFFF" }}
                      >
                        {userTypeStats.admin || 0}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        Admins
                      </Typography>
                    </Box>
                  </Box>
                </StatsCard>
              </Grid>
            </Grid>

            {/* 📊 Analytics Charts */}
            <Box sx={{ mb: 4, width: "100%" }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: "#FFFFFF", mb: 2 }}
              >
                Analytics Overview
              </Typography>

              {/* FORCE FULL WIDTH ROW */}
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  width: "100%",
                  flexWrap: { xs: "wrap", md: "nowrap" },
                }}
              >
                {/* 📈 LEFT BIG CHART */}
                <Box
                  sx={{
                    flex: 2,
                    minWidth: 0,
                  }}
                >
                  <Paper
                    sx={{
                      p: 3,
                      height: 400,
                      width: "100%",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Typography sx={{ color: "#fff", fontWeight: 600, mb: 2 }}>
                      User Growth
                    </Typography>

                    <Box sx={{ width: "100%", height: "90%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getUserGrowthData(allUsers)}>
                          <defs>
                            <linearGradient
                              id="growth"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#8A54FF"
                                stopOpacity={0.7}
                              />
                              <stop
                                offset="100%"
                                stopColor="#8A54FF"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" stroke="#aaa" />
                          <YAxis stroke="#aaa" />
                          <Tooltip
                            contentStyle={{
                              background: "#1A122A",
                              border: "none",
                              borderRadius: "10px",
                              color: "#fff",
                            }}
                          />

                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#8A54FF"
                            strokeWidth={2}
                            fill="url(#growth)"
                          />

                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#F5576C"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Box>

                {/* 📊 RIGHT SMALL CHART */}
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Paper
                    sx={{
                      p: 3,
                      height: 400,
                      width: "100%",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Typography sx={{ color: "#fff", fontWeight: 600, mb: 2 }}>
                      Daily Signups
                    </Typography>

                    <Box sx={{ width: "100%", height: "90%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getUserGrowthData(allUsers)}>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" stroke="#aaa" />
                          <YAxis stroke="#aaa" />
                          <Tooltip
                            contentStyle={{
                              background: "#1A122A",
                              border: "none",
                              borderRadius: "10px",
                              color: "#fff",
                            }}
                          />

                          <Bar
                            dataKey="daily"
                            fill="#6BCF7F"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Box>
              </Box>
            </Box>

            {/* User Type Breakdown */}
            <Box
              sx={{
                mb: 4,
                animation: `${fadeIn} 0.6s ease-out 0.5s backwards`,
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: "#FFFFFF", mb: 2 }}
              >
                User Breakdown
              </Typography>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {Object.entries(userTypeStats).map(([type, count]) => (
                    <Box
                      key={type}
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: type === "admin" ? "#F5576C" : "#8A54FF",
                        }}
                      />
                      <Typography sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>

            {/* All Users Table */}
            <Box sx={{ animation: `${fadeIn} 0.6s ease-out 0.6s backwards` }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, color: "#FFFFFF" }}
                >
                  All Users ({allUsers.length})
                </Typography>
              </Box>

              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          fontWeight: 700,
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        User
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          fontWeight: 700,
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        Email
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          fontWeight: 700,
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        Role
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          fontWeight: 700,
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        Joined
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          fontWeight: 700,
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                        align="right"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allUsers.length > 0 ? (
                      allUsers.map((u) => (
                        <TableRow
                          key={u.id}
                          sx={{
                            "&:hover": { background: "rgba(255,255,255,0.03)" },
                          }}
                        >
                          <TableCell
                            sx={{
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  background:
                                    u.usertype === "admin"
                                      ? "linear-gradient(135deg, #F5576C, #FF8A9B)"
                                      : "linear-gradient(135deg, #8A54FF, #9F6EFF)",
                                }}
                              >
                                {u.full_name?.charAt(0) ||
                                  u.email?.charAt(0) ||
                                  "?"}
                              </Avatar>
                              <Typography
                                sx={{
                                  color: "#FFFFFF",
                                  fontWeight: 600,
                                  fontSize: "14px",
                                }}
                              >
                                {u.full_name || "No name"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "rgba(255,255,255,0.7)",
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                              fontSize: "14px",
                            }}
                          >
                            {u.email}
                          </TableCell>
                          <TableCell
                            sx={{
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            <Chip
                              label={u.usertype}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: "11px",
                                height: "24px",
                                background:
                                  u.usertype === "admin"
                                    ? "rgba(245,87,108,0.15)"
                                    : "rgba(138,84,255,0.15)",
                                color:
                                  u.usertype === "admin"
                                    ? "#F5576C"
                                    : "#B88CFF",
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "rgba(255,255,255,0.5)",
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                              fontSize: "13px",
                            }}
                          >
                            {getTimeAgo(u.created_at)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            {u.usertype !== "admin" && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(u)}
                                sx={{
                                  color: "rgba(239,68,68,0.6)",
                                  "&:hover": {
                                    color: "#EF4444",
                                    background: "rgba(239,68,68,0.1)",
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          align="center"
                          sx={{
                            color: "rgba(255,255,255,0.5)",
                            py: 4,
                            borderBottom: "none",
                          }}
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}

        {/* Delete Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
          }}
          PaperProps={{
            sx: {
              background: "rgba(26,18,42,0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              maxWidth: "400px",
            },
          }}
        >
          <DialogTitle sx={{ color: "#FFFFFF", fontWeight: 700 }}>
            Delete User?
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
              Are you sure you want to delete "
              {userToDelete?.full_name || userToDelete?.email}"? This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              disabled={deleting}
              sx={{
                color: "rgba(255,255,255,0.7)",
                textTransform: "none",
                "&:hover": { background: "rgba(255,255,255,0.05)" },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              variant="contained"
              sx={{
                background: "#EF4444",
                color: "#fff",
                textTransform: "none",
                borderRadius: "10px",
                "&:hover": { background: "#DC2626" },
              }}
            >
              {deleting ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PageContainer>
  );
}
