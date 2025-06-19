import React from 'react';
import { Box, Typography } from '@mui/material';
import Header from '../components/Header';

const CardManagementPage = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          카드 생성, 수정, 관리
        </Typography>
        <Typography variant="body1">
          여기에 카드 관리 기능이 구현됩니다.
        </Typography>
      </Box>
    </Box>
  );
};

export default CardManagementPage;
