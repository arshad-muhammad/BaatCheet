
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import ChatList from './ChatList';
import StatusList from './StatusList';
import CallsList from './CallsList';
import Header from '../common/Header';
import FloatingActionButton from '../common/FloatingActionButton';
import NewChatModal from '../chat/NewChatModal';
import { Search, MessageCircle, Users, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleChatCreated = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleFloatingActionClick = (action: string) => {
    if (action === 'new-chat' || action === 'new-group') {
      setIsNewChatModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm shadow-xl min-h-screen">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, messages..."
              className="pl-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl bg-gray-50"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-14 bg-transparent p-1 border-b border-gray-100">
            <TabsTrigger 
              value="chats" 
              className="flex-1 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chats
            </TabsTrigger>
            <TabsTrigger 
              value="status" 
              className="flex-1 rounded-lg data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:shadow-sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Status
            </TabsTrigger>
            <TabsTrigger 
              value="calls" 
              className="flex-1 rounded-lg data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              <Phone className="w-4 h-4 mr-2" />
              Calls
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="mt-0">
            <ChatList searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="status" className="mt-0">
            <StatusList />
          </TabsContent>

          <TabsContent value="calls" className="mt-0">
            <CallsList />
          </TabsContent>
        </Tabs>

        <FloatingActionButton 
          activeTab={activeTab} 
          onActionClick={handleFloatingActionClick}
        />
      </div>

      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
};

export default HomePage;
