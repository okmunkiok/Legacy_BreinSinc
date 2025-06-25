import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const HomePage = () => {
  const navigate = useNavigate();
  const { user, googleAccessToken, selectedSheet, setSelectedSheet, setCardData, cardData, devMode } = useAuth();

  const menuItems = [
    { title: '카드 학습', description: '저장된 카드로 학습을 시작하세요', path: '/learning', color: '#4CAF50' },
    { title: '카드 생성, 수정, 관리', description: '새로운 카드를 만들거나 기존 카드를 수정하세요', path: '/cards', color: '#2196F3' },
    { title: '카드 통계 보기', description: '학습 진행 상황과 통계를 확인하세요', path: '/statistics', color: '#FF9800' },
  ];

  const handleSelectDataClick = () => {
    const fetchSheetData = async (fileId) => {
      if (!googleAccessToken) {
        alert("액세스 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const sheetName = 'CardData';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values/${sheetName}?key=${API_KEY}`;
      
      try {
        const response = await axios.get(url, {
          headers: { 'Authorization': `Bearer ${googleAccessToken}` }
        });
        
        const fetchedData = response.data.values;
        
        if (fetchedData && fetchedData.length > 1) {
          setCardData(fetchedData);
          console.log(`[디버그/HomePage] 시트에서 데이터를 성공적으로 가져왔습니다:`, fetchedData);
        } else {
          setCardData(null);
          alert('"CardData" 탭에 학습할 내용이 없습니다.');
        }
      } catch (error) {
        console.error('시트 데이터 가져오기 실패:', error);
        alert('시트 데이터를 가져오는 데 실패했습니다.');
      }
    };

    gapi.load('picker', () => {
      const pickerCallback = (data) => {
        if (data.action === google.picker.Action.PICKED) {
          const doc = data.docs[0];
          const fileId = doc.id;
          const fileName = doc.name;
          
          console.log(`선택된 파일: ${fileName} (ID: ${fileId})`);
          setSelectedSheet({ id: fileId, name: fileName });
          fetchSheetData(fileId);
        }
      };

      const picker = new google.picker.PickerBuilder()
        .addView(google.picker.ViewId.SPREADSHEETS)
        .setOAuthToken(googleAccessToken)
        .setDeveloperKey(API_KEY)
        .setCallback(pickerCallback)
        .build();
      
      picker.setVisible(true);
    });
  };

  const handleMenuClick = (path) => {
    if (devMode || (user && selectedSheet && cardData)) {
      navigate(path);
    } else if (!user) {
      navigate('/login', { state: { from: { pathname: path } } });
    } else if (!selectedSheet || !cardData) {
      alert('먼저 "카드 데이터 선택" 버튼을 눌러 학습할 스프레드시트를 선택해주세요.');
    }
  };

  const isCardEnabled = devMode || (user && selectedSheet && cardData);

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
            disabled={!user || devMode}
            sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            {devMode ? '개발자 모드 활성화됨' : (selectedSheet ? `선택된 시트: ${selectedSheet.name}` : "카드 데이터 선택")}
          </Button>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexDirection: { xs: 'column', lg: 'row' } }}>
            {menuItems.map((item) => (
              <Card 
                key={item.title} 
                onClick={() => handleMenuClick(item.path)} 
                sx={{ 
                  width: { xs: '100%', lg: 300 }, 
                  bgcolor: isCardEnabled ? item.color : '#cccccc',
                  color: 'white', 
                  cursor: isCardEnabled ? 'pointer' : 'not-allowed',
                  opacity: isCardEnabled ? 1 : 0.6,
                  '&:hover': isCardEnabled ? { 
                    transform: 'translateY(-5px)', 
                    boxShadow: 6 
                  } : {},
                  transition: 'all 0.2s'
                }}
              >
                <CardContent sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  height: '100%', 
                  minHeight: 180, 
                  p: 2 
                }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {item.description}
                  </Typography>
                  {!isCardEnabled && (
                    <Typography variant="caption" sx={{ mt: 2, opacity: 0.8 }}>
                      {!user ? '로그인이 필요합니다' : '데이터를 선택해주세요'}
                    </Typography>
                  )}
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
