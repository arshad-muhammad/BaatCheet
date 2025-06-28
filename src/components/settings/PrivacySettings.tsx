import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '../../store/settingsStore';
import { ArrowLeft, Shield, Eye, Users, Lock } from 'lucide-react';

const PrivacySettings = () => {
  const navigate = useNavigate();
  const { privacy, updatePrivacy } = useSettingsStore();

  const handleToggle = (key: keyof typeof privacy) => {
    updatePrivacy({ [key]: !privacy[key] });
  };

  const handleSelect = (key: keyof typeof privacy, value: string) => {
    updatePrivacy({ [key]: value as any });
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
            <h1 className="text-xl font-bold text-gray-800">Privacy</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Read Receipts */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Read Receipts</h3>
                  <p className="text-sm text-gray-500">Show when you've read messages</p>
                </div>
              </div>
              <Switch
                checked={privacy.readReceipts}
                onCheckedChange={() => handleToggle('readReceipts')}
              />
            </div>
          </div>

          {/* Last Seen */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Last Seen</h3>
                  <p className="text-sm text-gray-500">Show when you were last online</p>
                </div>
              </div>
              <Switch
                checked={privacy.lastSeen}
                onCheckedChange={() => handleToggle('lastSeen')}
              />
            </div>
          </div>

          {/* Profile Photo */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Profile Photo</h3>
                  <p className="text-sm text-gray-500">Who can see your profile photo</p>
                </div>
              </div>
              <Select value={privacy.profilePhoto} onValueChange={(value) => handleSelect('profilePhoto', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">My Contacts</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Status</h3>
                  <p className="text-sm text-gray-500">Who can see your status</p>
                </div>
              </div>
              <Select value={privacy.status} onValueChange={(value) => handleSelect('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">My Contacts</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Groups */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Groups</h3>
                  <p className="text-sm text-gray-500">Who can add you to groups</p>
                </div>
              </div>
              <Select value={privacy.groups} onValueChange={(value) => handleSelect('groups', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">My Contacts</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings; 