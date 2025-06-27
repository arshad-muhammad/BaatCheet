
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({});
  const [profiles, setProfiles] = useState<{ [userId: string]: Profile }>({});
  const [loading, setLoading] = useState(true);

  // Sync user profile with Supabase when Clerk user is available
  useEffect(() => {
    if (user) {
      syncUserProfile();
    }
  }, [user]);

  const syncUserProfile = async () => {
    if (!user) return;

    try {
      // Check if profile exists using email instead of ID
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.emailAddresses[0]?.emailAddress)
        .single();

      if (!existingProfile) {
        // Insert profile with email as primary identifier
        await supabase.from('profiles').insert({
          id: user.id, // Keep Clerk ID for consistency
          email: user.emailAddresses[0]?.emailAddress,
          full_name: user.fullName || user.firstName || 'User',
          avatar_url: user.imageUrl
        });
      } else if (existingProfile.id !== user.id) {
        // Update the profile ID if it doesn't match current user ID
        await supabase
          .from('profiles')
          .update({
            id: user.id,
            full_name: user.fullName || user.firstName || 'User',
            avatar_url: user.imageUrl
          })
          .eq('email', user.emailAddresses[0]?.emailAddress);
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
    }
  };

  // Load user chats
  const loadChats = async () => {
    if (!user) return;

    try {
      const { data: chatMemberships } = await supabase
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

      if (chatMemberships) {
        const chatsData = chatMemberships.map(membership => membership.chats).filter(Boolean);
        setChats(chatsData as Chat[]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
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
    if (!user) return;

    try {
      console.log('Creating chat with emails:', memberEmails);
      
      // First, ensure current user profile exists
      await syncUserProfile();
      
      // Find user profiles for the provided emails
      const { data: memberProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', memberEmails);

      console.log('Found profiles:', memberProfiles);
      console.log('Profile query error:', profileError);

      if (profileError) {
        console.error('Error finding user profiles:', profileError);
        throw new Error('Error finding user profiles');
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
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          name,
          is_group: isGroup,
          created_by: user.id
        })
        .select()
        .single();

      console.log('Created chat:', newChat);
      console.log('Chat creation error:', chatError);

      if (chatError) {
        console.error('Error creating chat:', chatError);
        throw new Error('Failed to create chat');
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

        if (membersError) {
          console.error('Error adding chat members:', membersError);
          throw new Error('Failed to add members to chat');
        }

        // Reload chats
        await loadChats();
        return newChat.id;
      }
    } catch (error) {
      console.error('Error creating chat:', error);
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
