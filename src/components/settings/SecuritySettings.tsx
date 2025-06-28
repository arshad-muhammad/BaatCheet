import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Lock, Shield, Key, Smartphone, Trash2, AlertTriangle, Fingerprint } from 'lucide-react';

const SecuritySettings = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handlePhoneUpdate = () => {
    if (newPhone && newPhone !== user?.phone) {
      updateProfile({ phone: newPhone });
      // In a real app, you'd verify the phone number here
    }
  };

  const handleDeleteAccount = () => {
    // In a real app, you'd implement account deletion logic here
    console.log('Account deletion requested');
    setShowDeleteDialog(false);
  };

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
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-yellow-200/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover"
            >
              <ArrowLeft className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </Button>
            <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 dark:from-yellow-400 dark:via-amber-400 dark:to-orange-400 bg-clip-text text-transparent">Security</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Two-Factor Authentication */}
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-200/50 dark:border-blue-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center ring-2 ring-blue-200 dark:ring-blue-600 shadow-lg">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-blue-800 dark:text-blue-200">Two-Factor Authentication</h3>
                  <p className="text-sm font-body text-blue-600/80 dark:text-blue-400/80">Add an extra layer of security</p>
                </div>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500"
              />
            </div>
          </div>

          {/* Biometric Authentication */}
          <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-green-200/50 dark:border-green-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center ring-2 ring-green-200 dark:ring-green-600 shadow-lg">
                  <Fingerprint className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-green-800 dark:text-green-200">Biometric Authentication</h3>
                  <p className="text-sm font-body text-green-600/80 dark:text-green-400/80">Use fingerprint or face ID</p>
                </div>
              </div>
              <Switch
                defaultChecked
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500"
              />
            </div>
          </div>

          {/* Change Phone Number */}
          <div className="bg-gradient-to-r from-purple-50/80 to-violet-50/80 dark:from-purple-900/20 dark:to-violet-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-200/50 dark:border-purple-700/50">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900 rounded-full flex items-center justify-center ring-2 ring-purple-200 dark:ring-purple-600 shadow-lg">
                  <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-purple-800 dark:text-purple-200">Phone Number</h3>
                  <p className="text-sm font-body text-purple-600/80 dark:text-purple-400/80">Update your phone number</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-purple-700 dark:text-purple-300 font-medium">New Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Enter new phone number"
                  className="bg-white/80 dark:bg-gray-700/80 border-purple-200 dark:border-purple-600 focus:border-purple-400 dark:focus:border-purple-400"
                />
                <Button 
                  onClick={handlePhoneUpdate}
                  disabled={!newPhone || newPhone === user?.phone}
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white"
                >
                  Update Phone Number
                </Button>
              </div>
            </div>
          </div>

          {/* Login Sessions */}
          <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-orange-200/50 dark:border-orange-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900 dark:to-amber-900 rounded-full flex items-center justify-center ring-2 ring-orange-200 dark:ring-orange-600 shadow-lg">
                <Key className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-orange-800 dark:text-orange-200">Active Sessions</h3>
                <p className="text-sm font-body text-orange-600/80 dark:text-orange-400/80">Manage your login sessions</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900"
              >
                View All
              </Button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-gradient-to-r from-red-50/80 to-pink-50/80 dark:from-red-900/20 dark:to-pink-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-red-200/50 dark:border-red-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 rounded-full flex items-center justify-center ring-2 ring-red-200 dark:ring-red-600 shadow-lg">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-red-800 dark:text-red-200">Delete Account</h3>
                <p className="text-sm font-body text-red-600/80 dark:text-red-400/80">Permanently delete your account and data</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Account Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl p-6 max-w-sm w-full shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-gray-100">Delete Account</h3>
              </div>
              <p className="text-sm font-body text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone. All your data, messages, and contacts will be permanently deleted.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings; 