// frontend/src/App.js
import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UploadDocument from "./pages/UploadDocuments";
import Summaries from "./pages/Summaries";
import MyDocuments from "./pages/MyDocuments";
import Flashcards from "./pages/Flashcards";
import QAAssistant from "./pages/QAAssistant";
import Quizzes from "./pages/Quizzes";
import ProtectedRoute from "./components/ProtectedRoute";
import StudyRecommendations from "./pages/StudyRecommendations";
import StudyTimer from "./components/StudyTimer";
const theme = createTheme({
  palette: {
    primary: {
      main: "#8A54FF",
    },
    secondary: {
      main: "#9F6EFF",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function ConditionalTimer() {
  const { user } = useAuth();
  const location = window.location.pathname;
  const publicPages = ["/", "/login", "/register"];
  if (!user || publicPages.includes(location)) return null;
  return <StudyTimer />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadDocument />
                </ProtectedRoute>
              }
            />
            <Route
              path="/summaries"
              element={
                <ProtectedRoute>
                  <Summaries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-documents"
              element={
                <ProtectedRoute>
                  <MyDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flashcards"
              element={
                <ProtectedRoute>
                  <Flashcards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/qa-assistant"
              element={
                <ProtectedRoute>
                  <QAAssistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quizzes"
              element={
                <ProtectedRoute>
                  <Quizzes />
                </ProtectedRoute>
              }
            />
            <Route path="/recommendations" element={<StudyRecommendations />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          <ConditionalTimer />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
