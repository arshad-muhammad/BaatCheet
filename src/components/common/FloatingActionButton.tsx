
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle, Users, Phone, Video, Camera } from 'lucide-react';

interface FloatingActionButtonProps {
  activeTab: string;
  onActionClick?: (action: string) => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  activeTab, 
  onActionClick 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getMainIcon = () => {
    switch (activeTab) {
      case 'status':
        return <Camera className="w-6 h-6" />;
      case 'calls':
        return <Phone className="w-6 h-6" />;
      default:
        return <MessageCircle className="w-6 h-6" />;
    }
  };

  const getActions = () => {
    switch (activeTab) {
      case 'chats':
        return [
          { 
            icon: <MessageCircle className="w-5 h-5" />, 
            label: 'New Chat', 
            color: 'bg-blue-500',
            action: 'new-chat'
          },
          { 
            icon: <Users className="w-5 h-5" />, 
            label: 'New Group', 
            color: 'bg-green-500',
            action: 'new-group'
          },
        ];
      case 'status':
        return [
          { 
            icon: <Camera className="w-5 h-5" />, 
            label: 'Camera', 
            color: 'bg-purple-500',
            action: 'camera'
          },
        ];
      case 'calls':
        return [
          { 
            icon: <Phone className="w-5 h-5" />, 
            label: 'Voice Call', 
            color: 'bg-green-500',
            action: 'voice-call'
          },
          { 
            icon: <Video className="w-5 h-5" />, 
            label: 'Video Call', 
            color: 'bg-blue-500',
            action: 'video-call'
          },
        ];
      default:
        return [];
    }
  };

  const actions = getActions();

  const handleActionClick = (action: string) => {
    setIsOpen(false);
    onActionClick?.(action);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action Buttons */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-fade-in">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="bg-black/80 text-white text-sm px-3 py-1 rounded-full whitespace-nowrap">
                {action.label}
              </span>
              <Button
                size="sm"
                onClick={() => handleActionClick(action.action)}
                className={`${action.color} hover:scale-110 transition-transform duration-200 shadow-lg w-12 h-12 rounded-full`}
              >
                {action.icon}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-45'
            : 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 hover:scale-110'
        }`}
      >
        {isOpen ? <Plus className="w-6 h-6" /> : getMainIcon()}
      </Button>
    </div>
  );
};

export default FloatingActionButton;
