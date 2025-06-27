
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useChats } from '../../hooks/useChats';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onChatCreated }) => {
  const { createChat, loadAllProfiles } = useChats();
  const { toast } = useToast();
  const [chatName, setChatName] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>(['']);
  const [isGroup, setIsGroup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    const users = await loadAllProfiles();
    setAvailableUsers(users);
  };

  const handleAddEmail = () => {
    setMemberEmails([...memberEmails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    setMemberEmails(memberEmails.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...memberEmails];
    newEmails[index] = value;
    setMemberEmails(newEmails);
  };

  const handleCreateChat = async () => {
    const validEmails = memberEmails.filter(email => email.trim() !== '');
    
    if (validEmails.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one member",
        variant: "destructive"
      });
      return;
    }

    if (isGroup && !chatName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const finalChatName = isGroup ? chatName : validEmails[0];
      const chatId = await createChat(finalChatName, validEmails, isGroup);
      if (chatId) {
        toast({
          title: "Success",
          description: "Chat created successfully!",
        });
        onChatCreated(chatId);
        onClose();
        // Reset form
        setChatName('');
        setMemberEmails(['']);
        setIsGroup(false);
      }
    } catch (error: any) {
      console.error('Chat creation error:', error);
      toast({
        title: "Error creating chat",
        description: error.message || "Please check the email addresses and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupCheckChange = (checked: boolean | 'indeterminate') => {
    setIsGroup(checked === true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isGroup"
              checked={isGroup}
              onCheckedChange={handleGroupCheckChange}
            />
            <Label htmlFor="isGroup">Group Chat</Label>
          </div>

          {isGroup && (
            <div>
              <Label htmlFor="chatName">Group Name</Label>
              <Input
                id="chatName"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                placeholder="Enter group name"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label>Add Members (by email)</Label>
            <div className="space-y-2 mt-2">
              {memberEmails.map((email, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder="user@example.com"
                    className="flex-1"
                  />
                  {memberEmails.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEmail(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddEmail}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Member
              </Button>
            </div>
          </div>

          {availableUsers.length > 0 && (
            <div>
              <Label className="text-sm text-gray-600">Available Users:</Label>
              <div className="max-h-32 overflow-y-auto mt-1 space-y-1">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="text-sm p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      const emptyIndex = memberEmails.findIndex(email => email === '');
                      if (emptyIndex !== -1) {
                        handleEmailChange(emptyIndex, user.email);
                      } else {
                        setMemberEmails([...memberEmails, user.email]);
                      }
                    }}
                  >
                    {user.full_name} ({user.email})
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreateChat} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Chat'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatModal;
