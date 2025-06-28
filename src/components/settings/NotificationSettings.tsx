import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '../../store/settingsStore';
import { ArrowLeft, Bell, MessageSquare, Phone, Users, Volume2, Smartphone, Eye } from 'lucide-react';

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { notifications, updateNotifications } = useSettingsStore();

  const handleToggle = (key: keyof typeof notifications) => {
    updateNotifications({ [key]: !notifications[key] });
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
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Message Notifications */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Message Notifications</h3>
                  <p className="text-sm text-gray-500">Get notified for new messages</p>
                </div>
              </div>
              <Switch
                checked={notifications.messageNotifications}
                onCheckedChange={() => handleToggle('messageNotifications')}
              />
            </div>
          </div>

          {/* Call Notifications */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Call Notifications</h3>
                  <p className="text-sm text-gray-500">Get notified for incoming calls</p>
                </div>
              </div>
              <Switch
                checked={notifications.callNotifications}
                onCheckedChange={() => handleToggle('callNotifications')}
              />
            </div>
          </div>

          {/* Group Notifications */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Group Notifications</h3>
                  <p className="text-sm text-gray-500">Get notified for group messages</p>
                </div>
              </div>
              <Switch
                checked={notifications.groupNotifications}
                onCheckedChange={() => handleToggle('groupNotifications')}
              />
            </div>
          </div>

          {/* Sound */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Sound</h3>
                  <p className="text-sm text-gray-500">Play sound for notifications</p>
                </div>
              </div>
              <Switch
                checked={notifications.soundEnabled}
                onCheckedChange={() => handleToggle('soundEnabled')}
              />
            </div>
          </div>

          {/* Vibration */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Vibration</h3>
                  <p className="text-sm text-gray-500">Vibrate for notifications</p>
                </div>
              </div>
              <Switch
                checked={notifications.vibrationEnabled}
                onCheckedChange={() => handleToggle('vibrationEnabled')}
              />
            </div>
          </div>

          {/* Show Preview */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Show Preview</h3>
                  <p className="text-sm text-gray-500">Show message preview in notifications</p>
                </div>
              </div>
              <Switch
                checked={notifications.showPreview}
                onCheckedChange={() => handleToggle('showPreview')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings; 