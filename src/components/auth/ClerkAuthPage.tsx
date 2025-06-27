
import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle } from 'lucide-react';

const ClerkAuthPage = () => {
  const [activeTab, setActiveTab] = useState('signin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-green-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome to BaatCheet</h1>
          <p className="text-gray-600 mt-2">Sign in to start messaging</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 rounded-xl">
            <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-6">
            <div className="flex justify-center">
              <SignIn 
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600',
                    card: 'shadow-none bg-transparent',
                    headerTitle: 'text-xl font-semibold text-gray-800',
                    headerSubtitle: 'text-gray-600',
                  }
                }}
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
              />
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-6">
            <div className="flex justify-center">
              <SignUp 
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600',
                    card: 'shadow-none bg-transparent',
                    headerTitle: 'text-xl font-semibold text-gray-800',
                    headerSubtitle: 'text-gray-600',
                  }
                }}
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClerkAuthPage;
