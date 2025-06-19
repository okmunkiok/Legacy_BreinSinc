// 최종 단계 Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Button, Box, Avatar } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext'; // AuthContext에서 정보를 가져오기 위해 추가

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // user 정보를 가져옵니다.

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={() => navigate('/')} title="홈으로">
          <HomeIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          BreinSinc
        </Typography>

        {user ? (
          // user 정보가 있으면, 사용자 이름과 로그아웃 버튼 표시
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar src={user.picture} alt={user.name} sx={{ width: 32, height: 32 }} />
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user.name}
            </Typography>
            <Button color="inherit" variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogout}>
              로그아웃
            </Button>
          </Box>
        ) : (
          // user 정보가 없으면, 로그인 버튼 표시
          <Button color="inherit" variant="outlined" startIcon={<LoginIcon />} onClick={() => navigate('/login')}>
            로그인
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
