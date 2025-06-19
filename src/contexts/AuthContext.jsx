import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext({
  user: null,
  googleAccessToken: null,
  loading: true,
  selectedSheet: null, // 기본값 추가
  login: () => {},
  logout: () => {},
  setSelectedSheet: () => {}, // 기본값 추가
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  // 선택된 스프레드시트 정보를 저장할 상태
  const [selectedSheet, setSelectedSheet] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('googleAccessToken');
      const storedSheet = localStorage.getItem('selectedSheet'); // 로컬 스토리지에서 시트 정보도 복원
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setGoogleAccessToken(storedToken);
      }
      if (storedSheet) {
        setSelectedSheet(JSON.parse(storedSheet));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, accessToken) => {
    setUser(userData);
    setGoogleAccessToken(accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('googleAccessToken', accessToken);
  };

  const logout = () => {
    setUser(null);
    setGoogleAccessToken(null);
    setSelectedSheet(null); // 로그아웃 시 선택된 시트 정보도 초기화
    localStorage.removeItem('user');
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('selectedSheet'); // 로컬 스토리지에서도 삭제
  };

  // 시트가 선택될 때마다 로컬 스토리지에 저장하는 함수
  const handleSetSelectedSheet = (sheet) => {
    setSelectedSheet(sheet);
    if (sheet) {
      localStorage.setItem('selectedSheet', JSON.stringify(sheet));
    } else {
      localStorage.removeItem('selectedSheet');
    }
  };

  const value = { user, googleAccessToken, loading, login, logout, selectedSheet, setSelectedSheet: handleSetSelectedSheet };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
