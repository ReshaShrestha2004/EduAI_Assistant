import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  AutoStories,
  School,
  Psychology,
  MenuBook,
} from "@mui/icons-material";

import { styled, keyframes } from "@mui/material/styles";

const floatHero = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
  100% { transform: translateY(0px); }
`;

const floatLogin = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(10px); }
  100% { transform: translateY(0px); }
`;

const floatIcon = keyframes`
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.05); }
  100% { transform: translateY(0) scale(1); }
`;

const GradientHero = styled(Box)({
  background:
    "linear-gradient(135deg, #3A2A6A 0%, #5C3C89 45%, #8B52AC 100%)",
  borderRadius: 28,
  padding: "36px",
  color: "#ffffff",
  position: "relative",
  overflow: "hidden",
  minHeight: 420,
  boxShadow: "0 12px 48px rgba(0,0,0,0.35)",
});

const GlassCard = styled(Paper)({
  backdropFilter: "blur(18px)",
  background: "rgba(255,255,255,0.06)",
  borderRadius: 20,
  padding: 36,
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
});

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.15)",
    },
    "& input": {
      color: "#fff",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.25)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#9f75e0",
    },
  },
});

const FloatingIcon = styled(Box)(({ delay = 0 }) => ({
  position: "absolute",
  animation: `${floatIcon} 8s ease-in-out infinite`,
  animationDelay: `${delay}s`,
  pointerEvents: "none",
  opacity: 0.18,
}));

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth?.() ?? { login: async () => {} };

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await login(formData.email, formData.password);
      setLoading(false);

      if (res?.success) {
        if (res.data.usertype == 'admin'){
          navigate("/admin");
        } else {
          navigate("/dashboard");
        } 
      } else {
          setError(res?.error || "Failed to login");
        }
    } catch (err) {
      setLoading(false);
      setError("An unexpected error occurred");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#0F0B1A 0%, #1A122A 100%)",
        display: "flex",
        alignItems: "center",
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
            alignItems: "center",
          }}
        >
          <GradientHero sx={{ animation: `${floatHero} 8s ease-in-out infinite` }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>
              What You'll Get
            </Typography>

            <Typography sx={{ mb: 3, opacity: 0.9, fontSize: 15 }}>
              AI tools to study smarter — summaries, Q&A, flashcards.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { title: "AI-Powered Summaries", desc: "Understand faster", icon: <MenuBook /> },
                { title: "Smart Q&A Assistant", desc: "Get instant answers", icon: <Psychology /> },
                { title: "Auto-Generated Flashcards", desc: "Study efficiently", icon: <School /> },
              ].map((item, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    p: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#EEE",
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                    <Typography sx={{ fontSize: 13, opacity: 0.8 }}>{item.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <FloatingIcon delay={0.3} sx={{ top: 20, left: 20 }}>
              <AutoStories sx={{ fontSize: 90, color: "#FFFFFF" }} />
            </FloatingIcon>

            <FloatingIcon delay={1} sx={{ bottom: -10, right: -5 }}>
              <School sx={{ fontSize: 120, color: "#FFFFFF" }} />
            </FloatingIcon>

            <FloatingIcon delay={1.6} sx={{ top: "45%", right: 40 }}>
              <Psychology sx={{ fontSize: 78, color: "#FFFFFF" }} />
            </FloatingIcon>
          </GradientHero>

          <GlassCard elevation={0} sx={{ animation: `${floatLogin} 9s ease-in-out infinite`, color: "#fff" }}>
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
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                EduAI
              </Typography>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Welcome Back
            </Typography>
            <Typography sx={{ opacity: 0.75, mb: 2 }}>Log in to continue</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <StyledTextField
              fullWidth
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onKeyPress={handleKeyPress}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: "#b19cd9" }} />
                  </InputAdornment>
                ),
              }}
            />

            <StyledTextField
              fullWidth
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onKeyPress={handleKeyPress}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#b19cd9" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff sx={{ color: "#b19cd9" }} /> : <Visibility sx={{ color: "#b19cd9" }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              onClick={handleSubmit}
              disabled={loading}
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
              {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Sign In"}
            </Button>

            <Typography sx={{ mt: 2, textAlign: "center", opacity: 0.75 }}>
              Don’t have an account?{" "}
              <span
                onClick={() => navigate("/register")}
                style={{ color: "#A986FF", fontWeight: "bold", cursor: "pointer" }}
              >
                Create one
              </span>
            </Typography>
          </GlassCard>
        </Box>
      </Container>
    </Box>
  );
}
