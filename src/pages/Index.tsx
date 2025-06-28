import React, { useEffect, useState } from 'react';
import AuthPage from '../components/auth/AuthPage';
import HomePage from '../components/home/HomePage';
import { useAuthStore } from '../store/authStore';
import { auth, db } from '../lib/firebase';
import { ref as dbRef, get } from 'firebase/database';

const Index = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    const checkUserProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userData = await get(dbRef(db, `users/${currentUser.uid}`));
          if (!userData.exists()) {
            setNeedsProfileSetup(true);
          }
        } catch (error) {
          console.error('Error checking user profile:', error);
          setNeedsProfileSetup(true);
        }
      }
      setIsLoading(false);
    };

    checkUserProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-green-400 rounded-full mx-auto mb-4 flex items-center justify-center animate-spin">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated or needs profile setup
  if (!isAuthenticated || needsProfileSetup) {
    return <AuthPage />;
  }

  return <HomePage />;
};

export default Index;
