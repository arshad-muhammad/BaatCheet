
import React from 'react';
import { Check, CheckCheck, Star, Reply, Forward, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: string;
  reactions?: { [emoji: string]: string[] };
  isStarred?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isOwnMessage = message.senderId === 'me';

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-xs lg:max-w-md relative ${isOwnMessage ? 'ml-8' : 'mr-8'}`}>
        {/* Message Content */}
        <div
          className={`rounded-2xl px-4 py-2 shadow-sm ${
            isOwnMessage
              ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-br-md'
              : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
          }`}
        >
          {message.replyTo && (
            <div className={`text-xs mb-2 pb-2 border-l-2 pl-2 ${
              isOwnMessage ? 'border-white/30 text-white/80' : 'border-gray-300 text-gray-600'
            }`}>
              Replying to message...
            </div>
          )}
          
          <p className="text-sm leading-relaxed">{message.text}</p>
          
          <div className={`flex items-center justify-end space-x-1 mt-1 ${
            isOwnMessage ? 'text-white/80' : 'text-gray-500'
          }`}>
            <span className="text-xs">
              {formatDistanceToNow(message.timestamp, { addSuffix: false })}
            </span>
            {isOwnMessage && getStatusIcon()}
            {message.isStarred && (
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex space-x-1 mt-1">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <div
                key={emoji}
                className="bg-white border border-gray-200 rounded-full px-2 py-1 text-xs flex items-center space-x-1 shadow-sm"
              >
                <span>{emoji}</span>
                <span className="text-gray-600">{users.length}</span>
              </div>
            ))}
          </div>
        )}

        {/* Message Actions */}
        <div className={`absolute top-0 ${
          isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
        } opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex space-x-1`}>
          <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
            <Reply className="w-3 h-3" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
            <Forward className="w-3 h-3" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded text-yellow-600">
            <Star className="w-3 h-3" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded text-red-600">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
