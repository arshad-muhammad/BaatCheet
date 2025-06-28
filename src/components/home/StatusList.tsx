import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Camera, Loader2, Edit3 } from 'lucide-react';
import { fetchStatusesForAcceptedContacts, getUserInfo } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import StatusViewer from './StatusViewer';
import StatusUploadDialog from './StatusUploadDialog';

interface StatusItem {
  id: string;
  mediaURL: string;
  userId: string;
  timestamp: number;
  type: 'image' | 'video' | 'text';
  textContent?: string;
  backgroundColor?: string;
  textColor?: string;
  textSize?: number;
  textPosition?: {
    x: number;
    y: number;
  };
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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentStatuses, setCurrentStatuses] = useState<StatusItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    const loadStatuses = async () => {
      try {
        setError(null);
        const allStatuses = await fetchStatusesForAcceptedContacts(user.id);
        
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

        setGroupedStatuses(groupedArr.filter(g => g.userId !== user.id));
        
        // My status
        const myStatuses = groupedArr.find(g => g.userId === user.id);
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
  }, [user?.id]);

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
    if (currentStatuses.find(s => s.id === statusId)?.userId === user?.id) {
      setMyStatus(prev => ({ ...prev, hasStatus: false, avatar: '' }));
    }
  };

  const handleMyStatusClick = () => {
    const myStatuses = groupedStatuses.find(g => g.userId === user?.id)?.statuses || [];
    if (myStatuses.length > 0) {
      handleStatusClick(myStatuses, 0);
    } else {
      setUploadDialogOpen(true);
    }
  };

  const handleUploadSuccess = () => {
    // Refresh the statuses after upload
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
          <span className="text-pink-600 font-medium">Loading statuses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
          <Camera className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-red-800 mb-3">Error loading statuses</h3>
        <p className="text-red-600/80 mb-6 font-medium">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          size="sm"
          className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-700 hover:bg-red-100 font-bold"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-pink-200/30">
      {/* My Status */}
      <div className="p-4 bg-gradient-to-r from-pink-50/50 to-purple-50/50">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <Avatar className="w-16 h-16 ring-2 ring-pink-200 hover:ring-purple-300 transition-all duration-300 group-hover:scale-110 shadow-lg">
              <AvatarImage src={myStatus.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-400 text-white text-xl font-bold">
                You
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-pink-800 text-lg">My Status</h3>
            <p className="text-sm text-pink-600/80 font-medium">
              {myStatus.hasStatus ? 'Tap to view your status' : 'Tap to add status update'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-pink-600 hover:bg-pink-200/50 hover:text-pink-700 p-3 rounded-xl transition-all duration-300 hover:scale-110"
              onClick={handleMyStatusClick}
            >
              <Camera className="w-5 h-5" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-pink-600 hover:bg-pink-200/50 hover:text-pink-700 p-3 rounded-xl transition-all duration-300 hover:scale-110"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Edit3 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Updates Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50/80 to-indigo-50/80">
        <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center">
          <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
          Recent Updates
        </h4>
      </div>

      {/* Status List */}
      {groupedStatuses.length > 0 ? groupedStatuses.map((group) => (
        <div 
          key={group.userId} 
          className="p-4 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 cursor-pointer transition-all duration-300 border-b border-purple-100/30"
          onClick={() => handleStatusClick(group.statuses)}
        >
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Avatar className="w-14 h-14 ring-2 ring-purple-200 hover:ring-indigo-300 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <AvatarImage src={group.userInfo?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-400 text-white font-bold">
                  {(group.userInfo?.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-purple-800">
                {group.userInfo?.name || 'Unknown User'}
              </h4>
              <p className="text-sm text-purple-600/80 font-medium">
                {group.statuses.length} status{group.statuses.length !== 1 ? 'es' : ''} • {new Date(group.statuses[0]?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex space-x-1">
              {group.statuses.slice(0, 3).map((status, index) => (
                <div 
                  key={status.id}
                  className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white shadow-md"
                  style={{
                    backgroundImage: `url(${status.mediaURL})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: `translateX(${index * -4}px)`,
                    zIndex: 3 - index
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )) : (
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <Camera className="w-10 h-10 text-purple-500" />
          </div>
          <h3 className="text-xl font-bold text-purple-800 mb-3">No status updates</h3>
          <p className="text-purple-600/80 font-medium">
            Your friends haven't shared any status updates yet
          </p>
        </div>
      )}

      <StatusViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        statuses={currentStatuses}
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        onStatusDelete={handleStatusDelete}
      />
      
      <StatusUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default StatusList; 