import { create } from 'zustand';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: string;
  reactions?: { [emoji: string]: string[] };
  isStarred?: boolean;
}

interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isGroup: boolean;
  isOnline?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  members?: string[];
  otherUserId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
}

interface ChatState {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  activeChat: string | null;
  setActiveChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  toggleStar: (chatId: string, messageId: string) => void;
  togglePin: (chatId: string) => void;
  setChats: (chats: Chat[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [
    {
      id: '1',
      name: 'Sarah Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c1a0?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'Hey! How are you doing?',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
      unreadCount: 2,
      isGroup: false,
      isOnline: true,
    },
    {
      id: '2',
      name: 'Team Project',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop',
      lastMessage: 'Meeting at 3 PM today',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
      unreadCount: 0,
      isGroup: true,
      members: ['user1', 'user2', 'user3'],
    },
    {
      id: '3',
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'Thanks for the help!',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      unreadCount: 0,
      isGroup: false,
      isOnline: false,
    },
  ],
  messages: {
    '1': [
      {
        id: '1',
        senderId: '1',
        text: 'Hey! How are you doing?',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        status: 'delivered',
        isStarred: true,
      },
      {
        id: '2',
        senderId: 'me',
        text: 'I\'m doing great! Just working on some projects.',
        timestamp: new Date(Date.now() - 1000 * 60 * 3),
        status: 'read',
      },
    ],
    '2': [
      {
        id: '3',
        senderId: 'user2',
        text: 'Meeting at 3 PM today',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        status: 'read',
        isStarred: true,
      },
    ],
    '3': [
      {
        id: '4',
        senderId: 'user3',
        text: 'Thanks for the help!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        status: 'read',
        isStarred: true,
      },
    ],
  },
  activeChat: null,
  setActiveChat: (chatId) => set({ activeChat: chatId }),
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [
        ...(state.messages[chatId] || []),
        {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date(),
        },
      ],
    },
  })),
  toggleStar: (chatId, messageId) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: state.messages[chatId]?.map(msg =>
        msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
      ) || [],
    },
  })),
  togglePin: (chatId) => set((state) => ({
    chats: state.chats.map(chat =>
      chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat
    ),
  })),
  setChats: (chats) => set({ chats }),
}));
