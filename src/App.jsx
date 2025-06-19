// 최종 단계 App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LearningPage from './pages/LearningPage';
import CardManagementPage from './pages/CardManagementPage';
import StatisticsPage from './pages/StatisticsPage';
import LoginPage from './pages/LoginPage'; // 이 줄 추가

const theme = createTheme({
  palette: { mode: 'light', primary: { main: '#1976d2' } },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  if (!GOOGLE_CLIENT_ID) {
    return <div>Google Client ID가 없습니다. .env 파일을 확인해주세요.</div>;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} /> {/* 이 줄 추가 */}
              <Route path="/" element={<HomePage />} />
              <Route path="/learning" element={<LearningPage />} />
              <Route path="/cards" element={<CardManagementPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
