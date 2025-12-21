import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import api from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    activeUsers: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    // Fetch admin statistics
    fetchAdminStats();
    fetchRecentUsers();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // You'll need to create these endpoints in your backend
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Set mock data for now
      setStats({
        totalUsers: 0,
        totalDocuments: 0,
        activeUsers: 0,
      });
    }
  };

  const fetchRecentUsers = async () => {
    try {
      // You'll need to create this endpoint in your backend
      const response = await api.get('/admin/users/recent');
      setRecentUsers(response.data);
    } catch (error) {
      console.error('Error fetching recent users:', error);
      setRecentUsers([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0F0B1A 0%, #1A122A 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: 'linear-gradient(135deg, #7D5EF9, #9F6EFF)',
              }}
            >
              <AdminIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ color: '#F5F2FF', fontWeight: 800 }}>
                Admin Dashboard
              </Typography>
              <Typography sx={{ color: 'rgba(245,242,255,0.7)' }}>
                Welcome back, {user?.full_name || 'Admin'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={handleLogout}
            sx={{
              borderColor: '#9F6EFF',
              color: '#9F6EFF',
              '&:hover': {
                borderColor: '#B88CFF',
                background: 'rgba(159, 110, 255, 0.1)',
              },
            }}
          >
            Logout
          </Button>
        </Box>

        {/* Account Info */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" sx={{ color: '#F5F2FF', mb: 2 }}>
            Account Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography sx={{ color: 'rgba(245,242,255,0.7)' }}>
                <strong style={{ color: '#F5F2FF' }}>Email:</strong> {user?.email}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography sx={{ color: 'rgba(245,242,255,0.7)' }}>
                <strong style={{ color: '#F5F2FF' }}>Role:</strong>{' '}
                <Chip
                  label="Administrator"
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #7D5EF9, #9F6EFF)',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                />
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography sx={{ color: 'rgba(245,242,255,0.7)' }}>
                <strong style={{ color: '#F5F2FF' }}>Member since:</strong>{' '}
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Statistics Cards */}
        <Typography variant="h5" sx={{ color: '#F5F2FF', mb: 3, fontWeight: 700 }}>
          System Statistics
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 48, color: '#9F6EFF', mb: 2 }} />
                <Typography variant="h4" sx={{ color: '#F5F2FF', fontWeight: 800 }}>
                  {stats.totalUsers}
                </Typography>
                <Typography sx={{ color: 'rgba(245,242,255,0.7)' }}>Total Users</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <DescriptionIcon sx={{ fontSize: 48, color: '#9F6EFF', mb: 2 }} />
                <Typography variant="h4" sx={{ color: '#F5F2FF', fontWeight: 800 }}>
                  {stats.totalDocuments}
                </Typography>
                <Typography sx={{ color: 'rgba(245,242,255,0.7)' }}>Total Documents</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <AssessmentIcon sx={{ fontSize: 48, color: '#9F6EFF', mb: 2 }} />
                <Typography variant="h4" sx={{ color: '#F5F2FF', fontWeight: 800 }}>
                  {stats.activeUsers}
                </Typography>
                <Typography sx={{ color: 'rgba(245,242,255,0.7)' }}>Active Users</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Users Table */}
        <Typography variant="h5" sx={{ color: '#F5F2FF', mb: 3, fontWeight: 700 }}>
          Recent Users
        </Typography>
        <TableContainer
          component={Paper}
          sx={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 3,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#F5F2FF', fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ color: '#F5F2FF', fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ color: '#F5F2FF', fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ color: '#F5F2FF', fontWeight: 700 }}>User Type</TableCell>
                <TableCell sx={{ color: '#F5F2FF', fontWeight: 700 }}>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell sx={{ color: 'rgba(245,242,255,0.9)' }}>{user.id}</TableCell>
                    <TableCell sx={{ color: 'rgba(245,242,255,0.9)' }}>
                      {user.full_name}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(245,242,255,0.9)' }}>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.usertype}
                        size="small"
                        sx={{
                          background:
                            user.usertype === 'admin'
                              ? 'linear-gradient(135deg, #7D5EF9, #9F6EFF)'
                              : 'rgba(255,255,255,0.1)',
                          color: '#fff',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(245,242,255,0.9)' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'rgba(245,242,255,0.7)' }}>
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Admin Actions */}
        <Typography variant="h5" sx={{ color: '#F5F2FF', mt: 4, mb: 3, fontWeight: 700 }}>
          Admin Actions
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 34px rgba(110,70,240,0.35)',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 48, color: '#9F6EFF', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#F5F2FF', fontWeight: 700 }}>
                  Manage Users
                </Typography>
                <Typography sx={{ color: 'rgba(245,242,255,0.7)', fontSize: 14 }}>
                  View and manage all users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 34px rgba(110,70,240,0.35)',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <DescriptionIcon sx={{ fontSize: 48, color: '#9F6EFF', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#F5F2FF', fontWeight: 700 }}>
                  Manage Documents
                </Typography>
                <Typography sx={{ color: 'rgba(245,242,255,0.7)', fontSize: 14 }}>
                  View all documents
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 34px rgba(110,70,240,0.35)',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <AssessmentIcon sx={{ fontSize: 48, color: '#9F6EFF', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#F5F2FF', fontWeight: 700 }}>
                  Analytics
                </Typography>
                <Typography sx={{ color: 'rgba(245,242,255,0.7)', fontSize: 14 }}>
                  View system analytics
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 34px rgba(110,70,240,0.35)',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <SettingsIcon sx={{ fontSize: 48, color: '#9F6EFF', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#F5F2FF', fontWeight: 700 }}>
                  Settings
                </Typography>
                <Typography sx={{ color: 'rgba(245,242,255,0.7)', fontSize: 14 }}>
                  System configuration
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminDashboard;