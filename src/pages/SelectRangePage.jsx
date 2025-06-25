/* src/pages/SelectRangePage.jsx */
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Checkbox, Paper, 
  AppBar, Toolbar, IconButton, CircularProgress,
  FormControlLabel, Divider, Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SelectRangePage = () => {
  const navigate = useNavigate();
  const { cardData } = useAuth();
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [rangeStart, setRangeStart] = useState(null); // 범위 선택 시작점

  // 전체 선택/해제
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIndices = new Set();
      for (let i = 1; i < cardData.length; i++) {
        allIndices.add(i);
      }
      setSelectedRows(allIndices);
    } else {
      setSelectedRows(new Set());
    }
  };

  // 개별 행 선택 토글
  const handleToggleRow = (index) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedRows(newSet);
  };

  // 범위 선택 칩 클릭 핸들러
  const handleRangeClick = (index) => {
    if (rangeStart === null) {
      // 첫 번째 클릭: 시작점 설정
      setRangeStart(index);
    } else {
      // 두 번째 클릭: 범위 선택
      const start = Math.min(rangeStart, index);
      const end = Math.max(rangeStart, index);
      const newSet = new Set(selectedRows);
      
      for (let i = start; i <= end; i++) {
        newSet.add(i);
      }
      
      setSelectedRows(newSet);
      setRangeStart(null); // 리셋
    }
  };

  // 학습 시작
  const handleStartLearning = () => {
    if (selectedRows.size === 0) {
      alert('학습할 카드를 선택해주세요.');
      return;
    }

    // 선택된 행 인덱스를 범위 문자열로 변환
    const sortedIndices = Array.from(selectedRows).sort((a, b) => a - b);
    const ranges = [];
    let start = sortedIndices[0];
    let end = sortedIndices[0];

    for (let i = 1; i < sortedIndices.length; i++) {
      if (sortedIndices[i] === end + 1) {
        end = sortedIndices[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = sortedIndices[i];
        end = sortedIndices[i];
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    
    const studyRange = ranges.join(',');
    navigate('/learning', { state: { studyRange, selectedRows: Array.from(selectedRows) } });
  };

  if (!cardData || cardData.length < 2) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  const headers = cardData[0];
  const displayCols = headers
    .map((h, i) => ({ h, i }))
    .filter(o => !o.h.toLowerCase().includes('cardid'));

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f7f7f7' }}>
      <AppBar position="static" sx={{ bgcolor: '#58cc02' }}>
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            학습 범위 선택
          </Typography>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartLearning}
            disabled={selectedRows.size === 0}
            sx={{
              bgcolor: 'white',
              color: '#58cc02',
              '&:hover': { bgcolor: '#f0f0f0' },
              '&:disabled': { bgcolor: '#ccc' }
            }}
          >
            학습 시작 ({selectedRows.size}개)
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {/* 범위 선택 안내 */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd' }}>
          <Typography variant="body2" sx={{ color: '#1976d2' }}>
            💡 팁: 범위 선택을 원하시면 시작 행과 끝 행의 번호 칩을 차례로 클릭하세요.
            {rangeStart !== null && (
              <Box component="span" sx={{ ml: 1, fontWeight: 'bold' }}>
                (시작점: #{rangeStart} 선택됨 - 끝점을 클릭하세요)
              </Box>
            )}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedRows.size === cardData.length - 1}
                indeterminate={selectedRows.size > 0 && selectedRows.size < cardData.length - 1}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            }
            label={
              <Typography sx={{ fontWeight: 'bold' }}>
                전체 선택 ({cardData.length - 1}개)
              </Typography>
            }
          />
        </Paper>

        <Paper sx={{ p: 2 }}>
          {cardData.slice(1).map((row, index) => {
            const rowIndex = index + 1;
            const isSelected = selectedRows.has(rowIndex);
            const isRangeStart = rangeStart === rowIndex;
            
            return (
              <Box key={rowIndex}>
                <Box
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.5,
                    px: 1,
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                    bgcolor: isSelected ? '#e3f2fd' : 'transparent',
                    border: isSelected ? '2px solid #2196f3' : '2px solid transparent',
                    '&:hover': { 
                      bgcolor: isSelected ? '#bbdefb' : '#f5f5f5',
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => handleToggleRow(rowIndex)}
                >
                  <Checkbox
                    checked={isSelected}
                    sx={{
                      color: isSelected ? '#2196f3' : 'default',
                      '&.Mui-checked': {
                        color: '#2196f3',
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => handleToggleRow(rowIndex)}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    alignItems: 'center',
                    width: '100%',
                    ml: 1
                  }}>
                    {/* 범위 선택용 번호 칩 */}
                    <Chip
                      label={`#${rowIndex}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRangeClick(rowIndex);
                      }}
                      sx={{ 
                        minWidth: 60,
                        bgcolor: isRangeStart ? '#ff9800' : (isSelected ? '#2196f3' : '#e0e0e0'),
                        color: isRangeStart || isSelected ? 'white' : '#666',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: isRangeStart ? '#f57c00' : (isSelected ? '#1976d2' : '#bdbdbd'),
                        }
                      }}
                    />
                    
                    {/* 카드 내용 */}
                    {displayCols.map(({ i }) => (
                      <Typography 
                        key={i}
                        sx={{ 
                          flex: 1,
                          p: 1,
                          bgcolor: isSelected ? '#fff' : '#f0f0f0',
                          borderRadius: 1,
                          textAlign: 'center',
                          fontWeight: isSelected ? 500 : 400,
                          boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          minWidth: 80,
                          fontSize: '0.9rem'
                        }}
                      >
                        {row[i]}
                      </Typography>
                    ))}
                  </Box>
                </Box>
                {index < cardData.length - 2 && <Divider sx={{ my: 0.5 }} />}
              </Box>
            );
          })}
        </Paper>
      </Box>
    </Box>
  );
};

export default SelectRangePage;
