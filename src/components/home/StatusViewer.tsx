import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, X, Trash2, Clock } from 'lucide-react';
import { db, storage } from '../../lib/firebase';
import { ref as dbRef, remove } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

interface StatusItem {
  id: string;
  mediaURL: string;
  userId: string;
  timestamp: number;
  type: 'image' | 'video';
}

interface StatusViewerProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: StatusItem[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onStatusDelete?: (statusId: string) => void;
}

const StatusViewer: React.FC<StatusViewerProps> = ({
  isOpen,
  onClose,
  statuses,
  currentIndex,
  onIndexChange,
  onStatusDelete,
}) => {
  const [currentStatus, setCurrentStatus] = useState<StatusItem | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; avatar: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (statuses.length > 0 && currentIndex >= 0 && currentIndex < statuses.length) {
      setCurrentStatus(statuses[currentIndex]);
      // Fetch user info
      fetchUserInfo(statuses[currentIndex].userId);
    }
  }, [statuses, currentIndex]);

  const fetchUserInfo = async (userId: string) => {
    try {
      const response = await fetch(`https://tutamar-fd94c-default-rtdb.firebaseio.com/users/${userId}.json`);
      const userData = await response.json();
      if (userData) {
        setUserInfo({
          name: userData.name || 'Unknown User',
          avatar: userData.photoURL || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUserInfo({ name: 'Unknown User', avatar: '' });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      onIndexChange(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!currentStatus || !onStatusDelete) return;
    
    setDeleting(true);
    try {
      // Delete from database
      await remove(dbRef(db, `status/${currentStatus.userId}/${currentStatus.id}`));
      
      // Delete from storage
      const fileExt = currentStatus.mediaURL.split('.').pop();
      const fileRef = storageRef(storage, `status/${currentStatus.userId}/${currentStatus.id}.${fileExt}`);
      await deleteObject(fileRef);
      
      onStatusDelete(currentStatus.id);
      
      // Close viewer if no more statuses
      if (statuses.length <= 1) {
        onClose();
      } else {
        // Move to next status or previous
        if (currentIndex < statuses.length - 1) {
          onIndexChange(currentIndex);
        } else if (currentIndex > 0) {
          onIndexChange(currentIndex - 1);
        }
      }
    } catch (error) {
      console.error('Error deleting status:', error);
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = currentStatus?.userId === user?.id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-full h-full p-0 bg-black">
        <DialogTitle className="sr-only">Status Viewer</DialogTitle>
        <DialogDescription className="sr-only">View status updates from {userInfo?.name || 'user'}</DialogDescription>
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={userInfo?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-green-400 text-white">
                    {userInfo?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-white font-medium">{userInfo?.name || 'Unknown User'}</h3>
                  <div className="flex items-center space-x-1 text-white/70 text-sm">
                    <Clock className="w-3 h-3" />
                    <span>{currentStatus ? formatDistanceToNow(currentStatus.timestamp, { addSuffix: true }) : ''}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-white hover:bg-white/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center relative">
            {currentStatus && (
              <div className="w-full h-full flex items-center justify-center">
                {currentStatus.type === 'video' ? (
                  <video
                    src={currentStatus.mediaURL}
                    controls
                    className="max-w-full max-h-full object-contain"
                    autoPlay
                  />
                ) : (
                  <img
                    src={currentStatus.mediaURL}
                    alt="Status"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            )}

            {/* Navigation */}
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}
            
            {currentIndex < statuses.length - 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}
          </div>

          {/* Progress indicator */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex space-x-1">
              {statuses.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full ${
                    index === currentIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusViewer; 