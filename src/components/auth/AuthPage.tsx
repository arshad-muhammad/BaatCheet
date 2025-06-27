
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '../../store/authStore';
import { MessageCircle, Phone, Mail } from 'lucide-react';

const AuthPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [name, setName] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const { login } = useAuthStore();

  const handleSendOtp = () => {
    setShowOtp(true);
  };

  const handleVerifyOtp = () => {
    if (otp === '123456') {
      setShowProfile(true);
    }
  };

  const handleCompleteProfile = () => {
    login({
      id: 'user1',
      name,
      phone: phoneNumber,
      email,
      status: 'Available',
    });
  };

  if (showProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
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

            <Button
              onClick={handleCompleteProfile}
              disabled={!name.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
            >
              Get Started
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (showOtp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
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
              <p className="text-sm text-gray-500 mt-2 text-center">Use 123456 for demo</p>
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
            >
              Verify & Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
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
      </Card>
    </div>
  );
};

export default AuthPage;
