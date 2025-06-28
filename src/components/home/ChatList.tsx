import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Users, Check, CheckCheck, MessageCircle, Trash2 } from 'lucide-react';
import { fetchReceivedInvitations, fetchSentInvitations, acceptInvitation, rejectInvitation, fetchAllUsers, deleteChatForUser, testInvitationExists } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface ChatListProps {
  searchQuery: string;
}

const ChatList: React.FC<ChatListProps> = ({ searchQuery }) => {
  const { chats } = useChatStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [receivedInv, setReceivedInv] = useState([]);
  const [sentInv, setSentInv] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== CHATLIST useEffect TRIGGERED ===');
    console.log('user?.id:', user?.id);
    console.log('user object:', user);
    
    if (!user?.id) {
      console.log('No user ID found, user object:', user);
      return;
    }
    console.log('=== CHATLIST DEBUG ===');
    console.log('Current user ID:', user.id);
    console.log('User object:', user);
    console.log('Fetching invitations for user:', user.id);
    
    // Fetch received invitations
    fetchReceivedInvitations(user.id).then(invitations => {
      console.log('=== RECEIVED INVITATIONS ===');
      console.log('Received invitations:', invitations);
      console.log('Number of received invitations:', invitations.length);
      setReceivedInv(invitations);
    }).catch(error => {
      console.error('Error fetching received invitations:', error);
    });
    
    // Fetch sent invitations
    fetchSentInvitations(user.id).then(invitations => {
      console.log('=== SENT INVITATIONS ===');
      console.log('Sent invitations:', invitations);
      console.log('Number of sent invitations:', invitations.length);
      setSentInv(invitations);
    }).catch(error => {
      console.error('Error fetching sent invitations:', error);
    });
    
    // Fetch all users
    fetchAllUsers().then(users => {
      console.log('=== ALL USERS ===');
      console.log('All users:', users);
      console.log('Number of users:', users.length);
      const map = {};
      users.forEach(u => { map[u.id] = u; });
      setUsersById(map);
    }).catch(error => {
      console.error('Error fetching all users:', error);
    });
  }, [user?.id]);

  // Test invitation existence for debugging
  useEffect(() => {
    if (user?.id === 'LcnBOTI6uZYFOyIDbQKIyXQZQIZ2') {
      console.log('=== TESTING INVITATION FOR RECIPIENT ===');
      testInvitationExists('LcnBOTI6uZYFOyIDbQKIyXQZQIZ2', 'T8sByXKsS0XGcNLIS2lDXRlznrM2_LcnBOTI6uZYFOyIDbQKIyXQZQIZ2');
    }
  }, [user?.id]);

  // Only show chats for accepted invitations or group chats
  const filteredChats = chats.filter(chat =>
    chat.isGroup ||
    !sentInv.some(inv => inv.id === chat.id && inv.status !== 'accepted')
  ).filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedChats = [...filteredChats].sort((a, b) => {
    const aTime = a.lastMessageTime ? a.lastMessageTime.getTime() : 0;
    const bTime = b.lastMessageTime ? b.lastMessageTime.getTime() : 0;
    return bTime - aTime;
  });

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleAccept = async (invId: string) => {
    if (!user?.id) return;
    console.log('Accepting invitation:', invId);
    await acceptInvitation(user.id, invId);
    fetchReceivedInvitations(user.id).then(setReceivedInv);
    // Optionally, refresh chats
    window.location.reload();
  };
  
  const handleReject = async (invId: string) => {
    if (!user?.id) return;
    console.log('Rejecting invitation:', invId);
    await rejectInvitation(user.id, invId);
    fetchReceivedInvitations(user.id).then(setReceivedInv);
  };

  // Only show invitations with status 'pending' or undefined (default to pending)
  const pendingReceivedInv = receivedInv.filter(inv => {
    console.log('Filtering received invitation:', inv);
    return !inv.status || inv.status === 'pending';
  });
  const pendingSentInv = sentInv.filter(inv => {
    console.log('Filtering sent invitation:', inv);
    return !inv.status || inv.status === 'pending';
  });

  console.log('=== CHATLIST RENDER DEBUG ===');
  console.log('All received invitations:', receivedInv);
  console.log('All sent invitations:', sentInv);
  console.log('Pending received invitations:', pendingReceivedInv);
  console.log('Pending sent invitations:', pendingSentInv);
  console.log('Users by ID:', usersById);
  console.log('Current user object:', user);
  console.log('Filtered chats:', filteredChats);
  console.log('Sorted chats:', sortedChats);

  const handleDeleteChat = async () => {
    if (!chatToDelete || !user?.id) return;
    await deleteChatForUser(user.id, chatToDelete);
    setChatToDelete(null);
    setDeleteDialogOpen(false);
    window.location.reload(); // Or refresh chats from store
  };

  return (
    <div className="divide-y divide-orange-200/30">
      {/* Received Invitations */}
      {pendingReceivedInv.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50/80 to-orange-50/80 border-b border-yellow-200/50">
          <div className="px-4 py-3 bg-gradient-to-r from-yellow-100/90 to-orange-100/90 text-yellow-800 text-sm font-bold border-b border-yellow-200/50">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
              Received Invitations ({pendingReceivedInv.length})
            </span>
          </div>
          {pendingReceivedInv.map(inv => {
            const senderUser = usersById[inv.from];
            console.log('Rendering received invitation:', inv, 'sender user:', senderUser);
            return (
              <div key={inv.id} className="p-4 flex items-center space-x-3 hover:bg-yellow-50/50 transition-all duration-300">
                <Avatar className="w-12 h-12 ring-2 ring-yellow-200 hover:ring-orange-300 transition-all duration-300">
                  <AvatarImage src={senderUser?.photoURL || senderUser?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-400 text-white font-bold">
                    {(senderUser?.name || inv.from || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-orange-800">
                    {senderUser?.name || senderUser?.email || inv.from || 'Unknown User'}
                  </div>
                  <div className="text-xs text-orange-600 font-medium">wants to chat with you</div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold shadow-lg hover:scale-105 transition-all duration-300" 
                    onClick={() => handleAccept(inv.id)}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 font-bold shadow-lg hover:scale-105 transition-all duration-300"
                    onClick={() => handleReject(inv.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Sent Invitations */}
      {pendingSentInv.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-b border-blue-200/50">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-100/90 to-purple-100/90 text-blue-800 text-sm font-bold border-b border-blue-200/50">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              Sent Invitations ({pendingSentInv.length})
            </span>
          </div>
          {pendingSentInv.map(inv => {
            const recipientUser = usersById[inv.recipientId];
            console.log('Rendering sent invitation:', inv, 'recipient user:', recipientUser);
            return (
              <div key={inv.id} className="p-4 flex items-center space-x-3 hover:bg-blue-50/50 transition-all duration-300">
                <Avatar className="w-12 h-12 ring-2 ring-blue-200 hover:ring-purple-300 transition-all duration-300">
                  <AvatarImage src={recipientUser?.photoURL || recipientUser?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white font-bold">
                    {(recipientUser?.name || inv.recipientId || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-blue-800">
                    {recipientUser?.name || recipientUser?.email || inv.recipientId || 'Unknown User'}
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    Invitation: {inv.status || 'pending'}
                  </div>
                </div>
                <div className="text-xs text-blue-500 font-medium bg-blue-100/50 px-3 py-1 rounded-full">
                  Waiting for response...
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Chats */}
      {sortedChats.map((chat) => {
        // For 1:1 chats, show the other user's name (not UID), fallback to chat.otherUserName
        let displayName = chat.name;
        let displayAvatar = chat.avatar;
        if (!chat.isGroup) {
          if (usersById[chat.otherUserId]) {
            displayName = usersById[chat.otherUserId].name || usersById[chat.otherUserId].phone || chat.otherUserName || chat.otherUserId;
            displayAvatar = usersById[chat.otherUserId].photoURL || usersById[chat.otherUserId].avatar || chat.otherUserAvatar || '';
          } else {
            displayName = chat.otherUserName || chat.otherUserId;
            displayAvatar = chat.otherUserAvatar || '';
          }
        }
        return (
          <div
            key={chat.id}
            className="p-4 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-pink-50/50 cursor-pointer transition-all duration-300 relative group flex items-center border-b border-orange-100/30"
          >
            <div
              onClick={() => handleChatClick(chat.id)}
              className="flex-1 flex items-center space-x-3"
            >
              {/* Avatar with online indicator */}
              <div className="relative">
                <Avatar className="w-12 h-12 ring-2 ring-orange-200 hover:ring-pink-300 transition-all duration-300 group-hover:scale-110">
                  <AvatarImage src={displayAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400 text-white font-bold">
                    {(displayName || '').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!chat.isGroup && chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                )}
                {chat.isGroup && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-orange-800 truncate">
                      {displayName || 'Unknown'}
                    </h3>
                    {chat.isPinned && (
                      <Pin className="w-4 h-4 text-orange-500 transform rotate-45" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {chat.lastMessageTime && (
                      <span className="text-xs text-orange-600/70 font-medium">
                        {formatDistanceToNow(chat.lastMessageTime, { addSuffix: false })}
                      </span>
                    )}
                    {chat.unreadCount > 0 && (
                      <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-2 py-1 font-bold shadow-lg animate-pulse">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center mt-1">
                  <CheckCheck className="w-4 h-4 text-pink-500 mr-1" />
                  <p className="text-sm text-orange-700/80 truncate font-medium">
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </div>
            </div>
            {/* Pin and Delete buttons on hover */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex space-x-2">
              <button
                className="p-2 hover:bg-orange-200/50 rounded-full transition-all duration-300 hover:scale-110"
                title="Pin chat"
                // Add your pin logic here
              >
                <Pin className="w-4 h-4 text-orange-500" />
              </button>
              <AlertDialog open={deleteDialogOpen && chatToDelete === chat.id} onOpenChange={open => { setDeleteDialogOpen(open); if (!open) setChatToDelete(null); }}>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-2 hover:bg-red-200/50 rounded-full text-red-500 transition-all duration-300 hover:scale-110"
                    onClick={e => { e.stopPropagation(); setChatToDelete(chat.id); setDeleteDialogOpen(true); }}
                    title="Delete chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white/95 backdrop-blur-md border border-orange-200/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-orange-800">Delete Chat</AlertDialogTitle>
                    <AlertDialogDescription className="text-orange-600">
                      Are you sure you want to delete this chat? This will remove all messages and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-orange-100 text-orange-700 hover:bg-orange-200">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteChat} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}

      {filteredChats.length === 0 && pendingReceivedInv.length === 0 && pendingSentInv.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <MessageCircle className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-orange-800 mb-3">
            {searchQuery ? 'No chats found' : 'No conversations yet'}
          </h3>
          <p className="text-orange-600/80 mb-6 font-medium">
            {searchQuery 
              ? 'Try a different search term' 
              : 'Start a new conversation by sending an invitation to another user'
            }
          </p>
          {!searchQuery && (
            <div className="text-sm text-orange-500/70 font-medium bg-orange-50/50 px-4 py-2 rounded-full inline-block">
              Use the + button to send chat invitations
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatList;
