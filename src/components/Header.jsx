import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Checkbox, FormControlLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, devMode, toggleDevMode } = useAuth();

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#58cc02' }}>
      <Toolbar>
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{ 
            flexGrow: 1, 
            fontWeight: 'bold', 
            cursor: 'pointer',
            color: 'white',
            '&:hover': { opacity: 0.8 }
          }}
          onClick={handleLogoClick}
        >
          BreinSinc
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* 개발자 모드 체크박스 */}
          <FormControlLabel
            control={
              <Checkbox 
                checked={devMode}
                onChange={(e) => toggleDevMode(e.target.checked)}
                sx={{ 
                  color: 'white',
                  '&.Mui-checked': {
                    color: 'white',
                  },
                }}
              />
            }
            label="개발자 모드"
            sx={{ 
              color: 'white',
              mr: 2,
              '& .MuiFormControlLabel-label': {
                fontSize: '0.9rem'
              }
            }}
          />
          
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ color: 'white' }}>
                {user.displayName || user.email}
              </Typography>
              <Button color="inherit" onClick={handleLogout} sx={{ color: 'white' }}>
                로그아웃
              </Button>
            </Box>
          ) : (
            <Button color="inherit" onClick={handleLoginClick} sx={{ color: 'white' }}>
              로그인
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
