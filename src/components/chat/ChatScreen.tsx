
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChats } from '../../hooks/useChats';
import { ArrowLeft, Phone, Video, Settings, Send, Mic, Camera, File } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ChatScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { chats, messages, loadMessages, sendMessage } = useChats();
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const chat = chats.find(c => c.id === id);
  const chatMessages = messages[id || ''] || [];

  useEffect(() => {
    if (id) {
      loadMessages(id);
    }
  }, [id]);

  if (!chat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-600">Chat not found</h2>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (newMessage.trim() && id) {
      await sendMessage(id, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm shadow-xl min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-3 flex-1">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-green-400 text-white">
                  {chat.name?.charAt(0).toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-gray-900 truncate">{chat.name || 'Chat'}</h2>
                <p className="text-sm text-gray-500">
                  {chat.is_group ? 'Group chat' : 'Direct message'}
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
                <Phone className="w-5 h-5 text-green-600" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
                <Video className="w-5 h-5 text-blue-600" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
                <Settings className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {chatMessages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            
            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'ml-8' : 'mr-8'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 shadow-sm ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                    }`}
                  >
                    {!isOwnMessage && chat.is_group && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {message.sender?.full_name || 'User'}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className={`flex items-center justify-end mt-1 ${
                      isOwnMessage ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      <span className="text-xs">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
                <Camera className="w-5 h-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
                <File className="w-5 h-5 text-gray-600" />
              </Button>
            </div>

            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-full"
              />
            </div>

            {newMessage.trim() ? (
              <Button
                onClick={handleSendMessage}
                className="bg-green-500 hover:bg-green-600 rounded-full p-3"
              >
                <Send className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => setIsRecording(false)}
                className={`rounded-full p-3 transition-colors ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <Mic className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
