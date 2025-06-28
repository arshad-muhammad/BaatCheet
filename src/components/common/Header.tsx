import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const Header = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-orange-100/95 via-pink-100/95 to-purple-100/95 backdrop-blur-md border-b border-orange-200/50 sticky top-0 z-50 shadow-lg">
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar 
              className="w-12 h-12 cursor-pointer ring-2 ring-orange-200 hover:ring-pink-300 transition-all duration-300 hover:scale-110 shadow-lg animate-desi-pulse" 
              onClick={() => navigate('/profile')}
            >
              <AvatarImage src={user?.photoURL || user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400 text-white text-lg font-bold shadow-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold desi-gradient-text">
                BaatCheet
              </h1>
              <p className="text-xs text-orange-600/70 font-medium animate-desi-fade">Connect & Share</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-orange-600 hover:bg-orange-200/50 hover:text-orange-700 p-3 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-pink-600 hover:bg-pink-200/50 hover:text-pink-700 p-3 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover"
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
