import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { useGoogleLogin } from '@react-oauth/google';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const { login } = useAuth();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;
      try {
        const res = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userData = res.data;
        login(userData, accessToken);
        navigate(from, { replace: true });
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    },
    onError: (error) => {
      console.error('Google 로그인 실패:', error);
      alert('Google 로그인에 실패했습니다. 다시 시도해주세요.');
    },
    // [핵심 수정 사항]
    // 사용자에게 어떤 권한을 요청할지 명시적으로 지정합니다.
    // drive.file: 사용자가 선택한 특정 파일에 접근할 권한
    // spreadsheets.readonly: 스프레드시트를 읽을 수 있는 권한
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
  });

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          로그인
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Google 계정으로 로그인하세요.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => googleLogin()}
          sx={{ fontSize: '1.1rem', padding: '10px 20px' }}
        >
          Google로 로그인
        </Button>
      </Box>
    </Box>
  );
};

export default LoginPage;
