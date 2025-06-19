import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Card, CardContent, Typography, Button } from '@mui/material';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const HomePage = () => {
  const navigate = useNavigate();
  const { user, googleAccessToken, selectedSheet, setSelectedSheet } = useAuth();

  const menuItems = [
    { title: '카드 학습', description: '저장된 카드로 학습을 시작하세요', path: '/learning', color: '#4CAF50' },
    { title: '카드 생성, 수정, 관리', description: '새로운 카드를 만들거나 기존 카드를 수정하세요', path: '/cards', color: '#2196F3' },
    { title: '카드 통계 보기', description: '학습 진행 상황과 통계를 확인하세요', path: '/statistics', color: '#FF9800' },
  ];

  const handleSelectDataClick = () => {
    gapi.load('picker', () => {
      createPicker();
    });

    function createPicker() {
      const pickerCallback = (data) => {
        if (data.action === google.picker.Action.PICKED) {
          const doc = data.docs[0];
          const fileId = doc.id;
          const fileName = doc.name;
          
          console.log(`선택된 파일: ${fileName} (ID: ${fileId})`);
          alert(`'${fileName}' 시트가 선택되었습니다.`);

          setSelectedSheet({ id: fileId, name: fileName });
        }
      };

      const picker = new google.picker.PickerBuilder()
        .addView(google.picker.ViewId.SPREADSHEETS)
        .setOAuthToken(googleAccessToken)
        .setDeveloperKey(API_KEY)
        .setCallback(pickerCallback)
        .build();
      
      picker.setVisible(true);
    }
  };

  const handleMenuClick = (path) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: path } } });
      return;
    }
    if (selectedSheet) {
      navigate(path);
    } else {
      alert('먼저 "카드 데이터 선택" 버튼을 눌러 학습할 스프레드시트를 선택해주세요.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<FindInPageIcon />}
            onClick={handleSelectDataClick}
            disabled={!user}
            sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            {selectedSheet ? `선택된 시트: ${selectedSheet.name}` : "카드 데이터 선택"}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexDirection: { xs: 'column', lg: 'row' } }}>
            {menuItems.map((item) => (
              <Card key={item.title} onClick={() => handleMenuClick(item.path)} sx={{ width: { xs: '100%', lg: 300 }, bgcolor: item.color, color: 'white', cursor: 'pointer', '&:hover': { transform: 'translateY(-5px)' } }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minHeight: 180, p: 2 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>{item.title}</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>{item.description}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
