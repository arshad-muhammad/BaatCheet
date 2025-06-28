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
          { icon: <MessageCircle className="w-5 h-5" />, label: 'New Chat', color: 'bg-blue-500' },
          { icon: <Users className="w-5 h-5" />, label: 'New Group', color: 'bg-green-500' },
        ];
      case 'status':
        return [
          { icon: <Camera className="w-5 h-5" />, label: 'Camera', color: 'bg-purple-500' },
        ];
      case 'calls':
        return [
          { icon: <Phone className="w-5 h-5" />, label: 'Voice Call', color: 'bg-green-500' },
          { icon: <Video className="w-5 h-5" />, label: 'Video Call', color: 'bg-blue-500' },
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
                <span className="bg-black/80 text-white text-sm px-3 py-1 rounded-full whitespace-nowrap">
                  {action.label}
                </span>
                <Button
                  size="sm"
                  className={`${action.color} hover:scale-110 transition-transform duration-200 shadow-lg w-12 h-12 rounded-full`}
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
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
            isOpen
              ? 'bg-gray-600 hover:bg-gray-700 rotate-45'
              : 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 hover:scale-110'
          }`}
        >
          {isOpen ? <Plus className="w-6 h-6" /> : getMainIcon()}
        </Button>
      </div>
      <StatusUploadDialog 
        open={statusDialogOpen} 
        onOpenChange={setStatusDialogOpen} 
        onUploadSuccess={handleStatusUploadSuccess}
      />
      {/* Dialog for New Chat */}
      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogDescription>Search and select a user to send a chat invitation.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Search users by name or phone"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {(userSearch.trim() === '' ? allUsers : allUsers.filter(u =>
              u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
              (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
              (u.phone && u.phone.toLowerCase().includes(userSearch.toLowerCase())) ||
              u.id.toLowerCase().includes(userSearch.toLowerCase())
            )).map(userItem => (
              <div key={userItem.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100">
                <img src={userItem.photoURL || userItem.avatar} alt={userItem.name} className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <span className="truncate font-medium">{userItem.name}</span>
                  <div className="text-xs text-gray-500 truncate">
                    {userItem.email && <span>{userItem.email}</span>}
                    {userItem.email && userItem.phone && <span> &middot; </span>}
                    {userItem.phone && <span>{userItem.phone}</span>}
                  </div>
                </div>
                <Button size="sm" disabled={sendingInvite} onClick={() => sendChatInvitation(userItem.id)}>
                  {sendingInvite ? 'Sending...' : 'Invite'}
                </Button>
              </div>
            ))}
            {allUsers.length === 0 && <div className="text-gray-400 text-center py-4">No users found.</div>}
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog for New Group */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>Create a group with your accepted contacts. You need at least 2 members to create a group.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitNewGroup} className="space-y-4">
            {/* Group Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input
                placeholder="Enter group name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                required
              />
            </div>

            {/* Group Icon Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Icon</label>
              <div className="flex items-center space-x-3">
                {groupIconPreview ? (
                  <div className="relative">
                    <img 
                      src={groupIconPreview} 
                      alt="Group icon preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeIcon}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Upload className="w-6 h-6 text-gray-400" />
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
                    <Button type="button" variant="outline" size="sm" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Icon
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {/* Member Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Members ({selectedMembers.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                {acceptedContacts.length > 0 ? (
                  acceptedContacts.map(user => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedMembers.includes(user.id) 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleMember(user.id)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.photoURL || user.avatar} />
                        <AvatarFallback className="text-xs">
                          {user.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{user.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {user.phone || user.email || user.id}
                        </div>
                      </div>
                      {selectedMembers.includes(user.id) && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No accepted contacts found</p>
                    <p className="text-xs">You need to have accepted chat invitations to create groups</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Members Display */}
            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Selected Members:</label>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map(memberId => {
                    const user = acceptedContacts.find(u => u.id === memberId);
                    return (
                      <Badge key={memberId} variant="secondary" className="flex items-center space-x-1">
                        <Avatar className="w-4 h-4">
                          <AvatarImage src={user?.photoURL || user?.avatar} />
                          <AvatarFallback className="text-xs">
                            {user?.name?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{user?.name || memberId}</span>
                        <button
                          type="button"
                          onClick={() => toggleMember(memberId)}
                          className="ml-1 hover:text-red-500"
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
                className="w-full"
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
