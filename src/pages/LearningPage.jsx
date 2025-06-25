import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, CircularProgress, LinearProgress, IconButton, MenuItem, Select, keyframes } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const fadeIn = keyframes`from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); }`;
const shake = keyframes`0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); } 20%, 40%, 60%, 80% { transform: translateX(3px); }`;

const LearningPage = () => {
  const navigate = useNavigate();
  const { cardData } = useAuth();
  const [columnCards, setColumnCards] = useState({});
  const [remainingPairs, setRemainingPairs] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [wrongSelection, setWrongSelection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameKey, setGameKey] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [headers, setHeaders] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [matchCounter, setMatchCounter] = useState(0);

  const VISIBLE_PAIRS = 5;
  const REFILL_THRESHOLD = 3;

  const initializeGame = useCallback(() => {
    if (!cardData || cardData.length <= 1) {
      alert('학습 데이터가 없습니다.');
      navigate('/');
      return;
    }
    const headerRow = cardData[0] || [];
    setHeaders(headerRow);
    if (selectedColumns.length < 2) {
      const initialColumns = [];
      for (let i = 0; i < headerRow.length && initialColumns.length < 2; i++) {
        const lower = headerRow[i].toLowerCase();
        if (!lower.includes('cardid') && !lower.includes('card-id') && !lower.includes('card_id')) {
          initialColumns.push(i);
        }
      }
      setSelectedColumns(initialColumns);
      if (initialColumns.length < 2) {
        setLoading(false);
        return;
      }
    }
    const rows = cardData.slice(1);
    const allPairs = rows.map((row, index) => {
      const pairData = { id: `pair-${index}` };
      selectedColumns.forEach(colIndex => { pairData[colIndex] = row[colIndex]; });
      return pairData;
    }).filter(pair => selectedColumns.every(colIndex => pair[colIndex]));

    if (allPairs.length === 0) {
      alert('선택하신 열에 유효한 카드 데이터가 없습니다.');
      setLoading(false);
      setColumnCards({});
      return;
    }
    setTotalPairs(allPairs.length);
    const shuffledPairs = shuffleArray(allPairs);
    const initialVisible = shuffledPairs.slice(0, Math.min(VISIBLE_PAIRS, shuffledPairs.length));
    const initialRemaining = shuffledPairs.slice(VISIBLE_PAIRS);
    const newColumnCards = {};
    selectedColumns.forEach(colIndex => {
      const cards = initialVisible.map((pair, idx) => ({ id: pair.id, text: pair[colIndex], columnIndex: colIndex, position: idx }));
      const positions = shuffleArray(Array.from({ length: cards.length }, (_, i) => i));
      const shuffledCards = cards.map((card, idx) => ({ ...card, position: positions[idx] }));
      shuffledCards.sort((a, b) => a.position - b.position);
      newColumnCards[colIndex] = shuffledCards;
    });
    setColumnCards(newColumnCards);
    setRemainingPairs(initialRemaining);
    setSelectedCards([]);
    setMatchedPairs([]);
    setWrongSelection([]);
    setMatchCounter(0);
    setLoading(false);
  }, [cardData, navigate, selectedColumns]);

  const refillCards = useCallback(() => {
    const currentMatched = [...matchedPairs];
    const lastThreeMatched = currentMatched.slice(-REFILL_THRESHOLD);
    if (lastThreeMatched.length === 0 || remainingPairs.length === 0) return;
    const refillCount = Math.min(lastThreeMatched.length, remainingPairs.length);
    const newPairsData = remainingPairs.slice(0, refillCount);
    const updatedRemaining = remainingPairs.slice(refillCount);
    const newColumnCards = { ...columnCards };
    selectedColumns.forEach(colIndex => {
      const emptyPositions = lastThreeMatched.map(id => columnCards[colIndex].find(c => c.id === id)?.position).filter(pos => pos !== undefined);
      const shuffledPositions = shuffleArray([...emptyPositions]);
      const updated = [...columnCards[colIndex]];
      newPairsData.forEach((newPair, idx) => {
        if (idx < shuffledPositions.length) {
          const targetPosition = shuffledPositions[idx];
          const index = updated.findIndex(c => c.position === targetPosition);
          if (index !== -1) updated[index] = { id: newPair.id, text: newPair[colIndex], columnIndex: colIndex, position: targetPosition, isNew: true };
        }
      });
      newColumnCards[colIndex] = updated;
    });
    setColumnCards(newColumnCards);
    setRemainingPairs(updatedRemaining);
    setMatchCounter(0);

    setTimeout(() => {
      setColumnCards(currentCards => {
        const cleanedCards = {};
        Object.keys(currentCards).forEach(colIndex => {
          cleanedCards[colIndex] = currentCards[colIndex].map(card => card.isNew ? { ...card, isNew: false } : card);
        });
        return cleanedCards;
      });
    }, 700);
  }, [columnCards, remainingPairs, matchedPairs, selectedColumns]);

  useEffect(() => {
    if (cardData && cardData.length > 0) {
      setLoading(true);
      initializeGame();
    }
  }, [cardData, initializeGame, gameKey]);

  useEffect(() => {
    if (matchCounter >= REFILL_THRESHOLD && remainingPairs.length > 0) {
      const timer = setTimeout(() => refillCards(), 300);
      return () => clearTimeout(timer);
    }
  }, [matchCounter, remainingPairs.length, refillCards]);

  const handleCardClick = (card) => {
    if (matchedPairs.includes(card.id)) return;
    const isAlreadySelected = selectedCards.some(c => c.text === card.text && c.columnIndex === card.columnIndex);
    if (isAlreadySelected) {
      setSelectedCards(selectedCards.filter(c => !(c.text === card.text && c.columnIndex === card.columnIndex)));
      return;
    }
    const sameColumnSelected = selectedCards.find(c => c.columnIndex === card.columnIndex);
    const newSelection = sameColumnSelected ? [...selectedCards.filter(c => c.columnIndex !== card.columnIndex), card] : [...selectedCards, card];
    setSelectedCards(newSelection);

    if (newSelection.length === selectedColumns.length) {
      const allSameId = newSelection.every(c => c.id === newSelection[0].id);
      if (allSameId) {
        setTimeout(() => {
          setMatchedPairs(prev => [...prev, newSelection[0].id]);
          setMatchCounter(prev => prev + 1);
          setSelectedCards([]);
        }, 200);
      } else {
        setWrongSelection(newSelection);
        setTimeout(() => {
          setSelectedCards([]);
          setWrongSelection([]);
        }, 600);
      }
    }
  };
  
  const getCardStyle = (card) => {
    const isSelected = selectedCards.some(c => c.text === card.text && c.columnIndex === card.columnIndex);
    const isWrong = wrongSelection.some(c => c.text === card.text && c.columnIndex === card.columnIndex);
    const isMatched = matchedPairs.includes(card.id);
    let sx = { flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderRadius: 3, cursor: 'pointer', backgroundColor: '#ffffff', color: '#3c3c3c', border: '2px solid #e5e5e5', boxShadow: '0 4px 0 #e5e5e5', transition: 'all 0.2s ease-in-out', textTransform: 'none', width: '100%', '&:hover': { backgroundColor: '#f7f7f7' } };
    
    if (isWrong) {
      sx.animation = `${shake} 0.5s`; sx.backgroundColor = '#ffdfe1'; sx.color = '#ff4b4b'; sx.border = '2px solid #ff4b4b'; sx.boxShadow = '0 4px 0 #ff4b4b';
    } else if (isSelected) { 
      sx.backgroundColor = '#ddf4ff'; sx.color = '#1cb0f6'; sx.border = '2px solid #1cb0f6'; sx.boxShadow = '0 4px 0 #1cb0f6'; 
    } else if (card.isNew && !isMatched) {
      sx.animation = `${fadeIn} 0.6s ease-out`;
    }
    
    if (isMatched) { 
      sx.backgroundColor = '#f0f0f0'; sx.color = '#999999'; sx.border = '2px solid #e0e0e0'; sx.boxShadow = '0 2px 0 #e0e0e0'; sx.cursor = 'default'; sx['&:hover'] = { backgroundColor: '#f0f0f0' }; 
      sx.animation = 'none';
    }
    return sx;
  };

  const getColumnLabel = (header, index) => `${index + 1}_${header}`;
  const handleColumnChange = (position, newColIndex) => {
    let newSelectedColumns = [...selectedColumns];
    if (newColIndex === '') {
      // "없음" 선택 시 해당 위치의 열 제거
      newSelectedColumns = newSelectedColumns.filter((_, index) => index !== position);
    } else {
      // 해당 위치에 새로운 값 덮어쓰기 (중복 허용)
      if (position < newSelectedColumns.length) {
        newSelectedColumns[position] = newColIndex;
      } else {
        newSelectedColumns.push(newColIndex);
      }
    }
    setSelectedColumns(newSelectedColumns);
    setGameKey(k => k + 1);
  };

  const progress = totalPairs > 0 ? (matchedPairs.length / totalPairs) * 100 : 0;
  const isGameFinished = totalPairs > 0 && matchedPairs.length === totalPairs;

  return (
    <Box sx={{ height: '100vh', bgcolor: '#f7f7f7', display: 'flex', flexDirection: 'column' }}>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
          <IconButton onClick={() => navigate('/')}><CloseIcon sx={{ color: '#afafaf', fontSize: '2rem' }} /></IconButton>
          <LinearProgress variant="determinate" value={progress} sx={{ flexGrow: 1, height: 16, borderRadius: 8, backgroundColor: '#e5e5e5', '& .MuiLinearProgress-bar': { backgroundColor: '#1cb0f6' } }} />
        </Box>
        {selectedColumns.length >= 2 ? (
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, mt: 2, minHeight: 0 }}>
            {selectedColumns.map((colIndex, position) => (
              <Box key={`column-${colIndex}`} sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Select
                  value={colIndex}
                  onChange={(e) => handleColumnChange(position, e.target.value)}
                  sx={{ minWidth: 100, alignSelf: 'center' }}
                >
                  <MenuItem value="">없음</MenuItem>
                  {headers.map((header, index) => {
                    const lower = header.toLowerCase();
                    if (lower.includes('cardid') || lower.includes('card-id') || lower.includes('card_id')) return null;
                    return <MenuItem key={index} value={index}>{getColumnLabel(header, index)}</MenuItem>;
                  }).filter(Boolean)}
                </Select>
                {loading ? <CircularProgress sx={{ alignSelf: 'center' }} /> : columnCards[colIndex]?.map(card => (
                  <Button key={`${colIndex}-${card.position}-${card.id}`} variant="text" onClick={() => handleCardClick(card)} sx={getCardStyle(card)}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{card.text}</Typography>
                  </Button>
                ))}
              </Box>
            ))}
            {selectedColumns.length < 3 && (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Select
                  value=""
                  onChange={(e) => handleColumnChange(selectedColumns.length, e.target.value)}
                  sx={{ minWidth: 100, alignSelf: 'center' }}
                >
                  <MenuItem value="">없음</MenuItem>
                  {headers.map((header, index) => {
                    const lower = header.toLowerCase();
                    if (lower.includes('cardid') || lower.includes('card-id') || lower.includes('card_id')) return null;
                    return <MenuItem key={index} value={index}>{getColumnLabel(header, index)}</MenuItem>;
                  }).filter(Boolean)}
                </Select>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="h5" sx={{ color: '#999' }}>최소 2개의 열을 선택해주세요</Typography></Box>
        )}
        {isGameFinished && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#1cb0f6', fontWeight: 'bold' }} gutterBottom>🎉 축하합니다! 모든 카드를 맞췄습니다! 🎉</Typography>
            <Button variant="contained" size="large" onClick={() => setGameKey(k => k + 1)} sx={{ bgcolor: '#1cb0f6', '&:hover': { bgcolor: '#1899d6' }, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 3, boxShadow: '0 4px 0 #1899d6', py: 1.5, textTransform: 'none' }}>다시 시작하기</Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LearningPage;
