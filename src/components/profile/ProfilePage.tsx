import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Camera, Edit2, Check, X } from 'lucide-react';
import { auth, db, storage } from '../../lib/firebase';
import { ref as dbRef, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [status, setStatus] = useState(user?.status || '');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setUploading(true);
    setError(null);
    let photoURL = user.photoURL || '';
    try {
      if (profilePic) {
        const picRef = storageRef(storage, `profile_pics/${user.id}`);
        await uploadBytes(picRef, profilePic);
        photoURL = await getDownloadURL(picRef);
      }
      await set(dbRef(db, `users/${user.id}`), {
        name,
        status,
        phone: user.phone || '',
        email: user.email || '',
        photoURL,
      });
      updateProfile({ name, status, photoURL });
      setIsEditing(false);
      setProfilePic(null);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message || 'Update failed');
      } else {
        setError('Update failed');
      }
    }
    setUploading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    localStorage.removeItem('userId');
    navigate('/');
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setStatus(user?.status || '');
    setProfilePic(null);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 via-purple-100 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-pink-400/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-float-delayed"></div>
      </div>
      
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md shadow-2xl min-h-screen relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50/90 via-pink-50/90 to-purple-50/90 backdrop-blur-md border-b border-purple-200/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gradient-to-r hover:from-orange-100 hover:to-pink-100 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <ArrowLeft className="w-5 h-5 text-purple-600" />
              </Button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">Profile</h1>
            </div>
            
            {isEditing ? (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="p-2 hover:bg-gradient-to-r hover:from-red-100 hover:to-pink-100 rounded-xl transition-all duration-300 hover:scale-110"
                >
                  <X className="w-5 h-5 text-red-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="p-2 hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 rounded-xl transition-all duration-300 hover:scale-110"
                >
                  <Check className="w-5 h-5 text-green-500" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <Edit2 className="w-5 h-5 text-purple-500" />
              </Button>
            )}
          </div>
        </div>

        {/* Profile Picture */}
        <div className="p-8 text-center border-b border-purple-200/50 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
          <div className="relative inline-block group">
            <Avatar className="w-32 h-32 mx-auto ring-4 ring-purple-200 hover:ring-pink-300 transition-all duration-300 group-hover:scale-105 shadow-xl">
              <AvatarImage src={profilePic ? URL.createObjectURL(profilePic) : user?.photoURL || user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400 text-white text-4xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 shadow-lg transition-all duration-300 hover:scale-110"
                  asChild
                >
                  <label htmlFor="profile-pic-input">
                    <Camera className="w-5 h-5" />
                  </label>
                </Button>
                <input
                  id="profile-pic-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => setProfilePic(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
              </>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6 space-y-6 bg-white/80">
          <div>
            <Label htmlFor="name" className="text-sm font-semibold text-purple-700">
              Name
            </Label>
            {isEditing ? (
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 border-purple-200 focus:border-pink-400 focus:ring-pink-400 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                disabled={uploading}
              />
            ) : (
              <p className="mt-2 text-lg font-semibold text-purple-800">{user?.name || 'Not set'}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status" className="text-sm font-semibold text-purple-700">
              Status
            </Label>
            {isEditing ? (
              <Input
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Available"
                className="mt-2 border-purple-200 focus:border-pink-400 focus:ring-pink-400 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                disabled={uploading}
              />
            ) : (
              <p className="mt-2 text-purple-600 font-medium">{user?.status || 'Available'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-semibold text-purple-700">
              Phone
            </Label>
            <p className="mt-2 text-purple-600 font-medium">{user?.phone || 'Not set'}</p>
          </div>

          <div>
            <Label className="text-sm font-semibold text-purple-700">
              Email
            </Label>
            <p className="mt-2 text-purple-600 font-medium">{user?.email || 'Not set'}</p>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="p-6 border-t border-purple-200/50 bg-gradient-to-r from-purple-50/30 to-pink-50/30">
          <h3 className="text-lg font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">Privacy</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200/50 hover:shadow-md transition-all duration-300">
              <span className="text-purple-700 font-medium">Last Seen</span>
              <span className="text-sm text-purple-500 font-medium">Everyone</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200/50 hover:shadow-md transition-all duration-300">
              <span className="text-purple-700 font-medium">Profile Photo</span>
              <span className="text-sm text-purple-500 font-medium">My Contacts</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200/50 hover:shadow-md transition-all duration-300">
              <span className="text-purple-700 font-medium">Status</span>
              <span className="text-sm text-purple-500 font-medium">My Contacts</span>
            </div>
          </div>
        </div>

        {/* Error and Logout */}
        <div className="p-6 border-t border-purple-200/50 flex flex-col items-center bg-gradient-to-r from-red-50/50 to-pink-50/50">
          {error && (
            <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-200 animate-shake w-full text-center">{error}</div>
          )}
          <Button 
            onClick={handleLogout} 
            variant="destructive" 
            className="w-full max-w-xs bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
