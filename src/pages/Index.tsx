
import React from 'react';
import AuthPage from '../components/auth/AuthPage';
import HomePage from '../components/home/HomePage';
import { useAuthStore } from '../store/authStore';

const Index = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <HomePage />;
};

export default Index;
