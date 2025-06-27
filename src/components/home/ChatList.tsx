
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChats } from '../../hooks/useChats';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Users, MessageCircle } from 'lucide-react';

interface ChatListProps {
  searchQuery: string;
}

const ChatList: React.FC<ChatListProps> = ({ searchQuery }) => {
  const { chats, loading } = useChats();
  const navigate = useNavigate();

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {filteredChats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => handleChatClick(chat.id)}
          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 relative group"
        >
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-green-400 text-white">
                  {chat.name?.charAt(0).toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              {chat.is_group && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                  <Users className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 truncate">
                  {chat.name || 'Unnamed Chat'}
                </h3>
                <div className="flex items-center space-x-2">
                  {chat.created_at && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(chat.created_at), { addSuffix: false })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center mt-1">
                <p className="text-sm text-gray-600 truncate">
                  {chat.is_group ? 'Group chat' : 'Direct message'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {filteredChats.length === 0 && !loading && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No chats found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try a different search term' : 'Start a new conversation using the + button'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatList;
