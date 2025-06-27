import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '../../store/authStore';
import { MessageCircle, Phone, Mail } from 'lucide-react';
import { auth, db, storage } from '../../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ref as dbRef, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

declare global {
  interface Window {
    recaptchaVerifier?: any;
  }
}

const AuthPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [name, setName] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const { login } = useAuthStore();
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          {
            size: 'invisible',
            callback: () => {},
          }
        );
      }
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setShowOtp(true);
    } catch (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      if (confirmationResult) {
        const res = await confirmationResult.confirm(otp);
        setShowProfile(true);
        // Save user ID for later use
        localStorage.setItem('userId', res.user.uid);
        // Optionally, navigate to profile setup page
        // navigate('/profile-setup');
      }
    } catch (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleCompleteProfile = async () => {
    setUploading(true);
    let photoURL = '';
    try {
      if (profilePic) {
        const picRef = storageRef(storage, `profile_pics/${userId}`);
        await uploadBytes(picRef, profilePic);
        photoURL = await getDownloadURL(picRef);
      }
      await set(dbRef(db, `users/${userId}`), {
        name,
        phone: phoneNumber,
        status,
        photoURL,
      });
      login({
        id: userId,
        name,
        phone: phoneNumber,
        status,
        photoURL,
      });
      navigate('/'); // or to your main/chat page
    } catch (error) {
      alert(error.message);
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        {showProfile ? (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-green-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Complete Your Profile</h2>
              <p className="text-gray-600 mt-2">Tell us a bit about yourself</p>
            </div>
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="profile-pic" className="text-gray-700">Profile Picture</Label>
                <Input
                  id="profile-pic"
                  type="file"
                  accept="image/*"
                  onChange={e => setProfilePic(e.target.files[0])}
                  className="mt-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="status" className="text-gray-700">About / Status</Label>
                <Input
                  id="status"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  placeholder="Available"
                  className="mt-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <Button
                onClick={handleCompleteProfile}
                disabled={!name.trim() || uploading}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
              >
                {uploading ? 'Saving...' : 'Get Started'}
              </Button>
              {uploading && <div className="text-center text-sm text-gray-500">Uploading...</div>}
            </div>
          </>
        ) : showOtp ? (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-green-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Enter OTP</h2>
              <p className="text-gray-600 mt-2">We sent a code to {phoneNumber || email}</p>
            </div>
            <div className="space-y-6">
              <div>
                <Label htmlFor="otp" className="text-gray-700">Verification Code</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="mt-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400 text-center text-xl tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
              >
                Verify & Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-green-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Welcome</h1>
              <p className="text-gray-600 mt-2">Sign in to start messaging</p>
            </div>
            <Tabs defaultValue="phone" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 rounded-xl">
                <TabsTrigger value="phone" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </TabsTrigger>
                <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
              </TabsList>
              <TabsContent value="phone" className="space-y-6">
                <div>
                  <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={!phoneNumber}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Send OTP
                </Button>
              </TabsContent>
              <TabsContent value="email" className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={!email}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Send OTP
                </Button>
              </TabsContent>
            </Tabs>
          </>
        )}
        <div id="recaptcha-container" style={{ display: 'none' }}></div>
      </Card>
    </div>
  );
};

export default AuthPage;
