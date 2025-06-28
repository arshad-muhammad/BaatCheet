import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '../../store/authStore';
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm shadow-xl min-h-screen">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Settings</h1>
          </div>
        </div>

        {/* Profile Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.photoURL || user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-green-400 text-white text-xl">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-medium text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-600">{user?.status || 'Available'}</p>
              <p className="text-sm text-gray-500">{user?.phone || user?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="divide-y divide-gray-100">
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.onClick}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Settings */}
        <div className="p-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Quick Settings
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Moon className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium text-gray-900">Dark Mode</span>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">Notifications</span>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Read Receipts</span>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 p-3 rounded-lg"
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
