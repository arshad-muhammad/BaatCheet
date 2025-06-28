import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useChatStore } from '../../store/chatStore';
import { ArrowLeft, Star, MessageSquare, Calendar } from 'lucide-react';

const StarredMessages = () => {
  const navigate = useNavigate();
  const { messages, chats } = useChatStore();

  // Get all starred messages from all chats
  const starredMessages = Object.entries(messages).flatMap(([chatId, chatMessages]) =>
    chatMessages
      .filter(message => message.isStarred)
      .map(message => ({
        ...message,
        chatId,
        chatName: chats.find(chat => chat.id === chatId)?.name || 'Unknown Chat'
      }))
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm shadow-xl min-h-screen">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Starred Messages</h1>
          </div>
        </div>

        <div className="p-4">
          {starredMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Starred Messages</h3>
              <p className="text-gray-500">Messages you star will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {starredMessages.map((message) => (
                <div
                  key={`${message.chatId}-${message.id}`}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {message.chatName}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {message.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StarredMessages; 