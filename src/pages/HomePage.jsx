/* src/pages/HomePage.jsx */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogContent, DialogTitle } from '@mui/material';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import HistoryIcon from '@mui/icons-material/History';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const HomePage = () => {
  const navigate = useNavigate();
  const { user, googleAccessToken, selectedSheet, setSelectedSheet, setCardData, cardData, devMode } = useAuth();
  const [learningModalOpen, setLearningModalOpen] = useState(false);

  const menuItems = [
    { title: '카드 학습', description: '매칭 게임으로 학습을 시작하세요', path: '/learning', color: '#4CAF50' },
    { title: '카드 관리', description: '카드를 만들거나 수정하세요', path: '/cards', color: '#2196F3' },
    { title: '학습 통계', description: '학습 진행 상황을 확인하세요', path: '/statistics', color: '#FF9800' },
  ];

  const handleSelectDataClick = () => {
    const fetchSheetData = async (fileId) => {
      if (!googleAccessToken) return alert("액세스 토큰이 없습니다. 다시 로그인해주세요.");
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values/CardData?key=${API_KEY}`;
      try {
        const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${googleAccessToken}` } });
        const fetchedData = response.data.values;
        if (fetchedData && fetchedData.length > 1) setCardData(fetchedData);
        else {
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
          setSelectedSheet({ id: doc.id, name: doc.name });
          fetchSheetData(doc.id);
        }
      };
      new google.picker.PickerBuilder()
        .addView(google.picker.ViewId.SPREADSHEETS)
        .setOAuthToken(googleAccessToken)
        .setDeveloperKey(API_KEY)
        .setCallback(pickerCallback)
        .build()
        .setVisible(true);
    });
  };

  const isCardEnabled = devMode || (user && selectedSheet && cardData);

  const handleMenuClick = (path) => {
    if (path === '/learning') {
      if (isCardEnabled) {
        setLearningModalOpen(true);
      } else if (!user) {
        navigate('/login', { state: { from: { pathname: path } } });
      } else {
        alert('먼저 "카드 데이터 선택" 버튼을 눌러 학습할 스프레드시트를 선택해주세요.');
      }
    } else {
      if (isCardEnabled) {
        navigate(path);
      } else if (!user) {
        navigate('/login', { state: { from: { pathname: path } } });
      } else {
        alert('먼저 "카드 데이터 선택" 버튼을 눌러 학습할 스프레드시트를 선택해주세요.');
      }
    }
  };

  // 전체 범위로 학습
  const handleFullRange = () => {
    setLearningModalOpen(false);
    navigate('/learning');
  };

  // 범위 선택해서 학습
  const handleSelectRange = () => {
    setLearningModalOpen(false);
    navigate('/select-range');
  };

  // 최근 학습 반복하기 (텍스트 변경됨)
  const handleRecentRange = async () => {
    setLearningModalOpen(false);
    
    if (devMode) {
      const lastStudyInfo = localStorage.getItem('lastStudyInfo');
      if (lastStudyInfo) {
        const { selectedCols, studyRange } = JSON.parse(lastStudyInfo);
        const savedCols = selectedCols.split(',').map(col => 
          col === 'null' ? null : parseInt(col)
        );
        
        const selectedRows = [];
        studyRange.split(',').forEach(range => {
          if (range.includes('-')) {
            const [start, end] = range.split('-').map(Number);
            for (let i = start; i <= end; i++) {
              selectedRows.push(i);
            }
          } else {
            selectedRows.push(Number(range));
          }
        });
        
        navigate('/learning', { 
          state: { 
            selectedRows,
            savedColumns: savedCols 
          } 
        });
      } else {
        navigate('/learning');
      }
      return;
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}/values/StudyLog?key=${API_KEY}`;
      const response = await axios.get(url, { 
        headers: { 'Authorization': `Bearer ${googleAccessToken}` } 
      });
      
      const logs = response.data.values;
      if (logs && logs.length > 1) {
        const lastLog = logs[logs.length - 1];
        const studyRange = lastLog[2];
        const selectedColsStr = lastLog[1];
        
        if (studyRange && selectedColsStr) {
          const savedCols = selectedColsStr.split(',').map(col => 
            col === 'null' ? null : parseInt(col)
          );
          
          const selectedRows = [];
          studyRange.split(',').forEach(range => {
            if (range.includes('-')) {
              const [start, end] = range.split('-').map(Number);
              for (let i = start; i <= end; i++) {
                selectedRows.push(i);
              }
            } else {
              selectedRows.push(Number(range));
            }
          });
          
          navigate('/learning', { 
            state: { 
              selectedRows,
              savedColumns: savedCols 
            } 
          });
        } else {
          alert('최근 학습 기록이 없습니다. 학습 범위를 선택해주세요.');
          navigate('/select-range');
        }
      } else {
        alert('학습 기록이 없습니다. 학습 범위를 선택해주세요.');
        navigate('/select-range');
      }
    } catch (error) {
      console.error('학습 기록 가져오기 실패:', error);
      alert('학습 기록을 불러올 수 없습니다. 학습 범위를 선택해주세요.');
      navigate('/select-range');
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
                  '&:hover': isCardEnabled ? { transform: 'translateY(-5px)', boxShadow: 6 } : {}, 
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

      {/* 학습 옵션 선택 모달 - 3개 버튼 */}
      <Dialog 
        open={learningModalOpen} 
        onClose={() => setLearningModalOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
          학습 방식 선택
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            {/* 전체 범위 학습 */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<AllInclusiveIcon />}
              onClick={handleFullRange}
              sx={{
                py: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                '& .MuiButton-startIcon': { margin: 0 }
              }}
            >
              <Box sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>전체 범위 학습</Box>
              <Box sx={{ fontSize: '0.9rem', color: 'text.secondary', mt: 1 }}>
                모든 카드로 학습 시작
              </Box>
            </Button>
            
            {/* 범위 선택 */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<CheckBoxIcon />}
              onClick={handleSelectRange}
              sx={{
                py: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                '& .MuiButton-startIcon': { margin: 0 }
              }}
            >
              <Box sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>학습 범위 선택</Box>
              <Box sx={{ fontSize: '0.9rem', color: 'text.secondary', mt: 1 }}>
                원하는 카드를 선택하여 학습
              </Box>
            </Button>

            {/* 최근 학습 반복하기 (텍스트 변경됨) */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<HistoryIcon />}
              onClick={handleRecentRange}
              sx={{
                py: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                '& .MuiButton-startIcon': { margin: 0 }
              }}
            >
              <Box sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>최근 학습 반복하기</Box>
              <Box sx={{ fontSize: '0.9rem', color: 'text.secondary', mt: 1 }}>
                {devMode ? '기본 설정으로 학습' : '마지막 학습 설정으로 다시'}
              </Box>
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default HomePage;
