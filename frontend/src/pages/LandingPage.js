import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  alpha,
} from "@mui/material";
import {
  AutoStories,
  Psychology,
  School,
  Quiz,
  TrendingUp,
  Speed,
  ArrowForward,
  CheckCircle,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";
import logo from "../assets/logo.png";

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const HeroSection = styled(Box)({
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0F0B1A 0%, #1A0E2E 50%, #2D1B4E 100%)",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  paddingTop: "80px",
  paddingBottom: "80px",
});

const AnimatedBackground = styled(Box)({
  position: "absolute",
  inset: 0,
  background: `
    radial-gradient(circle at 20% 30%, rgba(138, 84, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(159, 110, 255, 0.12) 0%, transparent 50%)
  `,
  animation: `${pulse} 8s ease-in-out infinite`,
});

const GlassCard = styled(Card)({
  backdropFilter: "blur(20px)",
  borderRadius: "24px",
  padding: "32px",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
});

const GradientButton = styled(Button)({
  background: "linear-gradient(135deg, #8A54FF 0%, #9F6EFF 100%)",
  color: "#fff",
  padding: "16px 40px",
  borderRadius: "16px",
  fontSize: "18px",
  fontWeight: 700,
  textTransform: "none",
  boxShadow: "0 8px 32px rgba(138, 84, 255, 0.4)",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(135deg, #9F6EFF 0%, #B88CFF 100%)",
    transform: "translateY(-2px)",
    boxShadow: "0 12px 48px rgba(138, 84, 255, 0.6)",
  },
});

const OutlineButton = styled(Button)({
  color: "#B88CFF",
  padding: "16px 40px",
  borderRadius: "16px",
  fontSize: "18px",
  fontWeight: 700,
  textTransform: "none",
  border: "2px solid #8A54FF",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "rgba(138, 84, 255, 0.1)",
    borderColor: "#9F6EFF",
    transform: "translateY(-2px)",
  },
});

const FeatureIcon = styled(Box)(({ gradient, iconcolor }) => ({
  width: "80px",
  height: "80px",
  borderRadius: "20px",
  background:
    gradient ||
    "linear-gradient(135deg, rgba(138, 84, 255, 0.2) 0%, rgba(159, 110, 255, 0.2) 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "24px",
  flexShrink: 0,
  boxShadow: `0 8px 32px ${iconcolor}33`,
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "scale(1.1) rotate(5deg)",
    boxShadow: `0 12px 48px ${iconcolor}55`,
  },
  "& svg": {
    fontSize: "40px",
    color: iconcolor || "#B88CFF",
  },
}));

const StatsBox = styled(Box)({
  textAlign: "center",
  padding: "32px",
  background: "rgba(255, 255, 255, 0.03)",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(10px)",
});

const FloatingShape = styled(Box)(({ delay = 0, left, top }) => ({
  position: "absolute",
  left: left || "auto",
  top: top || "auto",
  animation: `${float} 6s ease-in-out ${delay}s infinite`,
  opacity: 0.15,
  pointerEvents: "none",
}));

