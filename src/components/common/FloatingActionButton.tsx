import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle, Users, Phone, Video, Camera, Upload, X } from 'lucide-react';
import { db, storage } from '../../lib/firebase';
import { ref as dbRef, get, set, push, serverTimestamp, update, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import StatusUploadDialog from '../home/StatusUploadDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '@/hooks/use-toast';
import { fetchAllUsers, fetchAcceptedContacts } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface FloatingActionButtonProps {
  activeTab: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ activeTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [chatUserId, setChatUserId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('');
  const [groupIconFile, setGroupIconFile] = useState<File | null>(null);
  const [groupIconPreview, setGroupIconPreview] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const { chats, setChats } = useChatStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState([]);
  const [acceptedContacts, setAcceptedContacts] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

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
          { icon: <MessageCircle className="w-5 h-5" />, label: 'New Chat', color: 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600' },
          { icon: <Users className="w-5 h-5" />, label: 'New Group', color: 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600' },
        ];
      case 'status':
        return [
          { icon: <Camera className="w-5 h-5" />, label: 'Camera', color: 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600' },
        ];
      case 'calls':
        return [
          { icon: <Phone className="w-5 h-5" />, label: 'Voice Call', color: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' },
          { icon: <Video className="w-5 h-5" />, label: 'Video Call', color: 'bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600' },
        ];
      default:
        return [];
    }
  };

  const actions = getActions();

  const handleNewChat = async () => {
    setChatDialogOpen(true);
    setIsOpen(false);
    // Fetch all users (no filtering by id, since id is not UID in your DB)
    const users = await fetchAllUsers();
    setAllUsers(users);
    setUserSearch('');
  };

  const handleNewGroup = async () => {
    setGroupDialogOpen(true);
    setIsOpen(false);
    // Fetch accepted contacts for group creation
    if (user?.id) {
      const contacts = await fetchAcceptedContacts(user.id);
      setAcceptedContacts(contacts);
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupIconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setGroupIconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeIcon = () => {
    setGroupIconFile(null);
    setGroupIconPreview('');
    setGroupIcon('');
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const uploadGroupIcon = async (): Promise<string> => {
    if (!groupIconFile) return groupIcon;
    
    if (!user?.id) throw new Error('User not authenticated');
    
    const fileExt = groupIconFile.name.split('.').pop();
    const fileName = `group-icons/${user.id}_${Date.now()}.${fileExt}`;
    const fileRef = storageRef(storage, fileName);
    
    await uploadBytes(fileRef, groupIconFile);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  };

  const submitNewGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    if (!user?.id || !groupName.trim()) {
      setCreating(false);
      toast({ title: 'Error', description: 'Group name is required', variant: 'destructive' });
      return;
    }

    if (selectedMembers.length < 1) {
      setCreating(false);
      toast({ title: 'Error', description: 'Please select at least 2 members (including yourself)', variant: 'destructive' });
      return;
    }

    try {
      // Upload group icon if provided
      let iconUrl = groupIcon;
      if (groupIconFile) {
        iconUrl = await uploadGroupIcon();
      }

      // Add current user to members if not already included
      const members = selectedMembers.includes(user.id) ? selectedMembers : [...selectedMembers, user.id];
      
      const newGroupRef = push(dbRef(db, 'groups'));
      const groupId = newGroupRef.key;
      if (!groupId) throw new Error('No groupId');
      
      await set(newGroupRef, {
        name: groupName,
        icon: iconUrl,
        members,
        createdAt: serverTimestamp(),
        createdBy: user.id,
      });
      
      await set(dbRef(db, `groupChats/${groupId}/messages`), {});
      
      const updates = {};
      members.forEach(memberId => {
        updates[`userGroups/${memberId}/${groupId}`] = {
          groupId,
          name: groupName,
          icon: iconUrl,
          joinedAt: Date.now(),
        };
      });
      await update(dbRef(db), updates);
      
      // Update zustand store
      setChats([
        ...chats,
        {
          id: groupId,
          name: groupName,
          avatar: iconUrl,
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadCount: 0,
          isGroup: true,
          members,
        },
      ]);
      
      setGroupDialogOpen(false);
      setGroupName('');
      setGroupIcon('');
      setGroupIconFile(null);
      setGroupIconPreview('');
      setSelectedMembers([]);
      setCreating(false);
      toast({ title: 'Group created', description: 'New group created successfully!' });
      window.location.href = `/chat/${groupId}`;
    } catch (err) {
      setCreating(false);
      toast({ title: 'Error', description: 'Failed to create group', variant: 'destructive' });
    }
  };

  const handleStatusUpload = () => {
    setStatusDialogOpen(true);
    setIsOpen(false);
  };

  const handleStatusUploadSuccess = () => {
    // This will trigger a refresh of the status list
    // The StatusList component will automatically refresh due to its useEffect
    toast({ title: 'Status uploaded', description: 'Your status has been uploaded successfully!' });
  };

  const sendChatInvitation = async (recipientId) => {
    setSendingInvite(true);
    if (!user?.id || !recipientId) {
      setSendingInvite(false);
      toast({ title: 'Error', description: 'Invalid user', variant: 'destructive' });
      return;
    }
    try {
      const invitationId = `${user.id}_${recipientId}`;
      console.log('Sending invitation:', {
        from: user.id,
        to: recipientId,
        invitationId: invitationId,
        path: `chatInvitations/${recipientId}/${invitationId}`
      });
      await set(dbRef(db, `chatInvitations/${recipientId}/${invitationId}`), {
        from: user.id,
        to: recipientId,
        type: 'chat',
        status: 'pending',
        createdAt: Date.now(),
      });
      console.log('Invitation sent successfully');
      setSendingInvite(false);
      setChatDialogOpen(false);
      toast({ title: 'Invitation sent', description: 'Invitation sent successfully!' });
    } catch (err) {
      console.error('Error sending invitation:', err);
      setSendingInvite(false);
      toast({ title: 'Error', description: 'Failed to send invitation', variant: 'destructive' });
    }
  };

  return (
    <>
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
                <span className="bg-gradient-to-r from-orange-800/90 to-pink-800/90 text-white text-sm px-4 py-2 rounded-full whitespace-nowrap font-bold shadow-lg backdrop-blur-sm">
                  {action.label}
                </span>
                <Button
                  size="sm"
                  className={`${action.color} hover:scale-110 transition-all duration-300 shadow-xl w-14 h-14 rounded-full font-bold`}
                  onClick={
                    action.label === 'New Chat'
                      ? handleNewChat
                      : action.label === 'New Group'
                      ? handleNewGroup
                      : action.label === 'Camera' && activeTab === 'status'
                      ? handleStatusUpload
                      : undefined
                  }
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
          className={`w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen
              ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 rotate-45 hover:scale-110'
              : 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 hover:scale-110'
          }`}
        >
          {isOpen ? <Plus className="w-7 h-7" /> : getMainIcon()}
        </Button>
      </div>
      <StatusUploadDialog 
        open={statusDialogOpen} 
        onOpenChange={setStatusDialogOpen} 
        onUploadSuccess={handleStatusUploadSuccess}
      />
      {/* Dialog for New Chat */}
      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-md border border-orange-200/50">
          <DialogHeader>
            <DialogTitle className="text-orange-800 font-bold">Start New Chat</DialogTitle>
            <DialogDescription className="text-orange-600">Search and select a user to send a chat invitation.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Search users by name or phone"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="mb-2 border-2 border-orange-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 rounded-xl"
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {(userSearch.trim() === '' ? allUsers : allUsers.filter(u =>
              u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
              (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
              (u.phone && u.phone.toLowerCase().includes(userSearch.toLowerCase())) ||
              u.id.toLowerCase().includes(userSearch.toLowerCase())
            )).map(userItem => (
              <div key={userItem.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-pink-50/50 transition-all duration-300">
                <Avatar className="w-10 h-10 ring-2 ring-orange-200">
                  <AvatarImage src={userItem.photoURL || userItem.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white font-bold">
                    {userItem.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="truncate font-bold text-orange-800">{userItem.name}</span>
                  <div className="text-xs text-orange-600/80 truncate font-medium">
                    {userItem.email && <span>{userItem.email}</span>}
                    {userItem.email && userItem.phone && <span> &middot; </span>}
                    {userItem.phone && <span>{userItem.phone}</span>}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  disabled={sendingInvite} 
                  onClick={() => sendChatInvitation(userItem.id)}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold"
                >
                  {sendingInvite ? 'Sending...' : 'Invite'}
                </Button>
              </div>
            ))}
            {allUsers.length === 0 && <div className="text-orange-500/70 text-center py-4 font-medium">No users found.</div>}
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog for New Group */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-md border border-pink-200/50">
          <DialogHeader>
            <DialogTitle className="text-pink-800 font-bold">Create New Group</DialogTitle>
            <DialogDescription className="text-pink-600">Create a group with your accepted contacts. You need at least 2 members to create a group.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitNewGroup} className="space-y-4">
            {/* Group Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-pink-700">Group Name</label>
              <Input
                placeholder="Enter group name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                required
                className="border-2 border-pink-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 rounded-xl"
              />
            </div>

            {/* Group Icon Upload */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-pink-700">Group Icon</label>
              <div className="flex items-center space-x-3">
                {groupIconPreview ? (
                  <div className="relative">
                    <img 
                      src={groupIconPreview} 
                      alt="Group icon preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-pink-200 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removeIcon}
                      className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full p-1 hover:from-red-600 hover:to-pink-600 shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-pink-300 flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
                    <Upload className="w-6 h-6 text-pink-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                    id="group-icon-upload"
                  />
                  <label htmlFor="group-icon-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" className="w-full border-2 border-pink-200 text-pink-700 hover:bg-pink-50 font-bold">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Icon
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {/* Member Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-pink-700">
                Select Members ({selectedMembers.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto border-2 border-pink-200 rounded-xl p-3 space-y-2 bg-gradient-to-br from-pink-50/30 to-purple-50/30">
                {acceptedContacts.length > 0 ? (
                  acceptedContacts.map(user => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedMembers.includes(user.id) 
                          ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-300 shadow-md' 
                          : 'hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-purple-50/50'
                      }`}
                      onClick={() => toggleMember(user.id)}
                    >
                      <Avatar className="w-8 h-8 ring-2 ring-pink-200">
                        <AvatarImage src={user.photoURL || user.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-400 text-white text-xs font-bold">
                          {user.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate text-pink-800">{user.name || 'Unknown'}</div>
                        <div className="text-xs text-pink-600/80 truncate font-medium">
                          {user.phone || user.email || user.id}
                        </div>
                      </div>
                      {selectedMembers.includes(user.id) && (
                        <div className="w-5 h-5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-pink-600/80">
                    <Users className="w-8 h-8 mx-auto mb-2 text-pink-400" />
                    <p className="text-sm font-medium">No accepted contacts found</p>
                    <p className="text-xs">You need to have accepted chat invitations to create groups</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Members Display */}
            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-pink-700">Selected Members:</label>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map(memberId => {
                    const user = acceptedContacts.find(u => u.id === memberId);
                    return (
                      <Badge key={memberId} variant="secondary" className="flex items-center space-x-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 border border-pink-200 font-bold">
                        <Avatar className="w-4 h-4">
                          <AvatarImage src={user?.photoURL || user?.avatar} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-pink-400 to-purple-400 text-white">
                            {user?.name?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{user?.name || memberId}</span>
                        <button
                          type="button"
                          onClick={() => toggleMember(memberId)}
                          className="ml-1 hover:text-red-500 transition-colors duration-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={creating || selectedMembers.length < 1 || !groupName.trim()} 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold shadow-lg"
              >
                {creating ? 'Creating...' : `Create Group (${selectedMembers.length + 1} members)`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingActionButton;
