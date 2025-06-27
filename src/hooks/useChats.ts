import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabase, setSupabaseAuth } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Chat {
  id: string;
  name: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  members?: Profile[];
  last_message?: string;
  last_message_time?: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

export const useChats = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({});
  const [profiles, setProfiles] = useState<{ [userId: string]: Profile }>({});
  const [loading, setLoading] = useState(true);

  // Set up Supabase auth with Clerk token
  useEffect(() => {
    const setupSupabaseAuth = async () => {
      if (user) {
        try {
          const token = await getToken({ template: 'supabase' });
          console.log('Setting Supabase auth with Clerk token');
          setSupabaseAuth(token);
        } catch (error) {
          console.error('Error getting Clerk token:', error);
        }
      }
    };

    setupSupabaseAuth();
  }, [user, getToken]);

  // Sync user profile with Supabase when Clerk user is available
  useEffect(() => {
    if (user) {
      syncUserProfile();
    }
  }, [user]);

  const syncUserProfile = async () => {
    if (!user) return;

    try {
      console.log('Syncing user profile for:', user.id);
      
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Existing profile:', existingProfile);
      console.log('Fetch error:', fetchError);

      if (!existingProfile && fetchError?.code === 'PGRST116') {
        // Profile doesn't exist, insert new one
        console.log('Creating new profile...');
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            full_name: user.fullName || user.firstName || 'User',
            avatar_url: user.imageUrl
          })
          .select()
          .single();

        console.log('New profile created:', newProfile);
        console.log('Insert error:', insertError);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
      } else if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: user.fullName || user.firstName || 'User',
            avatar_url: user.imageUrl
          })
          .eq('id', user.id);

        console.log('Update error:', updateError);
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
      } else if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
      toast.error('Failed to sync user profile');
    }
  };

  // Load user chats
  const loadChats = async () => {
    if (!user) return;

    try {
      console.log('Loading chats for user:', user.id);
      
      const { data: chatMemberships, error } = await supabase
        .from('chat_members')
        .select(`
          chat_id,
          chats (
            id,
            name,
            is_group,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);

      console.log('Chat memberships:', chatMemberships);
      console.log('Load chats error:', error);

      if (error) {
        console.error('Error loading chats:', error);
        throw error;
      }

      if (chatMemberships) {
        const chatsData = chatMemberships.map(membership => membership.chats).filter(Boolean);
        console.log('Processed chats data:', chatsData);
        setChats(chatsData as Chat[]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a specific chat
  const loadMessages = async (chatId: string) => {
    try {
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        // Load sender profiles for messages
        const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', senderIds);

        const profilesMap = senderProfiles?.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as { [id: string]: Profile }) || {};

        const messagesWithSenders = messagesData.map(msg => ({
          ...msg,
          sender: profilesMap[msg.sender_id]
        }));

        setMessages(prev => ({
          ...prev,
          [chatId]: messagesWithSenders
        }));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send a message
  const sendMessage = async (chatId: string, content: string) => {
    if (!user) return;

    try {
      const { data: newMessage } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content
        })
        .select()
        .single();

      if (newMessage) {
        // Get sender profile
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setMessages(prev => ({
          ...prev,
          [chatId]: [
            ...(prev[chatId] || []),
            {
              ...newMessage,
              sender: senderProfile
            }
          ]
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Create a new chat
  const createChat = async (name: string, memberEmails: string[], isGroup: boolean = false) => {
    if (!user) {
      console.error('No user available for chat creation');
      throw new Error('User not authenticated');
    }

    try {
      console.log('=== Starting chat creation ===');
      console.log('User ID:', user.id);
      console.log('Chat name:', name);
      console.log('Member emails:', memberEmails);
      console.log('Is group:', isGroup);
      
      // Ensure we have the latest Clerk token
      const token = await getToken({ template: 'supabase' });
      setSupabaseAuth(token);
      
      // First, ensure current user profile exists
      await syncUserProfile();
      
      // Find user profiles for the provided emails
      console.log('Finding profiles for emails:', memberEmails);
      const { data: memberProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', memberEmails);

      console.log('Found profiles:', memberProfiles);
      console.log('Profile query error:', profileError);

      if (profileError) {
        console.error('Error finding user profiles:', profileError);
        throw new Error(`Error finding user profiles: ${profileError.message}`);
      }

      if (!memberProfiles || memberProfiles.length === 0) {
        throw new Error('No users found with the provided email addresses. Make sure the users have registered.');
      }

      // Check if all emails were found
      const foundEmails = memberProfiles.map(profile => profile.email);
      const notFoundEmails = memberEmails.filter(email => !foundEmails.includes(email));
      
      if (notFoundEmails.length > 0) {
        throw new Error(`Users not found for emails: ${notFoundEmails.join(', ')}. Make sure they have registered.`);
      }

      // Create the chat
      console.log('Creating chat...');
      const chatData = {
        name,
        is_group: isGroup,
        created_by: user.id
      };
      console.log('Chat data to insert:', chatData);

      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert(chatData)
        .select()
        .single();

      console.log('Created chat:', newChat);
      console.log('Chat creation error:', chatError);

      if (chatError) {
        console.error('Error creating chat:', chatError);
        console.error('Chat error details:', {
          code: chatError.code,
          message: chatError.message,
          details: chatError.details,
          hint: chatError.hint
        });
        throw new Error(`Failed to create chat: ${chatError.message}`);
      }

      if (newChat) {
        // Add current user as member
        const membersToAdd = [
          { chat_id: newChat.id, user_id: user.id },
          ...memberProfiles.map(profile => ({
            chat_id: newChat.id,
            user_id: profile.id
          }))
        ];

        console.log('Adding members:', membersToAdd);

        const { error: membersError } = await supabase
          .from('chat_members')
          .insert(membersToAdd);

        console.log('Members insertion error:', membersError);

        if (membersError) {
          console.error('Error adding chat members:', membersError);
          console.error('Members error details:', {
            code: membersError.code,
            message: membersError.message,
            details: membersError.details,
            hint: membersError.hint
          });
          throw new Error(`Failed to add members to chat: ${membersError.message}`);
        }

        // Reload chats
        await loadChats();
        console.log('=== Chat creation completed successfully ===');
        toast.success('Chat created successfully!');
        return newChat.id;
      }
    } catch (error) {
      console.error('=== Chat creation failed ===');
      console.error('Error creating chat:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create chat');
      throw error;
    }
  };

  // Load all profiles for user search
  const loadAllProfiles = async () => {
    try {
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id); // Exclude current user

      if (allProfiles) {
        const profilesMap = allProfiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as { [userId: string]: Profile });
        setProfiles(profilesMap);
        return allProfiles;
      }
      return [];
    } catch (error) {
      console.error('Error loading profiles:', error);
      return [];
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add message if we have this chat loaded
          if (messages[newMessage.chat_id]) {
            loadMessages(newMessage.chat_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, messages]);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  return {
    chats,
    messages,
    profiles,
    loading,
    loadMessages,
    sendMessage,
    createChat,
    loadAllProfiles,
    loadChats
  };
};
