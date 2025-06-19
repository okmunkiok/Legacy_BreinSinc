import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Card, CardContent, Typography, Button } from '@mui/material';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

// .env 파일에서 환경 변수를 가져옵니다.
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const HomePage = () => {
  const navigate = useNavigate();
  // Context에서 필요한 모든 것을 가져옵니다.
  const { user, googleAccessToken, selectedSheet, setSelectedSheet } = useAuth();

  const menuItems = [
    {
      title: '카드 학습',
      description: '저장된 카드로 학습을 시작하세요',
      path: '/learning',
      color: '#4CAF50',
    },
    {
      title: '카드 생성, 수정, 관리',
      description: '새로운 카드를 만들거나 기존 카드를 수정하세요',
      path: '/cards',
      color: '#2196F3',
    },
    {
      title: '카드 통계 보기',
      description: '학습 진행 상황과 통계를 확인하세요',
      path: '/statistics',
      color: '#FF9800',
    },
  ];

  // "카드 데이터 선택" 버튼을 눌렀을 때 실행될 함수
  const handleSelectDataClick = () => {
    // 1. gapi 라이브러리가 로드되었는지 확인하고, Picker API를 로드합니다.
    gapi.load('picker', () => {
      // 2. 파일 선택창(Picker)을 생성하는 함수를 호출합니다.
      createPicker();
    });

    function createPicker() {
      // 선택이 완료되었을 때 실행될 콜백 함수
      const pickerCallback = (data) => {
        if (data.action === google.picker.Action.PICKED) {
          const doc = data.docs[0];
          const fileId = doc.id;
          const fileName = doc.name;
          
          console.log(`선택된 파일: ${fileName} (ID: ${fileId})`);
          alert(`'${fileName}' 시트가 선택되었습니다.`);

          // 3. 선택된 시트 정보를 앱 전역 상태(Context)에 저장합니다.
          setSelectedSheet({ id: fileId, name: fileName });
        }
      };

      // 4. 파일 선택창의 옵션을 설정하고 빌드합니다.
      const picker = new google.picker.PickerBuilder()
        .addView(google.picker.ViewId.SPREADSHEETS) // 스프레드시트만 보여줍니다.
        .setOAuthToken(googleAccessToken) // 사용자의 파일에 접근하기 위한 '개인 출입증'
        .setDeveloperKey(API_KEY) // 이 앱을 식별하기 위한 '앱 이름표'
        .setCallback(pickerCallback)
        .build();
      
      // 5. 파일 선택창을 화면에 띄웁니다.
      picker.setVisible(true);
    }
  };

  // 일반 메뉴 카드를 클릭했을 때 실행될 함수
  const handleMenuClick = (path) => {
    // 로그인이 안되어 있으면 로그인 페이지로 보냅니다.
    if (!user) {
      navigate('/login', { state: { from: { pathname: path } } });
      return;
    }
    // 로그인이 되어 있고, 선택된 시트가 있어야만 이동합니다.
    if (selectedSheet) {
      navigate(path);
    } else {
      alert('먼저 "카드 데이터 선택" 버튼을 눌러 학습할 스프레드시트를 선택해주세요.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3,
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<FindInPageIcon />}
            // 로그인이 되어있을 때만 버튼이 활성화되고 클릭 가능합니다.
            onClick={handleSelectDataClick}
            disabled={!user}
            sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            {/* 선택된 시트가 있으면 파일 이름을, 없으면 기본 텍스트를 보여줍니다. */}
            {selectedSheet ? `선택된 시트: ${selectedSheet.name}` : "카드 데이터 선택"}
          </Button>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexDirection: { xs: 'column', lg: 'row' },
            }}
          >
            {menuItems.map((item) => (
              <Card
                key={item.title}
                onClick={() => handleMenuClick(item.path)}
                sx={{
                  width: { xs: '100%', lg: 300 },
                  bgcolor: item.color,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 16px 0 rgba(0,0,0,0.2)',
                  },
                }}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minHeight: 180, p: 2 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {item.description}
                  </Typography>
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
