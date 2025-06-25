/* src/pages/LearningPage.jsx */
import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import {
  Box, Select, MenuItem, Button, Typography,
  CircularProgress, LinearProgress, IconButton, keyframes
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ─── util ─── */
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.8) translateY(20px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
`;

const shake = keyframes`
  0%,100%   { transform: translateX(0); }
  20%,60%   { transform: translateX(-4px); }
  40%,80%   { transform: translateX(4px); }
`;

/* ─── constants ─── */
const VISIBLE_PAIRS    = 5;
const REFILL_THRESHOLD = 3;

export default function LearningPage() {
  const navigate = useNavigate();
  const { cardData } = useAuth();

  const [headers,        setHeaders]        = useState([]);
  const [selectedCols,   setSelectedCols]   = useState([]);
  const [columnCards,    setColumnCards]    = useState({});
  const [remainingPairs, setRemainingPairs] = useState([]);
  const [picked,         setPicked]         = useState([]);
  const [matched,        setMatched]        = useState([]);
  const [totalMatched,   setTotalMatched]   = useState(0);
  const [wrong,          setWrong]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [totalPairs,     setTotalPairs]     = useState(0);
  const [isRefilling,    setIsRefilling]    = useState(false);
  const [isFinished,     setIsFinished]     = useState(false);

  const matchCountForRefill = useRef(0);

  /* orientation 감지 */
  const [isLand, setIsLand] = useState(
    window.innerWidth > window.innerHeight
  );
  
  useLayoutEffect(() => {
    const f = () => setIsLand(
      window.innerWidth > window.innerHeight
    );
    window.addEventListener('resize', f);
    window.addEventListener('orientationchange', f);
    return () => {
      window.removeEventListener('resize', f);
      window.removeEventListener('orientationchange', f);
    };
  }, []);

  /* ─── 1) 헤더 로드 & cols 초기화 ─── */
  useEffect(() => {
    if (!cardData || cardData.length < 2) return;
    const head = cardData[0];
    setHeaders(head);
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
  }, [cardData, navigate, selectedCols.length]);

  /* ─── 2) 게임 초기화 ─── */
  const initGame = useCallback(() => {
    const active = selectedCols.filter(c => c !== null);
    if (!cardData || active.length < 2) {
      setLoading(false);
      return;
    }

    const pairs = cardData.slice(1)
      .map((row, i) => ({ 
        id: `p-${i}`, 
        ...Object.fromEntries(
          active.map(ci => [ci, row[ci]])
        ) 
      }))
      .filter(p => active.every(ci => p[ci]));

    setTotalPairs(pairs.length);
    const base = shuffle(pairs).slice(0, VISIBLE_PAIRS);
    setRemainingPairs(pairs.slice(VISIBLE_PAIRS));

    const newCards = {};
    active.forEach(ci => {
      const arr = base.map((p, idx) => ({ 
        id: p.id, 
        text: p[ci], 
        colIdx: ci, 
        pos: idx 
      }));
      newCards[ci] = shuffle(arr);
    });
    setColumnCards(newCards);

    setPicked([]); 
    setMatched([]); 
    setTotalMatched(0);
    setWrong([]);
    setLoading(false);
    setIsRefilling(false);
    setIsFinished(false);
    matchCountForRefill.current = 0;
  }, [cardData, selectedCols]);

  useEffect(() => {
    if (selectedCols.length > 0) {
      setLoading(true);
      initGame();
    }
  }, [initGame, selectedCols]);
  
  /* ─── 3) 학습 완료 처리 ─── */
  useEffect(() => {
    if (!loading && totalPairs > 0 && 
        totalMatched === totalPairs && !isFinished) {
      setIsFinished(true);
      setTimeout(() => {
        alert('🎉 모든 카드를 맞추셨습니다! 학습을 종료합니다.');
        navigate('/');
      }, 500);
    }
  }, [totalMatched, totalPairs, loading, navigate, isFinished]);

  /* ─── 4) 리필 함수 ─── */
  const refillCards = useCallback(() => {
    if (isRefilling || remainingPairs.length === 0) return;
    setIsRefilling(true);

    setMatched(currentMatched => {
      setRemainingPairs(currentRemaining => {
        setColumnCards(currentCards => {
          // 교체할 개수 결정
          const toReplaceCount = Math.min(
            REFILL_THRESHOLD, 
            currentMatched.length, 
            currentRemaining.length
          );
          
          if (toReplaceCount === 0) {
            setIsRefilling(false);
            return currentCards;
          }

          // 가장 오래된 매치부터 교체 (앞에서부터)
          const idsToReplace = currentMatched.slice(0, toReplaceCount);
          const newPairs = currentRemaining.slice(0, toReplaceCount);

          const nextCards = {};
          const activeCols = selectedCols.filter(c => c !== null);
          
          activeCols.forEach(ci => {
            nextCards[ci] = currentCards[ci].map(card => {
              const replaceIndex = idsToReplace.indexOf(card.id);
              if (replaceIndex !== -1 && newPairs[replaceIndex]) {
                const newPair = newPairs[replaceIndex];
                return { 
                  id: newPair.id, 
                  text: newPair[ci], 
                  colIdx: Number(ci), 
                  pos: card.pos, 
                  isNew: true 
                };
              }
              return card;
            });
          });

          // 리필 완료 후 상태 업데이트
          setTimeout(() => setIsRefilling(false), 100);
          matchCountForRefill.current = 0;
          
          return nextCards;
        });

        // remainingPairs 업데이트
        return currentRemaining.slice(
          Math.min(REFILL_THRESHOLD, currentMatched.length, currentRemaining.length)
        );
      });

      // matched에서 교체된 ID들 제거
      return currentMatched.slice(
        Math.min(REFILL_THRESHOLD, currentMatched.length, remainingPairs.length)
      );
    });
  }, [isRefilling, remainingPairs.length, selectedCols]);

  /* ─── isNew 플래그 제거 (애니메이션 종료 후) ─── */
  useEffect(() => {
    if (loading) return;
    
    const hasNewCards = Object.values(columnCards).some(
      cards => cards && cards.some(c => c.isNew)
    );
    
    if (hasNewCards) {
      const timer = setTimeout(() => {
        setColumnCards(prev => {
          const next = {};
          Object.keys(prev).forEach(ci => {
            if (prev[ci]) {
              next[ci] = prev[ci].map(c => 
                c.isNew ? {...c, isNew: false} : c
              );
            }
          });
          return next;
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [columnCards, loading]);

  /* ─── 카드 클릭 핸들러 ─── */
  const handleCardClick = useCallback((card) => {
    if (isRefilling || matched.includes(card.id)) return;
    
    // 같은 열에서 이미 선택한 카드가 있는지 확인
    const sameColPicked = picked.find(
      p => p.colIdx === card.colIdx
    );
    
    let nextPicked;
    if (sameColPicked && sameColPicked.id === card.id) {
      // 같은 카드 클릭 시 선택 해제
      nextPicked = picked.filter(
        p => p.colIdx !== card.colIdx
      );
    } else if (sameColPicked) {
      // 같은 열의 다른 카드 클릭 시 교체
      nextPicked = picked.map(p => 
        p.colIdx === card.colIdx ? card : p
      );
    } else {
      // 새로운 열의 카드 추가
      nextPicked = [...picked, card];
    }
    
    setPicked(nextPicked);

    const activeCount = selectedCols.filter(c => c !== null).length;
    if (nextPicked.length === activeCount) {
      const ok = nextPicked.every(c => c.id === nextPicked[0].id);
      if (ok) {
        const newMatchedId = nextPicked[0].id;
        // 새 매치는 배열 끝에 추가 (중요!)
        setMatched(m => [...m, newMatchedId]);
        setTotalMatched(t => t + 1);
        setPicked([]);
        
        matchCountForRefill.current += 1;
        
        if (matchCountForRefill.current >= REFILL_THRESHOLD && 
            remainingPairs.length > 0) {
          setTimeout(refillCards, 300);
        }
      } else {
        setWrong(nextPicked);
        setTimeout(() => {
          setPicked([]);
          setWrong([]);
        }, 500);
      }
    }
  }, [
    isRefilling, 
    matched, 
    picked, 
    selectedCols, 
    remainingPairs.length, 
    refillCards
  ]);

  /* ─── 카드 스타일 헬퍼 ─── */
  const getCardStyle = c => {
    const isSel = picked.some(
      p => p.colIdx === c.colIdx && p.id === c.id
    );
    const isBad = wrong.some(
      p => p.colIdx === c.colIdx && p.id === c.id
    );
    const isMat = matched.includes(c.id);
    
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
    
    if (isBad) return { 
      ...sx, 
      bgcolor: '#ffdfe1', 
      color: '#c00', 
      border: '2px solid #c00', 
      animation: `${shake} .5s` 
    };
    
    if (isSel) return { 
      ...sx, 
      bgcolor: '#def', 
      color: '#06c', 
      border: '2px solid #06c' 
    };
    
    if (c.isNew) sx.animation = `${fadeIn} .6s`;
    
    if (isMat) return { 
      ...sx, 
      bgcolor: '#eee', 
      color: '#999', 
      border: '2px solid #ddd', 
      boxShadow: '0 2px 0 #ddd', 
      cursor: 'default', 
      animation: 'none' 
    };
    
    return sx;
  };

  const progress = totalPairs ? (totalMatched / totalPairs) * 100 : 0;

  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: isLand ? 'row' : 'column',
      bgcolor: '#f7f7f7'
    }}>
      {/* 세로 진행도+X (landscape) */}
      {isLand && (
        <Box sx={{
          width: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: '#f0f0f0'
        }}>
          <IconButton onClick={() => navigate('/')}>
            <CloseIcon/>
          </IconButton>
          <Box sx={{
            flexGrow: 1,
            width: 16,
            bgcolor: '#e5e5e5',
            position: 'relative',
            my: 1
          }}>
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${progress}%`,
              bgcolor: '#06c',
              transition: 'height .3s'
            }}/>
          </Box>
        </Box>
      )}
      
      {/* 메인 영역 */}
      <Box sx={{
        flexGrow: 1,
        maxWidth: 1200,
        mx: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 가로 진행도+X (portrait) */}
        {!isLand && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 2 
          }}>
            <IconButton onClick={() => navigate('/')}>
              <CloseIcon/>
            </IconButton>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                flexGrow: 1,
                height: 16,
                borderRadius: 8,
                '& .MuiLinearProgress-bar': { bgcolor: '#06c' }
              }}
            />
          </Box>
        )}
        
        {/* 카드 그리드 */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          gap: 2, 
          overflow: 'hidden', 
          minHeight: 0 
        }}>
          {selectedCols.map((ci, pos) => (
            <Box
              key={pos}
              sx={{
                flex: ci === null ? '0 0 30px' : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                overflow: 'hidden',
                bgcolor: ci === null ? '#f0f0f0' : 'transparent',
                opacity: ci === null ? 0.7 : 1
              }}
            >
              <Select
                size="small"
                value={ci !== null ? ci : ''}
                onChange={e => {
                  const v = e.target.value;
                  setSelectedCols(prev => {
                    const active = prev.filter(v => v !== null).length;
                    const next = [...prev];
                    if ((v === 'blank' || v === 'none') && 
                        next[pos] === null) {
                      return prev;
                    }
                    if (v === 'blank') {
                      if (active <= 2) { 
                        alert('최소 2개의 열이 필요합니다'); 
                        return prev; 
                      }
                      next[pos] = null;
                    } else if (v === 'none') {
                      if (active <= 2) { 
                        alert('최소 2개의 열이 필요합니다'); 
                        return prev; 
                      }
                      next.splice(pos, 1); 
                      next.push(null);
                    } else {
                      next[pos] = +v;
                    }
                    return next;
                  });
                }}
                sx={{ 
                  alignSelf: 'center', 
                  height: 30, 
                  minWidth: 80, 
                  fontSize: '.8rem' 
                }}
              >
                <MenuItem value="none">없음(→)</MenuItem>
                <MenuItem value="blank">공백</MenuItem>
                {headers.map((h, i) => (
                  !h.toLowerCase().includes('cardid') && (
                    <MenuItem key={i} value={i}>
                      {`${i+1}_${h}`}
                    </MenuItem>
                  )
                ))}
              </Select>
              
              {ci !== null && (
                loading
                  ? <CircularProgress 
                      sx={{ mx: 'auto', my: 1 }} 
                      size={24}
                    />
                  : columnCards[ci]?.map(c => (
                      <Button
                        key={`${c.id}-${c.pos}`}
                        sx={getCardStyle(c)}
                        onClick={() => handleCardClick(c)}
                        disabled={isRefilling}
                      >
                        <Typography sx={{ fontWeight: 'bold' }}>
                          {c.text}
                        </Typography>
                      </Button>
                    ))
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
