import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    if (!formData.email || !formData.password || !formData.fullName) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const result = await register(
      formData.email,
      formData.password,
      formData.fullName
    );

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0b0b0d, #0f0f13, #0c0c10)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >

      <Box
        sx={{
          position: 'absolute',
          width: 1200,
          height: 1200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(203,164,241,0.20), transparent 60%)',
          top: '-20%',
          left: '-10%',
          filter: 'blur(75px)',
          animation: 'float1 12s infinite ease-in-out',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(246,200,183,0.18), transparent 70%)',
          bottom: '-25%',
          right: '-10%',
          filter: 'blur(75px)',
          animation: 'float2 14s infinite ease-in-out',
        }}
      />

      <style>
        {`
          @keyframes float1 {
            0% { transform: translateY(0px); }
            50% { transform: translateY(40px); }
            100% { transform: translateY(0px); }
          }
          @keyframes float2 {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-35px); }
            100% { transform: translateY(0px); }
          }
          @keyframes wiggle {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
        `}
      </style>

      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 5,
            borderRadius: 4,
            background: 'rgba(20,20,25,0.75)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
            transition: '0.4s ease',

            '&:hover': {
              boxShadow: '0 0 30px rgba(203,164,241,0.35)',
              borderColor: 'rgba(203,164,241,0.35)',
            },

            animation: 'fadeIn 0.9s ease forwards',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(30px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >

          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: 'linear-gradient(90deg,#CBA4F1,#E8B9D4,#F6C8B7)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Create Your Account
          </Typography>

          <Typography
            variant="body1"
            align="center"
            sx={{ mb: 4, color: '#cfcfcf' }}
          >
            Join EduAI and start your learning journey.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Registration successful! Redirecting...
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {['fullName', 'email', 'password', 'confirmPassword'].map((field) => (
              <TextField
                key={field}
                fullWidth
                required
                type={field.includes('password') ? 'password' : 'text'}
                name={field}
                label={
                  field === 'fullName'
                    ? 'Full Name'
                    : field === 'email'
                    ? 'Email Address'
                    : field === 'password'
                    ? 'Password'
                    : 'Confirm Password'
                }
                value={formData[field]}
                onChange={handleChange}
                disabled={loading || success}
                sx={{
                  input: { color: 'white' },
                  label: { color: '#b8b8b8' },
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#3d3d3d' },
                    '&:hover fieldset': { borderColor: '#CBA4F1' },
                    transition: '0.25s',
                    animation: 'wiggle 0.2s ease',
                  },
                }}
              />
            ))}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || success}
              sx={{
                py: 1.5,
                borderRadius: 3,
                mt: 2,
                background: 'linear-gradient(90deg,#CBA4F1,#E8B9D4,#F6C8B7)',
                boxShadow: '0 0 20px rgba(203,164,241,0.35)',
                fontWeight: 700,
                fontSize: '1.05rem',

                '&:hover': {
                  background: 'linear-gradient(90deg,#E8B9D4,#CBA4F1,#F6C8B7)',
                  boxShadow: '0 0 25px rgba(203,164,241,0.45)',
                },
              }}
            >
              {loading ? <CircularProgress size={26} color="inherit" /> : 'Create Account'}
            </Button>

            <Typography align="center" sx={{ mt: 3, color: '#ccc' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#E8B9D4',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
