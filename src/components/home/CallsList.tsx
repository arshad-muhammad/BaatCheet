import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, Video, PhoneCall, PhoneMissed, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { useCallStore } from '../../store/callStore';
import { useAuthStore } from '../../store/authStore';
import { formatDistanceToNow } from 'date-fns';

const CallsList = () => {
  const { user } = useAuthStore();
  const { getCallsForUser } = useCallStore();
  
  const calls = user?.id ? getCallsForUser(user.id) : [];

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  const getCallIcon = (type: string, missed: boolean) => {
    if (missed) return <PhoneMissed className="w-4 h-4 text-red-500" />;
    if (type === 'incoming') return <PhoneIncoming className="w-4 h-4 text-green-500" />;
    return <PhoneOutgoing className="w-4 h-4 text-purple-500" />;
  };

  return (
    <div className="divide-y divide-purple-200/30">
      {calls.map((call) => (
        <div
          key={call.id}
          className="p-4 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 transition-all duration-300 border-b border-purple-100/30"
        >
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12 ring-2 ring-purple-200 hover:ring-indigo-300 transition-all duration-300 group-hover:scale-110 shadow-lg">
              <AvatarImage src={call.otherUserAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 via-indigo-400 to-blue-400 text-white font-bold">
                {call.otherUserName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className={`font-bold truncate ${
                  call.missed ? 'text-red-600' : 'text-purple-800'
                }`}>
                  {call.otherUserName}
                </h3>
                {getCallIcon(call.type, call.missed)}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {call.callType === 'video' && (
                  <Video className="w-3 h-3 text-indigo-500" />
                )}
                <span className="text-sm text-purple-600/80 font-medium">
                  {formatTime(call.timestamp)}
                  {call.duration && ` • ${formatDuration(call.duration)}`}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-green-600 hover:bg-green-200/50 hover:text-green-700 p-3 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-indigo-600 hover:bg-indigo-200/50 hover:text-indigo-700 p-3 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <Video className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {calls.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <PhoneCall className="w-10 h-10 text-purple-500" />
          </div>
          <h3 className="text-xl font-bold text-purple-800 mb-3">No recent calls</h3>
          <p className="text-purple-600/80 font-medium">Your call history will appear here</p>
        </div>
      )}
    </div>
  );
};

export default CallsList;
