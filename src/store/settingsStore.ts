import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PrivacySettings {
  readReceipts: boolean;
  lastSeen: boolean;
  profilePhoto: 'everyone' | 'contacts' | 'nobody';
  status: 'everyone' | 'contacts' | 'nobody';
  groups: 'everyone' | 'contacts' | 'nobody';
}

interface NotificationSettings {
  messageNotifications: boolean;
  callNotifications: boolean;
  groupNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreview: boolean;
}

interface ChatSettings {
  enterToSend: boolean;
  mediaAutoDownload: boolean;
  chatBackup: boolean;
  fontSize: 'small' | 'medium' | 'large';
  chatTheme: 'default' | 'dark' | 'custom';
}

interface AppearanceSettings {
  darkMode: boolean;
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  compactMode: boolean;
}

interface SettingsState {
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  chat: ChatSettings;
  appearance: AppearanceSettings;
  updatePrivacy: (settings: Partial<PrivacySettings>) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updateChat: (settings: Partial<ChatSettings>) => void;
  updateAppearance: (settings: Partial<AppearanceSettings>) => void;
  resetToDefaults: () => void;
}

const defaultSettings: SettingsState = {
  privacy: {
    readReceipts: true,
    lastSeen: true,
    profilePhoto: 'everyone',
    status: 'everyone',
    groups: 'everyone',
  },
  notifications: {
    messageNotifications: true,
    callNotifications: true,
    groupNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    showPreview: true,
  },
  chat: {
    enterToSend: true,
    mediaAutoDownload: true,
    chatBackup: false,
    fontSize: 'medium',
    chatTheme: 'default',
  },
  appearance: {
    darkMode: false,
    theme: 'light',
    accentColor: '#3B82F6',
    compactMode: false,
  },
  updatePrivacy: () => {},
  updateNotifications: () => {},
  updateChat: () => {},
  updateAppearance: () => {},
  resetToDefaults: () => {},
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      updatePrivacy: (settings) =>
        set((state) => ({
          privacy: { ...state.privacy, ...settings },
        })),
      updateNotifications: (settings) =>
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        })),
      updateChat: (settings) =>
        set((state) => ({
          chat: { ...state.chat, ...settings },
        })),
      updateAppearance: (settings) =>
        set((state) => ({
          appearance: { ...state.appearance, ...settings },
        })),
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
    }
  )
); 