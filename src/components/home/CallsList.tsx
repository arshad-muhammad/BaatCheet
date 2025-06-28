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
    return <PhoneOutgoing className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="divide-y divide-gray-100">
      {calls.map((call) => (
        <div
          key={call.id}
          className="p-4 hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={call.otherUserAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-green-400 text-white">
                {call.otherUserName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className={`font-medium truncate ${
                  call.missed ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {call.otherUserName}
                </h3>
                {getCallIcon(call.type, call.missed)}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {call.callType === 'video' && (
                  <Video className="w-3 h-3 text-gray-400" />
                )}
                <span className="text-sm text-gray-500">
                  {formatTime(call.timestamp)}
                  {call.duration && ` • ${formatDuration(call.duration)}`}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50 p-2">
                <Phone className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50 p-2">
                <Video className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {calls.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <PhoneCall className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No recent calls</h3>
          <p className="text-gray-500">Your call history will appear here</p>
        </div>
      )}
    </div>
  );
};

export default CallsList;
