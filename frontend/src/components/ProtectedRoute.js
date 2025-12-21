import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const auth = useAuth();

  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  const { user, loading } = auth;
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

    if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if route requires admin privileges
  if (adminOnly && user.usertype !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;