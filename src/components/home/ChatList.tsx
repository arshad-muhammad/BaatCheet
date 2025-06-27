
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Users, Check, CheckCheck } from 'lucide-react';

interface ChatListProps {
  searchQuery: string;
}

const ChatList: React.FC<ChatListProps> = ({ searchQuery }) => {
  const { chats } = useChatStore();
  const navigate = useNavigate();

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.lastMessageTime && b.lastMessageTime) {
      return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
    }
    return 0;
  });

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="divide-y divide-gray-100">
      {sortedChats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => handleChatClick(chat.id)}
          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 relative group"
        >
          <div className="flex items-center space-x-3">
            {/* Avatar with online indicator */}
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src={chat.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-green-400 text-white">
                  {chat.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!chat.isGroup && chat.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              )}
              {chat.isGroup && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                  <Users className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900 truncate">
                    {chat.name}
                  </h3>
                  {chat.isPinned && (
                    <Pin className="w-4 h-4 text-gray-400 transform rotate-45" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {chat.lastMessageTime && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(chat.lastMessageTime, { addSuffix: false })}
                    </span>
                  )}
                  {chat.unreadCount > 0 && (
                    <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center mt-1">
                <CheckCheck className="w-4 h-4 text-blue-500 mr-1" />
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage || 'No messages yet'}
                </p>
              </div>
            </div>
          </div>

          {/* Hover actions */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <button className="p-1 hover:bg-gray-200 rounded-full">
                <Pin className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {filteredChats.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No chats found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try a different search term' : 'Start a new conversation'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatList;
