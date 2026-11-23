import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Personnel from './components/Personnel';
import Login from './components/Login'; 
import Settings from './components/Settings'; 
import Records from './components/Records';
import Statistics from './components/Statistics';
import WaitingList from './components/WaitingList'; 
import Predictions from './components/Predictions'; 
import IntoConsult from './components/IntoConsult'; // ★ 1. 匯入 IntoConsult 元件
import { clearDemoSession, readDemoSession, saveDemoSession, type DemoUser } from './services/demoAuth';
import './App.css'; 

function App() {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(readDemoSession);

  // 1. 初始化深色模式（優先讀取 localStorage）
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    try {
      return savedTheme ? JSON.parse(savedTheme) as boolean : false;
    } catch (error) {
      console.error('讀取介面主題設定失敗:', error);
      return false;
    }
  });

  // 2. 當 isDarkMode 改變時，更新 localStorage 與 body 樣式
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  if (!currentUser) {
    return <Login onLogin={(user) => {
      saveDemoSession(user);
      setCurrentUser(user);
    }} />;
  }

  // 根據深色模式動態切換背景色
  const bgColor = isDarkMode ? '#0F172A' : '#F8FAFC';

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', margin: 0, padding: 0, backgroundColor: bgColor, transition: 'background-color 0.3s' }}>
        
        <Header userName={currentUser.name} />
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          <Sidebar
            role={currentUser.role}
            onLogout={() => {
              clearDemoSession();
              setCurrentUser(null);
            }}
          />
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', backgroundColor: bgColor, transition: 'background-color 0.3s' }}>
            <Routes>
              {/* 主頁路徑 (/) 指向 WaitingList */}
              <Route path="/" element={currentUser.role === 'admin' ? <Navigate to="/personnel" replace /> : <WaitingList />} />
              
              {/* ★ 2. 新增看診頁面路由，路徑設為 /into-consult/:id */}
              <Route path="/into-consult/:id" element={currentUser.role === 'doctor' ? <IntoConsult /> : <Navigate to="/personnel" replace />} />
              
              {/* 首頁 (急診看板) 保留在 /triage */}
              <Route path="/triage" element={currentUser.role === 'doctor' ? <Dashboard /> : <Navigate to="/personnel" replace />} />
              <Route path="/predictions" element={currentUser.role === 'doctor' ? <Predictions isDarkMode={isDarkMode} /> : <Navigate to="/personnel" replace />} />
              
              <Route path="/records" element={currentUser.role === 'doctor' ? <Records isDarkMode={isDarkMode} /> : <Navigate to="/personnel" replace />} />
              <Route path="/statistics" element={currentUser.role === 'doctor' ? <Statistics isDarkMode={isDarkMode} /> : <Navigate to="/personnel" replace />} />
              
              {/* 將 isDarkMode 與 setIsDarkMode 傳遞給 Settings */}
              <Route 
                path="/settings" 
                element={<Settings
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={setIsDarkMode}
                  currentUser={currentUser}
                  onProfileChange={(name) => {
                    const updatedUser = { ...currentUser, name };
                    saveDemoSession(updatedUser);
                    setCurrentUser(updatedUser);
                  }}
                />}
              />

              <Route path="/personnel" element={currentUser.role === 'admin' ? <Personnel /> : <Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;