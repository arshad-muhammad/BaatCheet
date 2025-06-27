
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import ClerkAuthPage from '../components/auth/ClerkAuthPage';
import HomePage from '../components/home/HomePage';

const Index = () => {
  const { isSignedIn, isLoaded } = useUser();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <ClerkAuthPage />;
  }

  return <HomePage />;
};

export default Index;
