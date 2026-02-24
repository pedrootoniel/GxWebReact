import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import HomePage from './pages/HomePage';
import DownloadsPage from './pages/DownloadsPage';
import RankingsPage from './pages/RankingsPage';
import RulesPage from './pages/RulesPage';
import GuidesPage from './pages/GuidesPage';
import SupportPage from './pages/SupportPage';
import AccountPage from './pages/AccountPage';
import ShopPage from './pages/ShopPage';
import MarketPage from './pages/MarketPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    const handleOpenRegister = () => {
      setLoginOpen(false);
      setRegisterOpen(true);
    };
    document.addEventListener('open-register', handleOpenRegister);
    return () => document.removeEventListener('open-register', handleOpenRegister);
  }, []);

  const openLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  const openRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar onLoginClick={openLogin} />
        <LoginModal
          isOpen={loginOpen}
          onClose={() => setLoginOpen(false)}
          onSwitchToRegister={openRegister}
        />
        <RegisterModal
          isOpen={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onSwitchToLogin={openLogin}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/download" element={<DownloadsPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
