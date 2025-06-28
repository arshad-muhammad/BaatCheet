import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatList from './ChatList';
import StatusList from './StatusList';
import CallsList from './CallsList';
import Header from '../common/Header';
import FloatingActionButton from '../common/FloatingActionButton';
import { Search, MessageCircle, Users, Phone, X } from 'lucide-react';
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

  // Debug search query changes
  useEffect(() => {
    console.log('=== HOMEPAGE SEARCH DEBUG ===');
    console.log('Search query changed to:', searchQuery);
  }, [searchQuery]);

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
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400 to-amber-400 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-full opacity-15 animate-desi-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-500/20 dark:to-orange-500/20 rounded-full opacity-10 animate-desi-bounce"></div>
        <div className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 dark:from-orange-500/20 dark:to-red-500/20 rounded-full opacity-20 animate-desi-pulse"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-r from-yellow-400 to-amber-400 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-full opacity-15 animate-desi-float-delayed"></div>
      </div>
      
      <Header />
      
      <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl min-h-screen relative z-10 border-l border-r border-white/20 dark:border-gray-700/20">
        {/* Search Bar */}
        <div className="p-4 border-b border-orange-200/50 bg-gradient-to-r from-orange-50/50 to-pink-50/50">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 w-5 h-5 transition-all duration-300 group-focus-within:text-pink-500 animate-desi-pulse" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, messages..."
              className="pl-10 pr-10 border-2 border-orange-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 rounded-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-orange-300 focus:bg-white shadow-lg desi-button-hover"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-600 transition-colors duration-200"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gradient-to-r from-yellow-100/95 via-amber-100/95 to-orange-100/95 dark:from-gray-800/95 dark:via-gray-700/95 dark:to-gray-800/95 backdrop-blur-md border-b border-yellow-200/50 dark:border-gray-600/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-yellow-200/50 to-amber-200/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-none border-b border-yellow-300/30 dark:border-gray-500/30 p-1">
              <TabsTrigger 
                value="chats" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-amber-400 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 font-bold"
              >
                Chats
              </TabsTrigger>
              <TabsTrigger 
                value="status" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-400 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 font-bold"
              >
                Status
              </TabsTrigger>
              <TabsTrigger 
                value="calls" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-red-400 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 font-bold"
              >
                Calls
              </TabsTrigger>
            </TabsList>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value="chats" className="m-0 h-full">
                <ChatList searchQuery={searchQuery} />
              </TabsContent>
              <TabsContent value="status" className="m-0 h-full">
                <StatusList />
              </TabsContent>
              <TabsContent value="calls" className="m-0 h-full">
                <CallsList />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton activeTab={activeTab} />
      </div>
    </div>
  );
};

export default HomePage;
