import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Lock, Shield, Key, Smartphone, Trash2, AlertTriangle } from 'lucide-react';

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
            <h1 className="text-xl font-bold text-gray-800">Security</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Two-Factor Authentication */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>
          </div>

          {/* Change Phone Number */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Phone Number</h3>
                  <p className="text-sm text-gray-500">Update your phone number</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">New Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Enter new phone number"
                />
                <Button 
                  onClick={handlePhoneUpdate}
                  disabled={!newPhone || newPhone === user?.phone}
                  size="sm"
                  className="w-full"
                >
                  Update Phone Number
                </Button>
              </div>
            </div>
          </div>

          {/* Login Sessions */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Key className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Active Sessions</h3>
                <p className="text-sm text-gray-500">Manage your login sessions</p>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-900">Delete Account</h3>
                <p className="text-sm text-red-600">Permanently delete your account and data</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Account Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Delete Account</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. All your data, messages, and contacts will be permanently deleted.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700"
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