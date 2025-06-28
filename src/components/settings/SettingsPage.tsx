import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
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
  const { appearance, updateAppearance } = useSettingsStore();

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', description: 'Name, status, photo', onClick: () => navigate('/profile') },
        { icon: Shield, label: 'Privacy', description: 'Block contacts, disappearing messages', onClick: () => navigate('/settings/privacy') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', description: 'Message, call notifications', onClick: () => navigate('/settings/notifications') },
        { icon: MessageSquare, label: 'Chats', description: 'Theme, wallpapers, chat history', onClick: () => navigate('/settings/chats') },
      ],
    },
    {
      title: 'Other',
      items: [
        { icon: Star, label: 'Starred Messages', description: 'View all starred messages', onClick: () => navigate('/settings/starred') },
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

  const handleDarkModeToggle = (checked: boolean) => {
    console.log('Dark mode toggle clicked:', checked);
    console.log('Current appearance state:', appearance);
    updateAppearance({ darkMode: checked });
    console.log('Updated appearance state:', { ...appearance, darkMode: checked });
  };

  const handleManualToggle = () => {
    const newState = !appearance.darkMode;
    console.log('Manual toggle to:', newState);
    updateAppearance({ darkMode: newState });
  };

  const handleResetSettings = () => {
    console.log('Resetting settings to defaults');
    // Reset to defaults
    updateAppearance({ darkMode: false, theme: 'light', accentColor: '#3B82F6', compactMode: false });
  };

  useEffect(() => {
    console.log('Initial appearance state:', appearance);
  }, [appearance]);

  useEffect(() => {
    console.log('Appearance state changed:', appearance);
  }, [appearance]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400 to-amber-400 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-full opacity-15 animate-desi-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-500/20 dark:to-orange-500/20 rounded-full opacity-10 animate-desi-bounce"></div>
        <div className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 dark:from-orange-500/20 dark:to-red-500/20 rounded-full opacity-20 animate-desi-pulse"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-r from-yellow-400 to-amber-400 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-full opacity-15 animate-desi-float-delayed"></div>
      </div>
      
      <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl min-h-screen relative z-10 border-l border-r border-white/20 dark:border-gray-700/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-100/95 via-amber-100/95 to-orange-100/95 dark:from-gray-800/95 dark:via-gray-700/95 dark:to-gray-800/95 backdrop-blur-md border-b border-yellow-200/50 dark:border-gray-600/50 p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2 hover:bg-yellow-200/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover"
            >
              <ArrowLeft className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </Button>
            <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 dark:from-yellow-400 dark:via-amber-400 dark:to-orange-400 bg-clip-text text-transparent">Settings</h1>
          </div>
        </div>

        {/* Profile Section */}
        <div className="p-6 border-b border-yellow-200/50 dark:border-gray-600/50 bg-gradient-to-r from-yellow-50/50 to-amber-50/50 dark:from-gray-700/50 dark:to-gray-600/50">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16 ring-2 ring-yellow-200 dark:ring-yellow-600 hover:ring-amber-300 dark:hover:ring-amber-400 transition-all duration-300 hover:scale-110 shadow-lg animate-desi-pulse">
              <AvatarImage src={user?.photoURL || user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 dark:from-yellow-500 dark:via-amber-500 dark:to-orange-500 text-white text-xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-heading font-bold text-yellow-800 dark:text-yellow-200">{user?.name}</h2>
              <p className="text-sm font-body text-yellow-600/80 dark:text-yellow-400/80 font-medium">{user?.status || 'Available'}</p>
              <p className="text-sm font-body text-yellow-500/70 dark:text-yellow-400/70 font-medium">{user?.phone || user?.email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/profile')}
              className="hover:bg-amber-200/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover"
            >
              <ChevronRight className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </Button>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="divide-y divide-yellow-200/30 dark:divide-gray-600/30">
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="p-4 bg-gradient-to-br from-amber-50/30 to-orange-50/30 dark:from-gray-700/30 dark:to-gray-600/30">
              <h3 className="text-sm font-heading font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider mb-3 flex items-center">
                <div className="w-2 h-2 bg-orange-400 dark:bg-orange-500 rounded-full mr-2 animate-desi-pulse"></div>
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.onClick}
                    className="w-full flex items-center space-x-3 p-4 hover:bg-gradient-to-r hover:from-yellow-100/50 hover:to-amber-100/50 dark:hover:from-gray-600/50 dark:hover:to-gray-500/50 rounded-xl transition-all duration-300 desi-card group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 rounded-full flex items-center justify-center ring-2 ring-yellow-200 dark:ring-yellow-600 group-hover:ring-amber-300 dark:group-hover:ring-amber-400 transition-all duration-300 group-hover:scale-110 shadow-lg">
                      <item.icon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-heading font-bold text-yellow-800 dark:text-yellow-200 group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors duration-300">{item.label}</p>
                      <p className="text-sm font-body text-yellow-600/80 dark:text-yellow-400/80 font-medium">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-yellow-500 dark:text-yellow-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-300" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Settings */}
        <div className="p-4 border-t border-yellow-200/50 dark:border-gray-600/50 bg-gradient-to-br from-orange-50/30 to-red-50/30 dark:from-gray-600/30 dark:to-gray-500/30">
          <h3 className="text-sm font-heading font-bold text-red-700 dark:text-red-300 uppercase tracking-wider mb-3 flex items-center">
            <div className="w-2 h-2 bg-red-400 dark:bg-red-500 rounded-full mr-2 animate-desi-pulse"></div>
            Quick Settings
          </h3>
          
          {/* Debug Info */}
          <div className="mb-4 p-3 bg-yellow-100/50 dark:bg-gray-700/50 rounded-lg text-xs">
            <p className="text-yellow-800 dark:text-yellow-200">
              Debug: Dark mode is {appearance.darkMode ? 'ON' : 'OFF'}
            </p>
            <p className="text-yellow-600 dark:text-yellow-400">
              Document class: {document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
            </p>
            <button 
              onClick={handleManualToggle}
              className="mt-2 px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
            >
              Manual Toggle
            </button>
            <button 
              onClick={handleResetSettings}
              className="mt-2 ml-2 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
            >
              Reset Settings
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-orange-100/50 hover:to-red-100/50 dark:hover:from-gray-600/50 dark:hover:to-gray-500/50 rounded-xl transition-all duration-300 desi-card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-full flex items-center justify-center ring-2 ring-orange-200 dark:ring-orange-600 shadow-lg">
                  <Moon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <span className="font-heading font-bold text-orange-800 dark:text-orange-200">Dark Mode</span>
                  <p className="text-sm font-body text-orange-600/80 dark:text-orange-400/80">
                    {appearance.darkMode ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={appearance.darkMode}
                onCheckedChange={handleDarkModeToggle}
                className="dark-mode-toggle data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600" 
              />
            </div>
            
            <div className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-green-100/50 hover:to-emerald-100/50 dark:hover:from-gray-600/50 dark:hover:to-gray-500/50 rounded-xl transition-all duration-300 desi-card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center ring-2 ring-green-200 dark:ring-green-600 shadow-lg">
                  <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-heading font-bold text-green-800 dark:text-green-200">Notifications</span>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500" />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-blue-100/50 hover:to-indigo-100/50 dark:hover:from-gray-600/50 dark:hover:to-gray-500/50 rounded-xl transition-all duration-300 desi-card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center ring-2 ring-blue-200 dark:ring-blue-600 shadow-lg">
                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-heading font-bold text-blue-800 dark:text-blue-200">Read Receipts</span>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500" />
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-yellow-200/50 dark:border-gray-600/50 bg-gradient-to-br from-red-50/30 to-pink-50/30 dark:from-gray-600/30 dark:to-gray-500/30">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-100/50 hover:to-pink-100/50 dark:hover:from-red-900/50 dark:hover:to-pink-900/50 p-4 rounded-xl transition-all duration-300 font-bold desi-button-hover"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-heading">Log Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
