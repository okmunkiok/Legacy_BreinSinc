import React from 'react';
import { Container, Paper, Typography, Box, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const LearningPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            카드 학습
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              이곳은 카드 학습 화면입니다.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" paragraph>
                개발될 기능:
              </Typography>
              <ul>
                <li>Google 스프레드시트에서 카드 데이터 불러오기</li>
                <li>다층 구조 카드 매칭 게임 (듀오링고 스타일)</li>
                <li>레이어별 학습 모드 선택</li>
                <li>학습 진행 상태 저장</li>
                <li>틀린 카드 재학습 기능</li>
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

export default LearningPage;
