import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '../../store/authStore';
import { MessageCircle, Mail, Lock, User, Camera } from 'lucide-react';
import { auth, db, storage } from '../../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ref as dbRef, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is authenticated but needs profile setup
  useEffect(() => {
    const checkUserProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userData = await get(dbRef(db, `users/${currentUser.uid}`));
          if (!userData.exists()) {
            setShowProfile(true);
          }
        } catch (error) {
          console.error('Error checking user profile:', error);
        }
      }
    };

    checkUserProfile();
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      let userCredential;
      
      if (isSignUp) {
        // Sign up
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setShowProfile(true);
      } else {
        // Sign in
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if user has profile data
        const userData = await get(dbRef(db, `users/${userCredential.user.uid}`));
        if (userData.exists()) {
          const userInfo = userData.val();
          login({
            id: userCredential.user.uid,
            name: userInfo.name,
            email: userCredential.user.email,
            status: userInfo.status,
            photoURL: userInfo.photoURL,
          });
          navigate('/');
        } else {
          // New user without profile, show profile setup
          setShowProfile(true);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(getErrorMessage(error.code));
    }
    
    setLoading(false);
  };

  const handleCompleteProfile = async () => {
    setUploading(true);
    setError('');
    let photoURL = '';
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      // Upload profile picture if selected
      if (profilePic) {
        const picRef = storageRef(storage, `profile_pics/${user.uid}`);
        await uploadBytes(picRef, profilePic);
        photoURL = await getDownloadURL(picRef);
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: name,
        photoURL: photoURL
      });

      // Save user data to database
      await set(dbRef(db, `users/${user.uid}`), {
        name,
        email: user.email,
        status: status || 'Available',
        photoURL,
        createdAt: Date.now(),
      });

      // Login to store
      login({
        id: user.uid,
        name,
        email: user.email,
        status: status || 'Available',
        photoURL,
      });

      navigate('/');
    } catch (error) {
      console.error('Profile setup error:', error);
      setError('Failed to complete profile setup. Please try again.');
    }
    
    setUploading(false);
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 via-purple-100 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-pink-400/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-float-delayed"></div>
      </div>
      
      <Card className="w-full max-w-md p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-md relative z-10 animate-fade-in">
        {showProfile ? (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">Complete Your Profile</h2>
              <p className="text-purple-600/80 mt-2 font-medium">Tell us a bit about yourself</p>
            </div>
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-purple-700 font-semibold">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-2 border-purple-200 focus:border-pink-400 focus:ring-pink-400 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                />
              </div>
              <div>
                <Label htmlFor="profile-pic" className="text-purple-700 font-semibold">Profile Picture (Optional)</Label>
                <Input
                  id="profile-pic"
                  type="file"
                  accept="image/*"
                  onChange={e => setProfilePic(e.target.files?.[0] || null)}
                  className="mt-2 border-purple-200 focus:border-pink-400 focus:ring-pink-400 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                />
              </div>
              <div>
                <Label htmlFor="status" className="text-purple-700 font-semibold">About / Status</Label>
                <Input
                  id="status"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  placeholder="Available"
                  className="mt-2 border-purple-200 focus:border-pink-400 focus:ring-pink-400 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200 animate-shake">{error}</div>
              )}
              <Button
                onClick={handleCompleteProfile}
                disabled={!name.trim() || uploading}
                className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
              >
                {uploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Get Started'
                )}
              </Button>
              {!isSignUp && (
                <Button
                  onClick={() => setShowProfile(false)}
                  variant="ghost"
                  className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-medium transition-all duration-300"
                >
                  Back to Sign In
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">Welcome</h1>
              <p className="text-purple-600/80 mt-2 font-medium">Sign in to start messaging</p>
            </div>
            
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-1 shadow-inner">
                <TabsTrigger 
                  value="signin" 
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-pink-400 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 font-semibold"
                  onClick={() => setIsSignUp(false)}
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-purple-400 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 font-semibold"
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-purple-700 font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-2 border-purple-200 focus:border-pink-400 focus:ring-pink-400 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-purple-700 font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-2 border-purple-200 focus:border-pink-400 focus:ring-pink-400 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200 animate-shake">{error}</div>
                )}
                <Button
                  onClick={handleAuth}
                  disabled={!email || !password || loading}
                  className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-6">
                <div>
                  <Label htmlFor="signup-email" className="text-purple-700 font-semibold">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-2 border-purple-200 focus:border-pink-400 focus:ring-pink-400 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password" className="text-purple-700 font-semibold">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 6 characters)"
                    className="mt-2 border-purple-200 focus:border-pink-400 focus:ring-pink-400 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200 animate-shake">{error}</div>
                )}
                <Button
                  onClick={handleAuth}
                  disabled={!email || !password || password.length < 6 || loading}
                  className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </>
        )}
      </Card>
    </div>
  );
};

export default AuthPage;
