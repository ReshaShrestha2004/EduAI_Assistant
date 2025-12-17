import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from "../assets/logo.png";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';

import {
  Email,
  Lock,
  Person,
} from "@mui/icons-material";

import { styled, keyframes } from "@mui/material/styles";

const floatCard = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(10px); }
  100% { transform: translateY(0px); }
`;

const glowPulse = keyframes`
  0% { opacity: .35; }
  50% { opacity: .6; }
  100% { opacity: .35; }
`;

const GlassCard = styled(Paper)(() => ({
  backdropFilter: "blur(18px)",
  background: "rgba(255,255,255,0.06)",
  borderRadius: 22,
  padding: 40,
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 12px 42px rgba(0,0,0,0.45)",
  animation: `${floatCard} 9s ease-in-out infinite`,
  position: "relative",
  overflow: "hidden",
}));

const StyledTextField = styled(TextField)(() => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    background: "rgba(255,255,255,0.08)",
    color: "#F5F2FF",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.15)",
    },
    "& input": {
      color: "#F5F2FF",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.25)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#A986FF",
    },
  },
  "& label": {
    color: "rgba(245,242,255,0.65)",
  },
}));

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
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
        background: 'linear-gradient(180deg,#0F0B1A 0%, #1A122A 100%)',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 6, md: 10 },
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top left, rgba(169,134,255,0.18), transparent 45%)",
          animation: `${glowPulse} 8s infinite`,
        }}
      />

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 2 }}>
        <GlassCard elevation={0}>
          {/* logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "linear-gradient(135deg,#7D5EF9,#9F6EFF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 18px rgba(120,70,190,0.35)",
              }}
            >
             <img
                src={logo}
                alt="EduAI Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
            />
            </Box>
            <Typography variant="h5" fontWeight={800} color="#F5F2FF">
              EduAI
            </Typography>
          </Box>

          {/* headings */}
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ color: "#F5F2FF", mb: 0.5 }}
          >
            Create your EduAI account
          </Typography>

          <Typography
            sx={{
              color: "rgba(245,242,255,0.8)",
              mb: 3,
            }}
          >
            Build your personalized AI learning assistant
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Registration successful! Redirecting...
            </Alert>
          )}

          {/* form */}
          <Box component="form" onSubmit={handleSubmit}>
            <StyledTextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "#BDAEFF" }} />
                  </InputAdornment>
                ),
              }}
            />

            <StyledTextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: "#BDAEFF" }} />
                  </InputAdornment>
                ),
              }}
            />

            <StyledTextField
              fullWidth
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#BDAEFF" }} />
                  </InputAdornment>
                ),
              }}
            />

            <StyledTextField
              fullWidth
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#BDAEFF" }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              disabled={loading || success}
              sx={{
                mt: 3,
                py: 1.6,
                borderRadius: 14,
                background: "linear-gradient(135deg,#7D5EF9,#9F6EFF)",
                color: "#fff",
                fontWeight: 700,
                "&:hover": {
                  boxShadow: "0 12px 34px rgba(110,70,240,0.45)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: "#fff" }} />
              ) : (
                "Create Account"
              )}
            </Button>

            <Typography
              sx={{
                mt: 2,
                textAlign: "center",
                color: "rgba(245,242,255,0.75)",
              }}
            >
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                style={{
                  color: "#CBB6FF",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sign In
              </span>
            </Typography>
          </Box>
        </GlassCard>
      </Container>
    </Box>
  );
}
