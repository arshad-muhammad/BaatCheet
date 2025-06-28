import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '../../store/authStore';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Moon, 
  Sun, 
  Lock, 
  Eye, 
  MessageSquare,
  LogOut,
  ChevronRight,
  Star
} from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', description: 'Name, status, photo', onClick: () => navigate('/profile') },
        { icon: Shield, label: 'Privacy', description: 'Block contacts, disappearing messages' },
        { icon: Lock, label: 'Security', description: 'Change number, delete account' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', description: 'Message, call notifications' },
        { icon: MessageSquare, label: 'Chats', description: 'Theme, wallpapers, chat history' },
        { icon: Palette, label: 'Appearance', description: 'Dark mode, themes' },
      ],
    },
    {
      title: 'Other',
      items: [
        { icon: Star, label: 'Starred Messages', description: 'View all starred messages' },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear local storage
      localStorage.removeItem('userId');
      
      // Clear auth store
      logout();
      
      // Navigate to auth page
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if Firebase signout fails, clear local state
      logout();
      localStorage.removeItem('userId');
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-50 to-purple-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-15 animate-desi-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-400 to-red-400 rounded-full opacity-10 animate-desi-bounce"></div>
        <div className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full opacity-20 animate-desi-pulse"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-r from-green-400 to-teal-400 rounded-full opacity-15 animate-desi-float-delayed"></div>
      </div>
      
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md shadow-2xl min-h-screen relative z-10 border-l border-r border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-100/95 via-pink-100/95 to-purple-100/95 backdrop-blur-md border-b border-orange-200/50 p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2 hover:bg-orange-200/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover"
            >
              <ArrowLeft className="w-5 h-5 text-orange-600" />
            </Button>
            <h1 className="text-2xl font-bold desi-gradient-text">Settings</h1>
          </div>
        </div>

        {/* Profile Section */}
        <div className="p-6 border-b border-orange-200/50 bg-gradient-to-r from-orange-50/50 to-pink-50/50">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16 ring-2 ring-orange-200 hover:ring-pink-300 transition-all duration-300 hover:scale-110 shadow-lg animate-desi-pulse">
              <AvatarImage src={user?.photoURL || user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400 text-white text-xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-orange-800">{user?.name}</h2>
              <p className="text-sm text-orange-600/80 font-medium">{user?.status || 'Available'}</p>
              <p className="text-sm text-orange-500/70 font-medium">{user?.phone || user?.email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/profile')}
              className="hover:bg-pink-200/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover"
            >
              <ChevronRight className="w-5 h-5 text-pink-600" />
            </Button>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="divide-y divide-orange-200/30">
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="p-4 bg-gradient-to-br from-pink-50/30 to-purple-50/30">
              <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-3 flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-desi-pulse"></div>
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.onClick}
                    className="w-full flex items-center space-x-3 p-4 hover:bg-gradient-to-r hover:from-orange-100/50 hover:to-pink-100/50 rounded-xl transition-all duration-300 desi-card group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center ring-2 ring-orange-200 group-hover:ring-pink-300 transition-all duration-300 group-hover:scale-110 shadow-lg">
                      <item.icon className="w-5 h-5 text-orange-600 group-hover:text-pink-600 transition-colors duration-300" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-orange-800 group-hover:text-pink-800 transition-colors duration-300">{item.label}</p>
                      <p className="text-sm text-orange-600/80 font-medium">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-orange-500 group-hover:text-pink-500 transition-colors duration-300" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Settings */}
        <div className="p-4 border-t border-orange-200/50 bg-gradient-to-br from-purple-50/30 to-indigo-50/30">
          <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-desi-pulse"></div>
            Quick Settings
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-purple-100/50 hover:to-indigo-100/50 rounded-xl transition-all duration-300 desi-card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center ring-2 ring-purple-200 shadow-lg">
                  <Moon className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-bold text-purple-800">Dark Mode</span>
              </div>
              <Switch className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-indigo-500" />
            </div>
            
            <div className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-green-100/50 hover:to-emerald-100/50 rounded-xl transition-all duration-300 desi-card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center ring-2 ring-green-200 shadow-lg">
                  <Bell className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-bold text-green-800">Notifications</span>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500" />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-blue-100/50 hover:to-indigo-100/50 rounded-xl transition-all duration-300 desi-card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center ring-2 ring-blue-200 shadow-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold text-blue-800">Read Receipts</span>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500" />
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-orange-200/50 bg-gradient-to-br from-red-50/30 to-pink-50/30">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center justify-center space-x-2 text-red-600 hover:bg-gradient-to-r hover:from-red-100/50 hover:to-pink-100/50 p-4 rounded-xl transition-all duration-300 font-bold desi-button-hover"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
