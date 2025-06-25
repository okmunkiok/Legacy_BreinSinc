/* src/pages/LearningPage.jsx */
import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import {
  Box, Select, MenuItem, Button, Typography,
  CircularProgress, LinearProgress, IconButton, keyframes,
  FormControlLabel, Checkbox, Dialog, DialogContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

/* ─── util ─── */
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const shake = keyframes`
  0%,100%   { transform: translateX(0); }
  20%,60%   { transform: translateX(-4px); }
  40%,80%   { transform: translateX(4px); }
`;

/* ─── constants ─── */
const CARDS_PER_PAGE = 5;

export default function LearningPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cardData, googleAccessToken, selectedSheet, devMode } = useAuth();

  const [headers,        setHeaders]        = useState([]);
  const [selectedCols,   setSelectedCols]   = useState([]);
  const [allPairs,       setAllPairs]       = useState([]);
  const [remainingPairs, setRemainingPairs] = useState([]);
  const [currentPagePairs, setCurrentPagePairs] = useState([]);
  const [columnCards,    setColumnCards]    = useState({});
  const [picked,         setPicked]         = useState([]);
  const [pageMatched,    setPageMatched]    = useState([]);
  const [totalMatchedCount, setTotalMatchedCount] = useState(0);
  const [matchedSinceLastShuffle, setMatchedSinceLastShuffle] = useState(0);
  const [wrong,          setWrong]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [totalPairs,     setTotalPairs]     = useState(0);
  const [showComplete,   setShowComplete]   = useState(false);
  const [studyLogSaveStatus, setStudyLogSaveStatus] = useState(null);
  const [orderedMode,    setOrderedMode]    = useState(false);
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [passedCheckpoints, setPassedCheckpoints] = useState(new Set());
 
  // StudyLog 기록용
  const startTimeRef = useRef(Date.now());
  const studyRangeRef = useRef('');
 
  // 정답률 계산용
  const attemptCountRef = useRef({});
  const correctCountRef = useRef({});

  /* orientation 감지 */
  const [isLand, setIsLand] = useState(window.innerWidth > window.innerHeight);
  useLayoutEffect(() => {
    const f = () => setIsLand(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', f);
    window.addEventListener('orientationchange', f);
    return () => {
      window.removeEventListener('resize', f);
      window.removeEventListener('orientationchange', f);
    };
  }, []);

  /* ─── 체크포인트 계산 함수 (1/3, 2/3 지점) ─── */
  const getCheckpoints = () => {
    if (totalPairs <= 3) return [totalPairs];
    const third = Math.floor(totalPairs / 3);
    const twoThird = Math.floor(totalPairs * 2 / 3);
    return [third, twoThird, totalPairs];
  };

  /* ─── 체크포인트 통과 확인 ─── */
  useEffect(() => {
    if (totalMatchedCount > 0 && totalPairs > 3) {
      const checkpoints = getCheckpoints();
      const firstCheckpoint = checkpoints[0];
      const secondCheckpoint = checkpoints[1];
      
      if (totalMatchedCount >= firstCheckpoint && !passedCheckpoints.has(firstCheckpoint)) {
        setPassedCheckpoints(prev => new Set([...prev, firstCheckpoint]));
        setCurrentCheckpoint(firstCheckpoint);
        setShowCheckpointModal(true);
      } else if (totalMatchedCount >= secondCheckpoint && !passedCheckpoints.has(secondCheckpoint) && secondCheckpoint !== totalPairs) {
        setPassedCheckpoints(prev => new Set([...prev, secondCheckpoint]));
        setCurrentCheckpoint(secondCheckpoint);
        setShowCheckpointModal(true);
      }
    }
  }, [totalMatchedCount, totalPairs, passedCheckpoints]);

  /* ─── 1) 헤더 로드 & cols 초기화 ─── */
  useEffect(() => {
    if (!cardData || cardData.length < 2) return;
    const head = cardData[0];
    setHeaders(head);
   
    const { savedColumns } = location.state || {};
    if (savedColumns && savedColumns.length > 0) {
      setSelectedCols(savedColumns);
      return;
    }
   
    if (selectedCols.length) return;

    const valid = head
      .map((h, i) => ({h,i}))
      .filter(o => !o.h.toLowerCase().includes('cardid'))
      .map(o => o.i);

    if (valid.length < 2) {
      alert('학습할 열이 2개 미만입니다');
      navigate('/');
      return;
    }
    setSelectedCols(valid);
  }, [cardData, navigate, location.state]);

  /* ─── StudyLog 저장 함수 ─── */
  const saveStudyLog = async () => {
    if (devMode) {
      const studyInfo = {
        selectedCols: selectedCols.map(c => c === null ? 'null' : c).join(','),
        studyRange: studyRangeRef.current,
        timestamp: new Date().toISOString(),
        orderedMode: orderedMode
      };
      localStorage.setItem('lastStudyInfo', JSON.stringify(studyInfo));
      console.log('개발자 모드: 학습 정보 임시 저장됨', studyInfo);
      setStudyLogSaveStatus('success');
      return;
    }

    if (!googleAccessToken || !selectedSheet) return;

    setStudyLogSaveStatus('saving');

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
   
    let totalAttempts = 0;
    let totalCorrect = 0;
    Object.keys(attemptCountRef.current).forEach(cardId => {
      totalAttempts += attemptCountRef.current[cardId];
      if (correctCountRef.current[cardId]) {
        totalCorrect += 1;
      }
    });
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / Object.keys(attemptCountRef.current).length) * 100) : 0;
   
    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const selectedColsStr = selectedCols.map(c => c === null ? 'null' : c).join(',');

    const values = [[
      timestamp,
      selectedColsStr,
      studyRangeRef.current,
      duration,
      accuracy,
      orderedMode ? 'Y' : 'N'
    ]];

    try {
      const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}?ranges=StudyLog!A1&key=${API_KEY}`;
     
      try {
        await axios.get(checkUrl, {
          headers: { 'Authorization': `Bearer ${googleAccessToken}` }
        });
      } catch (checkError) {
        console.log('StudyLog 탭이 없습니다. 새로 생성합니다.');
        const addSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}:batchUpdate?key=${API_KEY}`;
       
        await axios.post(addSheetUrl, {
          requests: [{
            addSheet: {
              properties: {
                title: 'StudyLog'
              }
            }
          }]
        }, {
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}/values/StudyLog!A1:F1?valueInputOption=USER_ENTERED&key=${API_KEY}`;
        await axios.put(headerUrl, {
          values: [['Timestamp', 'SelectedCols', 'StudyRange', 'Duration [sec]', 'Score', 'OrderedMode']]
        }, {
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${selectedSheet.id}/values/StudyLog:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;
      const response = await axios.post(url, {
        values: values
      }, {
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        }
      });
     
      console.log('StudyLog 저장 성공:', response.data);
      setStudyLogSaveStatus('success');
    } catch (error) {
      console.error('StudyLog 저장 실패 상세:', error.response?.data || error);
      setStudyLogSaveStatus('failed');
     
      setTimeout(() => {
        if (studyLogSaveStatus === 'saving') {
          setStudyLogSaveStatus('failed');
        }
      }, 5000);
    }
  };

  /* ─── 2) 게임 초기화 ─── */
  const initGame = useCallback(() => {
    const active = selectedCols.filter(c => c !== null);
    if (!cardData || active.length < 2) {
      setLoading(false);
      return;
    }

    const { selectedRows } = location.state || {};
   
    let pairs;
    let rangeStr = '';
   
    if (selectedRows && selectedRows.length > 0) {
      pairs = selectedRows
        .map(rowIndex => {
          const row = cardData[rowIndex];
          if (!row) return null;
          const p = {id:`p-${rowIndex-1}`};
          active.forEach(ci => p[ci] = row[ci]);
          return p;
        })
        .filter(p => p && active.every(ci => p[ci]));
     
      const sortedRows = [...selectedRows].sort((a, b) => a - b);
      const ranges = [];
      let start = sortedRows[0];
      let end = sortedRows[0];
     
      for (let i = 1; i < sortedRows.length; i++) {
        if (sortedRows[i] === end + 1) {
          end = sortedRows[i];
        } else {
          ranges.push(start === end ? `${start}` : `${start}-${end}`);
          start = sortedRows[i];
          end = sortedRows[i];
        }
      }
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      rangeStr = ranges.join(',');
    } else {
      pairs = cardData.slice(1)
        .map((row, i) => {
          const p = {id:`p-${i}`};
          active.forEach(ci => p[ci] = row[ci]);
          return p;
        })
        .filter(p => active.every(ci => p[ci]));
     
      rangeStr = `1-${pairs.length}`;
    }

    studyRangeRef.current = rangeStr;
    startTimeRef.current = Date.now();
    attemptCountRef.current = {};
    correctCountRef.current = {};

    const shuffledPairs = orderedMode ? pairs : shuffle(pairs);
    setAllPairs(pairs);
    setRemainingPairs(shuffledPairs);
    setTotalPairs(pairs.length);
    setTotalMatchedCount(0);
    setMatchedSinceLastShuffle(0);
    setPicked([]);
    setPageMatched([]);
    setWrong([]);
    setShowComplete(false);
    setStudyLogSaveStatus(null);
    setPassedCheckpoints(new Set());
    setLoading(false);
   
    loadNextPage(shuffledPairs, active);
  }, [cardData, selectedCols, location.state, orderedMode]);

  /* ─── 다음 페이지 로드 ─── */
  const loadNextPage = (remainingPool, activeCols) => {
    const nextCards = remainingPool.slice(0, CARDS_PER_PAGE);
    setCurrentPagePairs(nextCards);
    
    const newRemaining = remainingPool.slice(CARDS_PER_PAGE);
    setRemainingPairs(newRemaining);

    const newCards = {};
    activeCols.forEach(ci => {
      const arr = nextCards.map((p, idx) => ({
        id: p.id,
        text: p[ci],
        colIdx: ci
      }));
      newCards[ci] = orderedMode ? arr : shuffle(arr);
    });
   
    setColumnCards(newCards);
    setPicked([]);
    setWrong([]);
    setPageMatched([]);
  };

  useEffect(() => {
    setLoading(true);
    initGame();
  }, [initGame]);

  /* ─── 학습 완료 체크 ─── */
  useEffect(() => {
    if (!loading && totalPairs > 0 && totalMatchedCount === totalPairs) {
      saveStudyLog();
      setTimeout(() => {
        setShowComplete(true);
      }, 500);
    }
  }, [totalMatchedCount, totalPairs, loading]);

  /* ─── 카드 클릭 핸들러 ─── */
  const handleCardClick = (card, cardIndex) => {
    if (pageMatched.includes(card.id)) return;
   
    const exist = picked.find(p => p.colIdx === card.colIdx && p.id === card.id);
    const next = exist
      ? picked.filter(p => !(p.colIdx === card.colIdx && p.id === card.id))
      : [...picked, {...card, index: cardIndex}];
    setPicked(next);

    const activeCount = selectedCols.filter(c => c !== null).length;
    if (next.length === activeCount) {
      const ok = next.every(c => c.id === next[0].id);
     
      const cardId = next[0].id;
      if (!attemptCountRef.current[cardId]) {
        attemptCountRef.current[cardId] = 0;
      }
      attemptCountRef.current[cardId] += 1;
     
      if (ok) {
        correctCountRef.current[cardId] = true;
        setPageMatched(prev => [...prev, next[0].id]);
        setTotalMatchedCount(prev => prev + 1);
        setMatchedSinceLastShuffle(prev => prev + 1);
        setPicked([]);
       
        // 3쌍을 맞췄을 때 전체 카드 다시 섞기
        if (matchedSinceLastShuffle + 1 >= 3) {
          setMatchedSinceLastShuffle(0);
          
          // 현재 페이지에서 맞추지 못한 카드들 찾기
          const unmatchedPairs = currentPagePairs.filter(pair => 
            ![...pageMatched, next[0].id].includes(pair.id)
          );
          
          // 맞추지 못한 카드들과 남은 카드들을 합쳐서 다시 섞기
          let newRemainingPool = [...remainingPairs, ...unmatchedPairs];
          
          if (newRemainingPool.length > 0) {
            if (!orderedMode) {
              newRemainingPool = shuffle(newRemainingPool);
            }
            
            const activeCols = selectedCols.filter(c => c !== null);
            loadNextPage(newRemainingPool, activeCols);
          }
        } else {
          // 3쌍 미만일 때 현재 페이지의 모든 카드를 맞춘 경우
          const currentPageCards = currentPagePairs.length;
          if (pageMatched.length + 1 >= currentPageCards) {
            if (remainingPairs.length > 0) {
              const activeCols = selectedCols.filter(c => c !== null);
              loadNextPage(remainingPairs, activeCols);
            }
          }
        }
      } else {
        setWrong(next);
        setTimeout(() => {
          setPicked([]);
          setWrong([]);
        }, 500);
      }
    }
  };

  /* ─── 체크포인트 모달 닫기 ─── */
  const handleCheckpointContinue = () => {
    setShowCheckpointModal(false);
  };

  /* ─── 완료 후 홈으로 ─── */
  const handleComplete = () => {
    setShowComplete(false);
    navigate('/');
  };

  /* ─── 한 번 더 학습하기 ─── */
  const handleRestartLearning = () => {
    setShowComplete(false);
    setPicked([]);
    setPageMatched([]);
    setTotalMatchedCount(0);
    setMatchedSinceLastShuffle(0);
    setWrong([]);
    attemptCountRef.current = {};
    correctCountRef.current = {};
    startTimeRef.current = Date.now();
    setStudyLogSaveStatus(null);
    setPassedCheckpoints(new Set());
    initGame();
  };

  /* ─── 열 추가 핸들러 ─── */
  const handleAddColumn = () => {
    if (!headers) return;
    
    // CardID를 제외한 최대 열 개수 확인
    const validHeaders = headers.filter(h => !h.toLowerCase().includes('cardid'));
    const maxColumns = validHeaders.length;
    const currentTotalColumns = selectedCols.length; // 공백 포함한 전체 열 개수
    
    if (currentTotalColumns >= maxColumns) {
      alert(`더 이상 열을 추가할 수 없습니다. (최대 ${maxColumns}개)`);
      return;
    }
    
    // 사용 가능한 열 중 첫 번째 미사용 열 찾기
    const usedIndices = new Set(selectedCols.filter(c => c !== null));
    let newColumnIndex = null;
    
    for (let i = 0; i < headers.length; i++) {
      if (!headers[i].toLowerCase().includes('cardid') && !usedIndices.has(i)) {
        newColumnIndex = i;
        break;
      }
    }
    
    if (newColumnIndex !== null) {
      setSelectedCols([...selectedCols, newColumnIndex]);
    }
  };

  /* ─── 카드 스타일 헬퍼 ─── */
  const getCardStyle = (c, cardIndex) => {
    const isPicked = picked.some(p => p.colIdx === c.colIdx && p.id === c.id);
    const isWrong = wrong.some(p => p.colIdx === c.colIdx && p.id === c.id);
    const isMatched = pageMatched.includes(c.id);
   
    let sx = {
      flex: 1,
      p: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 3,
      cursor: 'pointer',
      transition: '.2s',
      textTransform: 'none',
      border: '2px solid #e5e5e5',
      boxShadow: '0 4px 0 #e5e5e5',
      bgcolor: '#fff',
      color: '#333',
      '&:hover': { bgcolor: '#f7f7f7' }
    };
   
    if (isWrong) return {
      ...sx,
      bgcolor: '#ffdfe1',
      color: '#c00',
      border: '2px solid #c00',
      animation: `${shake} .5s`
    };
   
    if (isPicked) return {
      ...sx,
      bgcolor: '#def',
      color: '#06c',
      border: '2px solid #06c'
    };
   
    if (isMatched) return {
      ...sx,
      bgcolor: '#eee',
      color: '#999',
      border: '2px solid #ddd',
      boxShadow: '0 2px 0 #ddd',
      cursor: 'default'
    };
   
    return sx;
  };

  const getAccuracy = () => {
    const attemptedCards = Object.keys(attemptCountRef.current);
    if (attemptedCards.length === 0) return 0;
   
    let correctCards = 0;
    attemptedCards.forEach(cardId => {
      if (correctCountRef.current[cardId]) {
        correctCards += 1;
      }
    });
   
    return Math.round((correctCards / attemptedCards.length) * 100);
  };

  const totalProgress = totalPairs ? (totalMatchedCount / totalPairs) * 100 : 0;

  /* ─── 커스텀 진행바 컴포넌트 ─── */
  const CustomProgressBar = () => {
    const checkpoints = getCheckpoints();

    return (
      <Box sx={{ position: 'relative', width: '100%', height: 40 }}>
        {checkpoints.map((checkpoint, idx) => {
          const position = (checkpoint / totalPairs) * 100;
          const isPassed = totalMatchedCount >= checkpoint;
          
          return (
            <Box key={checkpoint} sx={{
              position: 'absolute',
              left: `${position}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
              zIndex: 2
            }}>
              <Box sx={{
                width: 24, height: 24, borderRadius: '50%',
                bgcolor: isPassed ? '#58cc02' : '#fff',
                border: `3px solid ${isPassed ? '#58cc02' : '#e0e0e0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 'bold', color: isPassed ? '#fff' : '#999'
              }}>
                {isPassed && '✓'}
              </Box>
              <Typography sx={{
                fontSize: '0.7rem', color: isPassed ? '#58cc02' : '#999',
                fontWeight: isPassed ? 'bold' : 'normal', position: 'absolute', top: 30
              }}>
                {checkpoint}
              </Typography>
            </Box>
          );
        })}
        <LinearProgress 
          variant="determinate" 
          value={totalProgress} 
          sx={{
            position: 'absolute', 
            top: '50%', 
            transform: 'translateY(-50%)',
            width: '100%', 
            height: 8, 
            borderRadius: 4, 
            zIndex: 1,
            bgcolor: '#e0e0e0', 
            '& .MuiLinearProgress-bar': { 
              bgcolor: '#58cc02',
              transition: 'transform 0.4s ease-out'
            }
          }}
        />
      </Box>
    );
  };

  /* ─── 세로 진행바 컴포넌트 (수정됨) ─── */
  const VerticalProgressBar = () => {
    const checkpoints = getCheckpoints();

    return (
      <Box sx={{ position: 'relative', width: 80, height: '100%' }}>
        {checkpoints.map((checkpoint, idx) => {
          const position = 100 - (checkpoint / totalPairs) * 100;
          const isPassed = totalMatchedCount >= checkpoint;

          return (
            <Box key={checkpoint} sx={{
              position: 'absolute', top: `${position}%`, left: '50%',
              transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', gap: 1, zIndex: 2
            }}>
              <Typography sx={{
                fontSize: '0.7rem', color: isPassed ? '#58cc02' : '#999',
                fontWeight: isPassed ? 'bold' : 'normal', minWidth: 20, textAlign: 'right'
              }}>
                {checkpoint}
              </Typography>
              <Box sx={{
                width: 24, height: 24, borderRadius: '50%',
                bgcolor: isPassed ? '#58cc02' : '#fff',
                border: `3px solid ${isPassed ? '#58cc02' : '#e0e0e0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 'bold', color: isPassed ? '#fff' : '#999'
              }}>
                {isPassed && '✓'}
              </Box>
            </Box>
          );
        })}
        {/* 진행바가 동그라미 정확히 중심을 관통하도록 수정 */}
        <Box sx={{
            position: 'absolute', 
            left: 'calc(50% + 10px)', // 동그라미 중심으로 정확히 이동
            top: 0, 
            bottom: 0,
            transform: 'translateX(-50%)', 
            width: 8, 
            bgcolor: '#e0e0e0',
            borderRadius: 4, 
            zIndex: 1,
        }}>
            <Box sx={{
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0,
                height: `${totalProgress}%`, 
                bgcolor: '#58cc02', 
                borderRadius: 4,
                transition: 'height 0.3s ease-out'
            }}/>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: isLand ? 'row' : 'column',
      bgcolor: '#f7f7f7'
    }}>
      {/* 가로 모드 왼쪽 사이드바 */}
      {isLand && (
        <Box sx={{
          width: 180, display: 'flex', flexDirection: 'column',
          alignItems: 'center', bgcolor: '#f0f0f0', p: 2
        }}>
          <IconButton onClick={() => navigate('/')}> <CloseIcon/> </IconButton>
          <FormControlLabel
            control={<Checkbox checked={orderedMode} onChange={(e) => setOrderedMode(e.target.checked)} sx={{ '&.Mui-checked': { color: '#58cc02' } }} />}
            label="연습 모드"
            sx={{ color: '#666', mt: 1, mb: 1 }}
          />
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<AddIcon />} 
            onClick={handleAddColumn}
            sx={{ mb: 2, color: '#666', borderColor: '#999' }}
          >
            열 추가
          </Button>
          <Box sx={{ flexGrow: 1, width: '100%', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <VerticalProgressBar />
          </Box>
        </Box>
      )}

      <Box sx={{
        flexGrow: 1, maxWidth: 1200, mx: 'auto', p: 2,
        display: 'flex', flexDirection: 'column'
      }}>
        {/* 세로 모드 상단 영역 */}
        {!isLand && (
          <>
            <Box sx={{ position: 'relative', mb: 1, height: 40 }}>
              <IconButton 
                onClick={() => navigate('/')} 
                sx={{ 
                  position: 'absolute', 
                  left: 0, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  p: 0.5, 
                  zIndex: 3 
                }}
              > 
                <CloseIcon/> 
              </IconButton>
              <Box sx={{ 
                position: 'absolute', 
                left: 0, 
                right: 0, 
                top: 0, 
                height: '100%',
                px: 2,
                pl: 6 // X버튼 공간 확보
              }}>
                <CustomProgressBar />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={<Checkbox checked={orderedMode} onChange={(e) => setOrderedMode(e.target.checked)} sx={{ '&.Mui-checked': { color: '#58cc02' } }} />}
                label="연습 모드 (카드 순서 유지)"
                sx={{ color: '#666' }}
              />
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<AddIcon />} 
                onClick={handleAddColumn}
                sx={{ color: '#666', borderColor: '#999' }}
              >
                열 추가
              </Button>
            </Box>
          </>
        )}

        {/* 카드 영역 */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, overflow: 'hidden', minHeight: 0, mt: isLand ? 1 : 2 }}>
          {selectedCols.map((ci, pos) => (
            <Box key={pos} sx={{
              flex: ci === null ? '0 0 30px' : 1, display: 'flex', flexDirection: 'column',
              gap: 1, overflow: 'hidden', bgcolor: ci === null ? '#f0f0f0' : 'transparent', opacity: ci === null ? 0.7 : 1
            }}>
              <Select size="small" value={ci !== null ? ci : ''}
                onChange={e => {
                  const v = e.target.value;
                  setSelectedCols(prev => {
                    const active = prev.filter(v => v !== null).length;
                    const next = [...prev];
                    if ((v === 'blank' || v === 'none') && next[pos] === null) return prev;
                    if (v === 'blank') {
                      if (active <= 2) { alert('최소 2개의 열이 필요합니다'); return prev; }
                      next[pos] = null;
                    } else if (v === 'none') {
                      if (active <= 2) { alert('최소 2개의 열이 필요합니다'); return prev; }
                      next.splice(pos, 1); // next.push(null) 제거 - 이게 핵심!
                    } else next[pos] = +v;
                    return next;
                  });
                }}
                sx={{ alignSelf: 'center', height: 30, minWidth: 80, fontSize: '.8rem' }}>
                <MenuItem value="none">없음</MenuItem>
                <MenuItem value="blank">공백</MenuItem>
                {headers.map((h, i) => (!h.toLowerCase().includes('cardid') && (
                  <MenuItem key={i} value={i}>{`${i+1}_${h}`}</MenuItem>
                )))}
              </Select>

              {ci !== null && (
                loading ? <CircularProgress sx={{ mx: 'auto', my: 1 }} size={24}/> : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                    {columnCards[ci]?.map((c, idx) => (
                      <Button key={`${c.id}-${idx}`} sx={getCardStyle(c, idx)} onClick={() => handleCardClick(c, idx)}>
                        <Typography sx={{ fontWeight: 'bold' }}>{c.text}</Typography>
                      </Button>
                    ))}
                    {columnCards[ci] && columnCards[ci].length < CARDS_PER_PAGE &&
                      Array.from({length: CARDS_PER_PAGE - columnCards[ci].length}).map((_, idx) => (
                        <Box key={`empty-${idx}`} sx={{ flex: 1 }} />
                      ))
                    }
                  </Box>
                )
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* 체크포인트 모달 */}
      <Dialog open={showCheckpointModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Box sx={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #2196F3 0%, #03A9F4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', boxShadow: '0 8px 16px rgba(33, 150, 243, 0.3)' }}>📊</Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>체크포인트 달성!</Typography>
          <Typography variant="body1" sx={{ color: '#666' }}>
            전체 {totalPairs}개 중 {currentCheckpoint}개를 학습했습니다!<br/>
            {currentCheckpoint === getCheckpoints()[0] ? '전체의 1/3을 완료했습니다.' : '전체의 2/3를 완료했습니다.'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#999' }}>
            계속해서 열심히 학습해보세요! 💪
          </Typography>
          <Button variant="contained" size="large" onClick={handleCheckpointContinue} sx={{ bgcolor: '#2196F3', color: 'white', px: 6, py: 2, fontSize: '1.2rem', fontWeight: 'bold', borderRadius: 3, boxShadow: '0 4px 0 #1976D2', '&:hover': { bgcolor: '#1976D2', boxShadow: '0 2px 0 #1565C0', transform: 'translateY(2px)' } }}>계속하기</Button>
        </DialogContent>
      </Dialog>

      {/* Complete 모달 */}
      <Dialog open={showComplete} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Box sx={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', boxShadow: '0 8px 16px rgba(255, 215, 0, 0.3)' }}>🏆</Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>축하합니다!</Typography>
          <Typography variant="body1" sx={{ color: '#666' }}>
            모든 카드를 완료했습니다!
            {!devMode && (
              <Box component="span" sx={{ display: 'block', mt: 1 }}>
                {studyLogSaveStatus === 'saving' && <Box sx={{ color: '#1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}><CircularProgress size={16} /> 학습 기록 저장 중...</Box>}
                {studyLogSaveStatus === 'success' && <Box sx={{ color: '#58cc02', fontWeight: 500 }}>✓ 학습 기록이 저장되었습니다</Box>}
                {studyLogSaveStatus === 'failed' && <Box sx={{ color: '#d32f2f', fontSize: '0.9rem' }}>⚠ 학습 기록 저장 실패</Box>}
              </Box>
            )}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, color: '#666' }}>
            <Typography variant="body2">총 {totalPairs}개 카드 학습 완료</Typography>
            <Typography variant="body2">소요 시간: {Math.floor((Date.now() - startTimeRef.current) / 1000)}초</Typography>
            <Typography variant="body2">정답률: {getAccuracy()}%</Typography>
            {orderedMode && <Typography variant="body2" sx={{ color: '#58cc02' }}>✓ 연습 모드로 완료</Typography>}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 2 }}>
            <Button variant="outlined" size="large" onClick={handleComplete} sx={{ flex: 1, py: 2, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 3, borderColor: '#DAA520', color: '#DAA520', '&:hover': { borderColor: '#B8860B', bgcolor: 'rgba(218, 165, 32, 0.08)' } }}>홈으로 돌아가기</Button>
            <Button variant="contained" size="large" onClick={handleRestartLearning} sx={{ flex: 1, bgcolor: '#FFD700', color: '#333', py: 2, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 3, boxShadow: '0 4px 0 #DAA520', '&:hover': { bgcolor: '#FFA500', boxShadow: '0 2px 0 #DAA520', transform: 'translateY(2px)' } }}>한 번 더 학습하기</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
