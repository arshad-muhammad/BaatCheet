
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from '../components/auth/AuthPage';
import HomePage from '../components/home/HomePage';
import ChatScreen from '../components/chat/ChatScreen';
import SettingsPage from '../components/settings/SettingsPage';
import ProfilePage from '../components/profile/ProfilePage';
import { useAuthStore } from '../store/authStore';

const Index = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat/:id" element={<ChatScreen />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default Index;
