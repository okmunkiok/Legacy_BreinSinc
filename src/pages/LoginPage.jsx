// 최종 단계 LoginPage.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/";

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        login(userInfo.data, tokenResponse.access_token);
        navigate(from, { replace: true });
      } catch (error) {
        console.error('Login Failed:', error);
      }
    },
    scope: 'openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
  });

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Container component="main" maxWidth="xs">
        <Paper elevation={6} sx={{ padding: 4, textAlign: 'center' }}>
          <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            BreinSinc
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Google 계정으로 로그인하여<br/>학습 데이터를 저장하고 관리하세요.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={() => googleLogin()}
            sx={{ mt: 3, textTransform: 'none', fontSize: '1rem', py: 1.5 }}
          >
            Google 계정으로 시작하기
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
