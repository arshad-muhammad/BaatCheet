import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatList from './ChatList';
import StatusList from './StatusList';
import CallsList from './CallsList';
import Header from '../common/Header';
import FloatingActionButton from '../common/FloatingActionButton';
import { Search, MessageCircle, Users, Phone } from 'lucide-react';
import { fetchUserChatsAndGroups } from '@/lib/firebase';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats');
  const [loadingChats, setLoadingChats] = useState(true);
  const { setChats, chats } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) {
      setLoadingChats(false);
      return;
    }
    fetchUserChatsAndGroups(user.id).then((chats) => {
      setChats(chats);
      setLoadingChats(false);
    });
  }, [setChats, user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-50 to-purple-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-20 animate-desi-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-400 to-red-400 rounded-full opacity-15 animate-desi-bounce"></div>
        <div className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full opacity-25 animate-desi-pulse"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-r from-green-400 to-teal-400 rounded-full opacity-20 animate-desi-float-delayed"></div>
        <div className="absolute top-60 left-1/4 w-16 h-16 bg-gradient-to-r from-orange-300 to-pink-300 rounded-full opacity-30 animate-desi-scale"></div>
        <div className="absolute bottom-40 right-1/3 w-12 h-12 bg-gradient-to-r from-purple-300 to-indigo-300 rounded-full opacity-25 animate-desi-slide"></div>
      </div>
      
      <Header />
      
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md shadow-2xl min-h-screen relative z-10 border-l border-r border-white/20">
        {/* Search Bar */}
        <div className="p-4 border-b border-orange-200/50 bg-gradient-to-r from-orange-50/50 to-pink-50/50">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 w-5 h-5 transition-all duration-300 group-focus-within:text-pink-500 animate-desi-pulse" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, messages..."
              className="pl-10 border-2 border-orange-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 rounded-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-orange-300 focus:bg-white shadow-lg desi-button-hover"
            />
          </div>
        </div>

        {/* Tabs */}
        {loadingChats ? (
          <div className="p-4 bg-gradient-to-br from-orange-50/30 to-pink-50/30">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 py-4 border-b border-orange-200/30 animate-pulse">
                <Skeleton className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-200 to-pink-200" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-32 mb-2 bg-gradient-to-r from-orange-200 to-pink-200" />
                  <Skeleton className="h-3 w-24 bg-gradient-to-r from-orange-200 to-pink-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-16 bg-gradient-to-r from-orange-100/80 to-pink-100/80 p-2 border-b border-orange-200/50 backdrop-blur-sm">
              <TabsTrigger 
                value="chats" 
                className="flex-1 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-pink-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 hover:bg-orange-200/50 data-[state=inactive]:text-orange-700 data-[state=inactive]:hover:text-orange-800 desi-button-hover"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chats
              </TabsTrigger>
              <TabsTrigger 
                value="status" 
                className="flex-1 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-purple-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 hover:bg-pink-200/50 data-[state=inactive]:text-pink-700 data-[state=inactive]:hover:text-pink-800 desi-button-hover"
              >
                <Users className="w-4 h-4 mr-2" />
                Status
              </TabsTrigger>
              <TabsTrigger 
                value="calls" 
                className="flex-1 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-indigo-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 hover:bg-purple-200/50 data-[state=inactive]:text-purple-700 data-[state=inactive]:hover:text-purple-800 desi-button-hover"
              >
                <Phone className="w-4 h-4 mr-2" />
                Calls
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chats" className="mt-0 bg-gradient-to-br from-orange-50/30 to-pink-50/30">
              <ChatList searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent value="status" className="mt-0 bg-gradient-to-br from-pink-50/30 to-purple-50/30">
              <StatusList />
            </TabsContent>
            <TabsContent value="calls" className="mt-0 bg-gradient-to-br from-purple-50/30 to-indigo-50/30">
              <CallsList />
            </TabsContent>
          </Tabs>
        )}

        <FloatingActionButton activeTab={activeTab} />
      </div>
    </div>
  );
};

export default HomePage;
