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

  const formatDate = (date: Date | number) => {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400 to-amber-400 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-full opacity-15 animate-desi-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-500/20 dark:to-orange-500/20 rounded-full opacity-10 animate-desi-bounce"></div>
        <div className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 dark:from-orange-500/20 dark:to-red-500/20 rounded-full opacity-20 animate-desi-pulse"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-r from-yellow-400 to-amber-400 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-full opacity-15 animate-desi-float-delayed"></div>
      </div>
      
      <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl min-h-screen relative z-10 border-l border-r border-white/20 dark:border-gray-700/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-100/95 via-amber-100/95 to-orange-100/95 dark:from-gray-800/95 dark:via-gray-700/95 dark:to-gray-800/95 backdrop-blur-md border-b border-yellow-200/50 dark:border-gray-600/50 p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-yellow-200/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover"
            >
              <ArrowLeft className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </Button>
            <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 dark:from-yellow-400 dark:via-amber-400 dark:to-orange-400 bg-clip-text text-transparent">Starred Messages</h1>
          </div>
        </div>

        <div className="p-4">
          {starredMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-yellow-200 dark:ring-yellow-600 shadow-lg">
                <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-heading font-bold text-yellow-800 dark:text-yellow-200 mb-2">No Starred Messages</h3>
              <p className="text-yellow-600/80 dark:text-yellow-400/80 font-body">Messages you star will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {starredMessages.map((message) => (
                <div
                  key={`${message.chatId}-${message.id}`}
                  className="bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/20 dark:to-amber-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-yellow-200/50 dark:border-yellow-700/50"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-yellow-200 dark:ring-yellow-600 shadow-lg">
                      <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-heading font-bold text-yellow-800 dark:text-yellow-200 truncate">
                          {message.chatName}
                        </h4>
                        <span className="text-xs text-yellow-600/70 dark:text-yellow-400/70 font-body">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700/90 dark:text-yellow-300/90 font-body line-clamp-2">
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