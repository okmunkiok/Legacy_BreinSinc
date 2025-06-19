import React from 'react';
// BrowserRouter를 Router로 import하는 대신, 명시적으로 사용합니다.
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LearningPage from './pages/LearningPage';
import CardManagementPage from './pages/CardManagementPage';
import StatisticsPage from './pages/StatisticsPage';
import LoginPage from './pages/LoginPage';

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
          {/*
            [핵심 수정 사항]
            BrowserRouter에 basename을 설정합니다.
            import.meta.env.BASE_URL은 Vite가 자동으로 설정해주는 환경 변수입니다.
            - 로컬 개발 시: '/'
            - 빌드 시: '/BreinSinc/'
            이렇게 하면 로컬과 배포 환경 모두에서 라우팅이 정상적으로 동작합니다.
          */}
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/learning" element={<LearningPage />} />
              <Route path="/cards" element={<CardManagementPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