export default function LandingPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <AutoStories />,
      title: "AI-Powered Summaries",
      description:
        "Get instant, intelligent summaries of your study materials in seconds",
      color: "#8A54FF",
      gradient: "linear-gradient(135deg, #8A54FF 0%, #A26EFF 100%)",
      rgb: "138, 84, 255",
    },
    {
      icon: <Psychology />,
      title: "Smart Q&A Assistant",
      description:
        "Ask questions and get accurate answers from your documents instantly",
      color: "#5B9FFF",
      gradient: "linear-gradient(135deg, #5B9FFF 0%, #7FB5FF 100%)",
      rgb: "91, 159, 255",
    },
    {
      icon: <Quiz />,
      title: "Auto-Generated Flashcards",
      description: "Create study flashcards automatically from any document",
      color: "#FF6B9D",
      gradient: "linear-gradient(135deg, #FF6B9D 0%, #FFA0C1 100%)",
      rgb: "255, 107, 157",
    },
    {
      icon: <School />,
      title: "Practice MCQs",
      description:
        "Test your knowledge with AI-generated multiple choice questions",
      color: "#4ECDC4",
      gradient: "linear-gradient(135deg, #4ECDC4 0%, #7DE5DD 100%)",
      rgb: "78, 205, 196",
    },
    {
      icon: <TrendingUp />,
      title: "Progress Tracking",
      description: "Monitor your learning journey with detailed analytics",
      color: "#FFD93D",
      gradient: "linear-gradient(135deg, #FFD93D 0%, #FFE66D 100%)",
      rgb: "255, 217, 61",
    },
    {
      icon: <Speed />,
      title: "Study Smarter, Not Harder",
      description:
        "Save time and improve retention with AI-powered learning tools",
      color: "#6BCF7F",
      gradient: "linear-gradient(135deg, #6BCF7F 0%, #95E1A2 100%)",
      rgb: "107, 207, 127",
    },
  ];

  const benefits = [
    "Upload any PDF or document",
    "Get summaries in seconds",
    "Generate flashcards automatically",
    "Ask questions about your content",
    "Track your study progress",
    "Access from anywhere",
  ];

  return (
    <Box sx={{ background: "#0F0B1A" }}>
      {/* Hero Section */}
      <HeroSection>
        <AnimatedBackground />

        {/* Floating Shapes */}
        <FloatingShape delay={0} left="5%" top="10%">
          <AutoStories sx={{ fontSize: 100, color: "#8A54FF" }} />
        </FloatingShape>
        <FloatingShape delay={2} left="85%" top="20%">
          <Psychology sx={{ fontSize: 120, color: "#9F6EFF" }} />
        </FloatingShape>
        <FloatingShape delay={4} left="10%" top="70%">
          <School sx={{ fontSize: 90, color: "#B88CFF" }} />
        </FloatingShape>

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
          <Box
            sx={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(30px)",
              transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Logo & Brand */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 6,
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #8A54FF, #9F6EFF)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 12px 40px rgba(138, 84, 255, 0.5)",
                  mr: 3,
                }}
              >
                <img
                  src={logo}
                  alt="EduAI Logo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "20px",
                  }}
                />
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  background:
                    "linear-gradient(135deg, #FFFFFF 0%, #B88CFF 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}
              >
                EduAI Assistant
              </Typography>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "48px", md: "72px" },
                fontWeight: 900,
                color: "#FFFFFF",
                textAlign: "center",
                mb: 3,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              Your AI-Powered
              <br />
              <Box
                component="span"
                sx={{
                  background:
                    "linear-gradient(135deg, #8A54FF 0%, #B88CFF 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Study Companion
              </Box>
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                textAlign: "center",
                mb: 6,
                maxWidth: "800px",
                mx: "auto",
                lineHeight: 1.6,
              }}
            >
              Transform your learning experience with AI. Generate summaries,
              flashcards, and quizzes from any document in seconds.
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 3,
                justifyContent: "center",
                flexWrap: "wrap",
                mb: 8,
              }}
            >
              <GradientButton
                endIcon={<ArrowForward />}
                onClick={() => navigate("/register")}
              >
                Get Started Free
              </GradientButton>
              <OutlineButton onClick={() => navigate("/login")}>
                Sign In
              </OutlineButton>
            </Box>

            {/* Stats */}
            <Grid
              container
              spacing={3}
              sx={{ maxWidth: "900px", mx: "auto", mb: 8 }}
            >
              {[
                { value: "AI-Powered", label: "Smart Learning" },
                { value: "Instant", label: "Summaries" },
                { value: "Unlimited", label: "Documents" },
              ].map((stat, index) => (
                <Grid size={{ xs: 12, md: 4 }} key={index}>
                  <StatsBox
                    sx={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible
                        ? "translateY(0)"
                        : "translateY(30px)",
                      transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 900,
                        background: "linear-gradient(135deg, #8A54FF, #B88CFF)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        mb: 1,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "16px",
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </StatsBox>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </HeroSection>

      <Box
        sx={{
          py: 12,
          background: "linear-gradient(180deg, #0F0B1A 0%, #1A122A 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "36px", md: "56px" },
              fontWeight: 900,
              color: "#FFFFFF",
              textAlign: "center",
              mb: 2,
            }}
          >
            Everything You Need to
            <br />
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #8A54FF, #B88CFF)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Excel in Your Studies
            </Box>
          </Typography>

          <Typography
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              textAlign: "center",
              mb: 8,
              fontSize: "18px",
              maxWidth: "700px",
              mx: "auto",
            }}
          >
            Powerful AI tools designed to help you learn faster and retain more
          </Typography>

          <Grid container spacing={4} sx={{ justifyContent: "center" }}>
            {features.map((feature, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={index}
                sx={{ display: "flex" }}
              >
                <GlassCard
                  sx={{
                    animation: `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s backwards`,
                    background: `rgba(${feature.rgb}, 0.05)`,
                    border: `1px solid rgba(${feature.rgb}, 0.15)`,
                    boxShadow: `0 8px 32px rgba(${feature.rgb}, 0.1)`,
                    "&:hover": {
                      transform: "translateY(-8px)",
                      background: `rgba(${feature.rgb}, 0.1)`,
                      boxShadow: `0 20px 60px rgba(${feature.rgb}, 0.3)`,
                      borderColor: `rgba(${feature.rgb}, 0.4)`,
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      p: 0,
                      height: "100%",
                      "&:last-child": { pb: 0 },
                    }}
                  >
                    <FeatureIcon
                      gradient={feature.gradient}
                      iconcolor={feature.color}
                    >
                      {feature.icon}
                    </FeatureIcon>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        color: "#FFFFFF",
                        mb: 2,
                        fontSize: { xs: "20px", md: "22px" },
                        lineHeight: 1.3,
                        minHeight: { xs: "auto", md: "60px" },
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255, 255, 255, 0.75)",
                        lineHeight: 1.7,
                        fontSize: "15px",
                        flexGrow: 1,
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box
        sx={{
          py: 12,
          background: "linear-gradient(180deg, #1A122A 0%, #0F0B1A 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "36px", md: "48px" },
              fontWeight: 900,
              color: "#FFFFFF",
              textAlign: "center",
              mb: 8,
            }}
          >
            Why Choose EduAI?
          </Typography>

          <Box sx={{ maxWidth: "1100px", mx: "auto" }}>
            <Grid container spacing={3}>
              {benefits.map((benefit, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      p: 3,
                      borderRadius: "16px",
                      background: "rgba(138, 84, 255, 0.05)",
                      border: "1px solid rgba(138, 84, 255, 0.2)",
                      transition: "all 0.3s ease",
                      height: "100%",
                      minHeight: "80px",
                      animation: `${fadeInUp} 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s backwards`,
                      "&:hover": {
                        background: "rgba(138, 84, 255, 0.1)",
                        transform: "translateY(-4px)",
                        borderColor: "rgba(138, 84, 255, 0.4)",
                        boxShadow: "0 8px 32px rgba(138, 84, 255, 0.2)",
                      },
                    }}
                  >
                    <CheckCircle
                      sx={{ color: "#8A54FF", fontSize: 28, flexShrink: 0 }}
                    />
                    <Typography
                      sx={{
                        color: "#FFFFFF",
                        fontSize: "16px",
                        fontWeight: 600,
                        textAlign: "left",
                      }}
                    >
                      {benefit}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      <Box
        sx={{
          py: 12,
          background: "linear-gradient(135deg, #1A0E2E 0%, #2D1B4E 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <AnimatedBackground />
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 2 }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "36px", md: "56px" },
                fontWeight: 900,
                color: "#FFFFFF",
                mb: 3,
              }}
            >
              Ready to Transform
              <br />
              Your Learning?
            </Typography>
            <Typography
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "20px",
                mb: 6,
              }}
            >
              Join thousands of students who are already studying smarter with
              EduAI
            </Typography>
            <GradientButton
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate("/register")}
              sx={{ fontSize: "20px", padding: "20px 50px" }}
            >
              Start Learning Now
            </GradientButton>
          </Box>
        </Container>
      </Box>

      <Box
        sx={{
          py: 4,
          background: "#0F0B1A",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Container>
          <Typography
            sx={{
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: "14px",
            }}
          >
            © 2026 EduAI Assistant. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
