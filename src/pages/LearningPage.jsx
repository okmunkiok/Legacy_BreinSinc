import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Button, Typography, CircularProgress, LinearProgress, 
  IconButton, FormControl, InputLabel, Select, MenuItem, keyframes 
} from '@mui/material';
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

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
  20%, 40%, 60%, 80% { transform: translateX(3px); }
`;

const LearningPage = () => {
  const navigate = useNavigate();
  const { cardData } = useAuth();

  const VISIBLE_PAIRS = 5;
  const REFILL_THRESHOLD = 3;

  const [visibleLeftCards, setVisibleLeftCards] = useState([]);
  const [visibleRightCards, setVisibleRightCards] = useState([]);
  const [remainingPairs, setRemainingPairs] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [wrongSelection, setWrongSelection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameKey, setGameKey] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [headers, setHeaders] = useState([]);
  const [frontColumnIndex, setFrontColumnIndex] = useState(1);
  const [backColumnIndex, setBackColumnIndex] = useState(2);
  const [matchCounter, setMatchCounter] = useState(0);

  const initializeGame = useCallback(() => {
    if (!cardData || cardData.length <= 1) {
      alert('학습 데이터가 없습니다. 홈으로 돌아가 시트를 선택해주세요.');
      navigate('/');
      return;
    }
    const headerRow = cardData[0] || [];
    setHeaders(headerRow);
    const rows = cardData.slice(1);
    const allPairs = rows.map((row, index) => ({
      id: `pair-${index}`,
      left: row[frontColumnIndex],
      right: row[backColumnIndex],
    })).filter(p => p.left && p.right);

    if (allPairs.length === 0) {
      alert('선택하신 열에 유효한 카드 데이터가 없습니다.');
      setLoading(false);
      setVisibleLeftCards([]);
      setVisibleRightCards([]);
      return;
    }
    
    setTotalPairs(allPairs.length);
    const shuffledPairs = shuffleArray(allPairs);
    const initialVisible = shuffledPairs.slice(0, 
      Math.min(VISIBLE_PAIRS, shuffledPairs.length));
    const initialRemaining = shuffledPairs.slice(VISIBLE_PAIRS);
    
    const baseLeftCards = initialVisible.map((p, idx) => ({ 
      id: p.id, 
      text: p.left, 
      type: 'left',
      position: idx 
    }));
    const baseRightCards = initialVisible.map((p, idx) => ({ 
      id: p.id, 
      text: p.right, 
      type: 'right',
      position: idx 
    }));
    
    const leftPositions = shuffleArray([0, 1, 2, 3, 4].slice(0, baseLeftCards.length));
    const rightPositions = shuffleArray([0, 1, 2, 3, 4].slice(0, baseRightCards.length));
    
    const leftCards = baseLeftCards.map((card, idx) => ({
      ...card,
      position: leftPositions[idx]
    }));
    const rightCards = baseRightCards.map((card, idx) => ({
      ...card,
      position: rightPositions[idx]
    }));
    
    leftCards.sort((a, b) => a.position - b.position);
    rightCards.sort((a, b) => a.position - b.position);
    
    setVisibleLeftCards(leftCards);
    setVisibleRightCards(rightCards);
    setRemainingPairs(initialRemaining);
    setSelectedCards([]);
    setMatchedPairs([]);
    setWrongSelection([]);
    setMatchCounter(0);
    setLoading(false);
  }, [cardData, navigate, frontColumnIndex, backColumnIndex]);

  useEffect(() => {
    setLoading(true);
    initializeGame();
  }, [initializeGame, gameKey]);

  useEffect(() => {
    if (matchCounter >= REFILL_THRESHOLD && remainingPairs.length > 0) {
      const timer = setTimeout(() => {
        refillCards();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [matchCounter]);

  const refillCards = useCallback(() => {
    const currentMatched = [...matchedPairs];
    const lastThreeMatched = currentMatched.slice(-REFILL_THRESHOLD);
    
    if (lastThreeMatched.length === 0 || remainingPairs.length === 0) return;
    
    const refillCount = Math.min(lastThreeMatched.length, remainingPairs.length);
    const newPairsData = remainingPairs.slice(0, refillCount);
    const updatedRemaining = remainingPairs.slice(refillCount);

    const emptyLeftPositions = lastThreeMatched.map(matchedId => {
      const leftCard = visibleLeftCards.find(c => c.id === matchedId);
      return leftCard ? leftCard.position : -1;
    }).filter(pos => pos !== -1);

    const emptyRightPositions = lastThreeMatched.map(matchedId => {
      const rightCard = visibleRightCards.find(c => c.id === matchedId);
      return rightCard ? rightCard.position : -1;
    }).filter(pos => pos !== -1);

    const shuffledLeftPositions = shuffleArray([...emptyLeftPositions]);
    const shuffledRightPositions = shuffleArray([...emptyRightPositions]);

    setVisibleLeftCards(prev => {
      const updated = [...prev];
      newPairsData.forEach((newPair, idx) => {
        if (idx < shuffledLeftPositions.length) {
          const targetPosition = shuffledLeftPositions[idx];
          const index = updated.findIndex(c => c.position === targetPosition);
          if (index !== -1) {
            updated[index] = {
              id: newPair.id,
              text: newPair.left,
              type: 'left',
              position: targetPosition,
              isNew: true
            };
          }
        }
      });
      return updated;
    });

    setVisibleRightCards(prev => {
      const updated = [...prev];
      newPairsData.forEach((newPair, idx) => {
        if (idx < shuffledRightPositions.length) {
          const targetPosition = shuffledRightPositions[idx];
          const index = updated.findIndex(c => c.position === targetPosition);
          if (index !== -1) {
            updated[index] = {
              id: newPair.id,
              text: newPair.right,
              type: 'right',
              position: targetPosition,
              isNew: true
            };
          }
        }
      });
      return updated;
    });

    setRemainingPairs(updatedRemaining);
    setMatchCounter(0);
  }, [visibleLeftCards, visibleRightCards, remainingPairs, matchedPairs]);

  const handleCardClick = (card) => {
    if (matchedPairs.includes(card.id)) return;
    
    const alreadySelected = selectedCards.find(
      c => c.text === card.text && c.type === card.type
    );
    
    if (alreadySelected) {
      setSelectedCards(selectedCards.filter(
        c => !(c.text === card.text && c.type === card.type)
      ));
      return;
    }
    
    const sameTypeSelected = selectedCards.find(c => c.type === card.type);
    if (sameTypeSelected) {
      setSelectedCards([
        ...selectedCards.filter(c => c.type !== card.type),
        card
      ]);
      return;
    }
    
    const newSelection = [...selectedCards, card];
    setSelectedCards(newSelection);
    
    if (newSelection.length === 2) {
      const [first, second] = newSelection;
      
      if (first.id === second.id) {
        setTimeout(() => {
          setMatchedPairs(prev => [...prev, first.id]);
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
    const isSelected = selectedCards.some(
      c => c.text === card.text && c.type === card.type
    );
    const isWrong = wrongSelection.some(
      c => c.text === card.text && c.type === card.type
    );
    const isMatched = matchedPairs.includes(card.id);
    const isEmpty = remainingPairs.length === 0 && isMatched;

    let sx = {
      flex: 1, 
      p: 2, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center', 
      borderRadius: 3, 
      cursor: isEmpty ? 'default' : 'pointer',
      backgroundColor: '#ffffff', 
      color: '#3c3c3c',
      border: '2px solid #e5e5e5',
      boxShadow: '0 4px 0 #e5e5e5',
      transition: 'all 0.2s ease-in-out',
      textTransform: 'none',
      width: '100%',
      '&:hover': { backgroundColor: '#f7f7f7' },
    };

    // 애니메이션 로직 개선
    if (isWrong) {
      sx.animation = `${shake} 0.5s`;
      sx.backgroundColor = '#ffdfe1';
      sx.color = '#ff4b4b';
      sx.border = '2px solid #ff4b4b';
      sx.boxShadow = '0 4px 0 #ff4b4b';
    } else if (card.isNew && !isMatched && !isSelected) {
      // 새 카드이고, 매칭되지 않았고, 선택되지 않았을 때만 페이드인
      sx.animation = `${fadeIn} 0.6s ease-out`;
    }
    
    if (isSelected && !isWrong) {
      sx.backgroundColor = '#ddf4ff';
      sx.color = '#1cb0f6';
      sx.border = '2px solid #1cb0f6';
      sx.boxShadow = '0 4px 0 #1cb0f6';
    }
    
    if (isMatched) {
      sx.backgroundColor = '#f0f0f0';
      sx.color = '#999999';
      sx.border = '2px solid #e0e0e0';
      sx.boxShadow = '0 2px 0 #e0e0e0';
      sx.cursor = 'default';
      sx['&:hover'] = { backgroundColor: '#f0f0f0' };
    }
    
    return sx;
  };

  const progress = totalPairs > 0 ? (matchedPairs.length / totalPairs) * 100 : 0;
  const isGameFinished = totalPairs > 0 && matchedPairs.length === totalPairs;

  const handleRestartGame = () => setGameKey(prev => prev + 1);

  const getColumnLabel = (header, index) => {
    const columnNumber = index + 1;
    return `${columnNumber}_${header}`;
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        bgcolor: '#f7f7f7' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh', 
      bgcolor: '#f7f7f7', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <Box component="main" sx={{ 
        flexGrow: 1, 
        p: { xs: 2, sm: 3 }, 
        maxWidth: '900px', 
        width: '100%', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
          <IconButton onClick={() => navigate('/')} aria-label="close">
            <CloseIcon sx={{ color: '#afafaf', fontSize: '2rem' }} />
          </IconButton>
          <LinearProgress
            variant="determinate" 
            value={progress}
            sx={{ 
              flexGrow: 1, 
              height: 16, 
              borderRadius: 8,
              backgroundColor: '#e5e5e5',
              '& .MuiLinearProgress-bar': { backgroundColor: '#1cb0f6' }
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>1열</InputLabel>
            <Select 
              value={frontColumnIndex} 
              label="1열" 
              onChange={(e) => { 
                setFrontColumnIndex(e.target.value); 
                handleRestartGame(); 
              }}
            >
              {headers.map((header, index) => {
                const lowerHeader = header.toLowerCase();
                const isCardId = lowerHeader.includes('cardid') || 
                                lowerHeader.includes('card-id') || 
                                lowerHeader.includes('card_id');
                
                if (isCardId) return null;
                
                return (
                  <MenuItem key={`front-${index}`} value={index}>
                    {getColumnLabel(header, index)}
                  </MenuItem>
                );
              }).filter(Boolean)}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>2열</InputLabel>
            <Select 
              value={backColumnIndex} 
              label="2열" 
              onChange={(e) => { 
                setBackColumnIndex(e.target.value); 
                handleRestartGame(); 
              }}
            >
              {headers.map((header, index) => {
                const lowerHeader = header.toLowerCase();
                const isCardId = lowerHeader.includes('cardid') || 
                                lowerHeader.includes('card-id') || 
                                lowerHeader.includes('card_id');
                
                if (isCardId) return null;
                
                return (
                  <MenuItem key={`back-${index}`} value={index}>
                    {getColumnLabel(header, index)}
                  </MenuItem>
                );
              }).filter(Boolean)}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          gap: 2, 
          mt: 2, 
          minHeight: 0 
        }}>
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1.5 
          }}>
            {visibleLeftCards.map((card) => (
              <Button 
                key={`left-${card.position}-${card.id}`} 
                variant="text" 
                onClick={() => handleCardClick(card)} 
                sx={getCardStyle(card)}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {card.text}
                </Typography>
              </Button>
            ))}
          </Box>
          
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1.5 
          }}>
            {visibleRightCards.map((card) => (
              <Button 
                key={`right-${card.position}-${card.id}`} 
                variant="text" 
                onClick={() => handleCardClick(card)} 
                sx={getCardStyle(card)}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {card.text}
                </Typography>
              </Button>
            ))}
          </Box>
        </Box>
        
        {isGameFinished && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography 
              variant="h5" 
              sx={{ color: '#1cb0f6', fontWeight: 'bold' }} 
              gutterBottom
            >
              🎉 축하합니다! 모든 카드를 맞췄습니다! 🎉
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleRestartGame} 
              sx={{
                bgcolor: '#1cb0f6', 
                '&:hover': { bgcolor: '#1899d6' },
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                borderRadius: 3,
                boxShadow: '0 4px 0 #1899d6', 
                py: 1.5, 
                textTransform: 'none'
              }}
            >
              다시 시작하기
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LearningPage;
