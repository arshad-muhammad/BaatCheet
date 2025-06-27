
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Camera } from 'lucide-react';

const StatusList = () => {
  const myStatus = {
    id: 'my-status',
    name: 'My Status',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    hasStatus: false,
  };

  const statuses = [
    {
      id: '1',
      name: 'Sarah Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c1a0?w=150&h=150&fit=crop&crop=face',
      time: '2 hours ago',
      viewed: false,
      count: 3,
    },
    {
      id: '2',
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      time: '5 hours ago',
      viewed: true,
      count: 1,
    },
    {
      id: '3',
      name: 'Emma Davis',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      time: '12 hours ago',
      viewed: false,
      count: 2,
    },
  ];

  return (
    <div className="divide-y divide-gray-100">
      {/* My Status */}
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-14 h-14">
              <AvatarImage src={myStatus.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-green-400 text-white text-lg">
                You
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">My Status</h3>
            <p className="text-sm text-gray-600">
              {myStatus.hasStatus ? 'Tap to view your status' : 'Tap to add status update'}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50">
            <Camera className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Recent Updates Header */}
      <div className="px-4 py-2 bg-gray-50">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Recent Updates
        </h4>
      </div>

      {/* Status List */}
      {statuses.map((status) => (
        <div
          key={status.id}
          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={`w-14 h-14 rounded-full p-0.5 ${
                status.viewed 
                  ? 'bg-gray-300' 
                  : 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500'
              }`}>
                <Avatar className="w-full h-full">
                  <AvatarImage src={status.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-green-400 text-white">
                    {status.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="flex-1">
              <h3 className={`font-medium ${status.viewed ? 'text-gray-600' : 'text-gray-900'}`}>
                {status.name}
              </h3>
              <p className="text-sm text-gray-500">{status.time}</p>
            </div>
            {status.count > 1 && (
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {status.count}
              </div>
            )}
          </div>
        </div>
      ))}

      {statuses.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No status updates</h3>
          <p className="text-gray-500">Share photos and videos with your contacts</p>
        </div>
      )}
    </div>
  );
};

export default StatusList;
