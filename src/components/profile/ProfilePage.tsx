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
    let photoURL = user.avatar || '';
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
      updateProfile({ name, status, avatar: photoURL });
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
    navigate('/auth');
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setStatus(user?.status || '');
    setProfilePic(null);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm shadow-xl min-h-screen">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-gray-800">Profile</h1>
            </div>
            
            {isEditing ? (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="p-2 hover:bg-gray-100"
                >
                  <Check className="w-5 h-5 text-green-600" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-gray-100"
              >
                <Edit2 className="w-5 h-5 text-blue-600" />
              </Button>
            )}
          </div>
        </div>

        {/* Profile Picture */}
        <div className="p-8 text-center border-b border-gray-100">
          <div className="relative inline-block">
            <Avatar className="w-32 h-32 mx-auto">
              <AvatarImage src={profilePic ? URL.createObjectURL(profilePic) : user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-green-400 text-white text-4xl">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg"
                  asChild
                >
                  <label htmlFor="profile-pic-input">
                    <Camera className="w-4 h-4" />
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
        <div className="p-6 space-y-6">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Name
            </Label>
            {isEditing ? (
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                disabled={uploading}
              />
            ) : (
              <p className="mt-2 text-lg text-gray-900">{user?.name || 'Not set'}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status" className="text-sm font-medium text-gray-700">
              Status
            </Label>
            {isEditing ? (
              <Input
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Available"
                className="mt-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                disabled={uploading}
              />
            ) : (
              <p className="mt-2 text-gray-600">{user?.status || 'Available'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              Phone
            </Label>
            <p className="mt-2 text-gray-600">{user?.phone || 'Not set'}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <p className="mt-2 text-gray-600">{user?.email || 'Not set'}</p>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="p-6 border-t border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Last Seen</span>
              <span className="text-sm text-gray-500">Everyone</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Profile Photo</span>
              <span className="text-sm text-gray-500">My Contacts</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Status</span>
              <span className="text-sm text-gray-500">My Contacts</span>
            </div>
          </div>
        </div>

        {/* Error and Logout */}
        <div className="p-6 border-t border-gray-100 flex flex-col items-center">
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <Button onClick={handleLogout} variant="destructive" className="w-full max-w-xs">Logout</Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
