import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Camera, Loader2 } from 'lucide-react';
import { fetchStatusesForAcceptedContacts, getUserInfo } from '../../lib/firebase';
import StatusViewer from './StatusViewer';

interface StatusItem {
  id: string;
  mediaURL: string;
  userId: string;
  timestamp: number;
  type: 'image' | 'video';
}

interface UserStatuses {
  userId: string;
  statuses: StatusItem[];
  userInfo?: {
    name: string;
    avatar: string;
  };
}

const StatusList = () => {
  const [groupedStatuses, setGroupedStatuses] = useState<UserStatuses[]>([]);
  const [myStatus, setMyStatus] = useState<{ hasStatus: boolean; avatar: string }>({ hasStatus: false, avatar: '' });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentStatuses, setCurrentStatuses] = useState<StatusItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    const loadStatuses = async () => {
      try {
        setError(null);
        const allStatuses = await fetchStatusesForAcceptedContacts(userId);
        
        // Group statuses by user
        const grouped: Record<string, StatusItem[]> = {};
        allStatuses.forEach(status => {
          if (!grouped[status.userId]) {
            grouped[status.userId] = [];
          }
          grouped[status.userId].push(status);
        });

        // Sort statuses by timestamp (newest first) for each user
        const groupedArr: UserStatuses[] = await Promise.all(
          Object.entries(grouped).map(async ([uid, statuses]) => {
            const sortedStatuses = statuses.sort((a, b) => b.timestamp - a.timestamp);
            const userInfo = await getUserInfo(uid);
            return {
              userId: uid,
              statuses: sortedStatuses,
              userInfo: userInfo ? { name: userInfo.name, avatar: userInfo.avatar } : undefined,
            };
          })
        );

        setGroupedStatuses(groupedArr.filter(g => g.userId !== userId));
        
        // My status
        const myStatuses = groupedArr.find(g => g.userId === userId);
        setMyStatus({
          hasStatus: !!myStatuses && myStatuses.statuses.length > 0,
          avatar: myStatuses?.statuses[0]?.mediaURL || '',
        });
      } catch (error) {
        console.error('Error loading statuses:', error);
        setError('Failed to load statuses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadStatuses();
    
    // Set up real-time updates
    const interval = setInterval(loadStatuses, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [userId]);

  const handleStatusClick = (statuses: StatusItem[], startIndex: number = 0) => {
    setCurrentStatuses(statuses);
    setCurrentIndex(startIndex);
    setViewerOpen(true);
  };

  const handleStatusDelete = (statusId: string) => {
    // Remove the deleted status from the current statuses
    setCurrentStatuses(prev => prev.filter(s => s.id !== statusId));
    
    // Update grouped statuses
    setGroupedStatuses(prev => 
      prev.map(group => ({
        ...group,
        statuses: group.statuses.filter(s => s.id !== statusId)
      })).filter(group => group.statuses.length > 0)
    );
    
    // Update my status if it was deleted
    if (currentStatuses.find(s => s.id === statusId)?.userId === userId) {
      setMyStatus(prev => ({ ...prev, hasStatus: false, avatar: '' }));
    }
  };

  const handleMyStatusClick = () => {
    const myStatuses = groupedStatuses.find(g => g.userId === userId)?.statuses || [];
    if (myStatuses.length > 0) {
      handleStatusClick(myStatuses, 0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading statuses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Camera className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Error loading statuses</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          size="sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

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
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-green-600 hover:bg-green-50"
            onClick={handleMyStatusClick}
          >
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
      {groupedStatuses.length > 0 ? groupedStatuses.map((group) => (
        <div 
          key={group.userId} 
          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
          onClick={() => handleStatusClick(group.statuses)}
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500">
                <Avatar className="w-full h-full">
                  <AvatarImage src={group.userInfo?.avatar || group.statuses[0]?.mediaURL} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-green-400 text-white">
                    {group.userInfo?.name?.charAt(0).toUpperCase() || group.userId.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {group.userInfo?.name || `User ${group.userId}`}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(group.statuses[0]?.timestamp).toLocaleString()}
              </p>
            </div>
            {group.statuses.length > 1 && (
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {group.statuses.length}
              </div>
            )}
          </div>
        </div>
      )) : (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No status updates</h3>
          <p className="text-gray-500">Share photos and videos with your accepted contacts</p>
        </div>
      )}

      {/* Status Viewer */}
      <StatusViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        statuses={currentStatuses}
        currentIndex={currentIndex}
        onStatusChange={setCurrentIndex}
        onStatusDelete={handleStatusDelete}
        currentUserId={userId || ''}
      />
    </div>
  );
};

export default StatusList; 