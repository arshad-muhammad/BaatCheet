
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Settings, Search } from 'lucide-react';

const Header = () => {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div onClick={() => navigate('/profile')} className="cursor-pointer">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonPopoverCard: "shadow-lg",
                    userButtonPopoverActionButton: "hover:bg-gray-100",
                  }
                }}
                userProfileMode="navigation"
                userProfileUrl="/profile"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Messages</h1>
              <p className="text-sm text-gray-500">
                Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:bg-gray-100 p-2"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:bg-gray-100 p-2"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
