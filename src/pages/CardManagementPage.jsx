import React from 'react';
import { Container, Paper, Typography, Box, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const CardManagementPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            카드 생성, 수정, 관리
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              이곳은 카드 관리 화면입니다.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" paragraph>
                개발될 기능:
              </Typography>
              <ul>
                <li>새로운 카드 세트 생성</li>
                <li>기존 카드 수정 및 삭제</li>
                <li>다층 구조 레이어 설정 (최대 6개 이상)</li>
                <li>Google 스프레드시트와 실시간 동기화</li>
                <li>카드 일괄 업로드 (CSV/Excel)</li>
                <li>카드 세트 공유 기능</li>
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

export default CardManagementPage;
