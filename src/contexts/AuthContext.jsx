import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

// 개발자 모드용 더미 데이터
const DUMMY_CARD_DATA = [
  ['CardID', 'English', 'French', 'Latin'],
  ['card-001', 'one', 'un', 'unus'],
  ['card-002', 'two', 'deux', 'duo'],
  ['card-003', 'three', 'trois', 'tres'],
  ['card-004', 'four', 'quatre', 'quattuor'],
  ['card-005', 'five', 'cinq', 'quinque'],
  ['card-006', 'six', 'six', 'sex'],
  ['card-007', 'seven', 'sept', 'septem'],
  ['card-008', 'eight', 'huit', 'octo'],
  ['card-009', 'nine', 'neuf', 'novem'],
  ['card-010', 'ten', 'dix', 'decem'],
  ['card-011', 'eleven', 'onze', 'undecim'],
  ['card-012', 'twelve', 'douze', 'duodecim'],
  ['card-013', 'thirteen', 'treize', 'tredecim'],
  ['card-014', 'fourteen', 'quatorze', 'quattuordecim'],
  ['card-015', 'fifteen', 'quinze', 'quindecim'],
  ['card-016', 'sixteen', 'seize', 'sedecim'],
  ['card-017', 'seventeen', 'dix-sept', 'septendecim'],
  ['card-018', 'eighteen', 'dix-huit', 'duodeviginti'],
  ['card-019', 'nineteen', 'dix-neuf', 'undeviginti'],
  ['card-020', 'twenty', 'vingt', 'viginti']
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [googleAccessToken, setGoogleAccessToken] = useState(() => localStorage.getItem('googleAccessToken'));
  const [selectedSheet, setSelectedSheet] = useState(() => JSON.parse(sessionStorage.getItem('selectedSheet')));
  const [cardData, setCardData] = useState(() => JSON.parse(sessionStorage.getItem('cardData')));
  const [devMode, setDevMode] = useState(false);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('googleAccessToken', token);
    setUser(userData);
    setGoogleAccessToken(token);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('googleAccessToken');
    sessionStorage.removeItem('selectedSheet');
    sessionStorage.removeItem('cardData');
    setUser(null);
    setGoogleAccessToken(null);
    setSelectedSheet(null);
    setCardData(null);
    setDevMode(false);
  };

  const updateSelectedSheet = (sheet) => {
    if (sheet) {
      sessionStorage.setItem('selectedSheet', JSON.stringify(sheet));
    } else {
      sessionStorage.removeItem('selectedSheet');
    }
    setSelectedSheet(sheet);
  };

  const updateCardData = (data) => {
    if (data) {
      sessionStorage.setItem('cardData', JSON.stringify(data));
    } else {
      sessionStorage.removeItem('cardData');
    }
    setCardData(data);
  };

  const toggleDevMode = (enabled) => {
    setDevMode(enabled);
    if (enabled) {
      updateCardData(DUMMY_CARD_DATA);
      updateSelectedSheet({ id: 'dev-mode', name: '개발자 모드 (더미 데이터)' });
    } else {
      updateCardData(null);
      updateSelectedSheet(null);
    }
  };

  const value = {
    user,
    googleAccessToken,
    login,
    logout,
    selectedSheet,
    setSelectedSheet: updateSelectedSheet,
    cardData,
    setCardData: updateCardData,
    devMode,
    toggleDevMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
