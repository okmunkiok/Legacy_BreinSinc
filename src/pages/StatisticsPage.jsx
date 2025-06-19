import React from 'react';
import { Container, Paper, Typography, Box, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const StatisticsPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            카드 통계 보기
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              이곳은 학습 통계 화면입니다.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" paragraph>
                개발될 기능:
              </Typography>
              <ul>
                <li>일별/주별/월별 학습 통계 그래프</li>
                <li>카드별 정답률 표시</li>
                <li>가장 많이 틀린 카드 순위</li>
                <li>학습 시간 통계</li>
                <li>레이어별 숙련도 표시</li>
                <li>학습 목표 설정 및 달성률</li>
              </ul>
            </Box>
          </Alert>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => navigate('/')}>
              메인으로 돌아가기
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default StatisticsPage;
