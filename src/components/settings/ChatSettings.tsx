import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '../../store/settingsStore';
import { ArrowLeft, MessageSquare, Send, Download, Database, Type, Palette, Image } from 'lucide-react';

const ChatSettings = () => {
  const navigate = useNavigate();
  const { chat, updateChat } = useSettingsStore();

  const handleToggle = (key: keyof typeof chat) => {
    if (typeof chat[key] === 'boolean') {
      updateChat({ [key]: !chat[key] });
    }
  };

  const handleSelect = (key: keyof typeof chat, value: string) => {
    updateChat({ [key]: value as 'small' | 'medium' | 'large' | 'default' | 'dark' | 'custom' | string });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400 to-amber-400 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-full opacity-15 animate-desi-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-500/20 dark:to-orange-500/20 rounded-full opacity-10 animate-desi-bounce"></div>
        <div className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-r from-orange-400 to-red-400 dark:from-orange-500/20 dark:to-red-500/20 rounded-full opacity-20 animate-desi-pulse"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-r from-yellow-400 to-amber-400 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-full opacity-15 animate-desi-float-delayed"></div>
      </div>
      
      <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl min-h-screen relative z-10 border-l border-r border-white/20 dark:border-gray-700/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-100/95 via-amber-100/95 to-orange-100/95 dark:from-gray-800/95 dark:via-gray-700/95 dark:to-gray-800/95 backdrop-blur-md border-b border-yellow-200/50 dark:border-gray-600/50 p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-yellow-200/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover"
            >
              <ArrowLeft className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </Button>
            <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 dark:from-yellow-400 dark:via-amber-400 dark:to-orange-400 bg-clip-text text-transparent">Chat Settings</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Enter to Send */}
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-200/50 dark:border-blue-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center ring-2 ring-blue-200 dark:ring-blue-600 shadow-lg">
                  <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-blue-800 dark:text-blue-200">Enter to Send</h3>
                  <p className="text-sm font-body text-blue-600/80 dark:text-blue-400/80">Press Enter to send messages</p>
                </div>
              </div>
              <Switch
                checked={chat.enterToSend}
                onCheckedChange={() => handleToggle('enterToSend')}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500"
              />
            </div>
          </div>

          {/* Media Auto Download */}
          <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-green-200/50 dark:border-green-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center ring-2 ring-green-200 dark:ring-green-600 shadow-lg">
                  <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-green-800 dark:text-green-200">Media Auto Download</h3>
                  <p className="text-sm font-body text-green-600/80 dark:text-green-400/80">Automatically download media files</p>
                </div>
              </div>
              <Switch
                checked={chat.mediaAutoDownload}
                onCheckedChange={() => handleToggle('mediaAutoDownload')}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500"
              />
            </div>
          </div>

          {/* Chat Backup */}
          <div className="bg-gradient-to-r from-purple-50/80 to-violet-50/80 dark:from-purple-900/20 dark:to-violet-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-200/50 dark:border-purple-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900 rounded-full flex items-center justify-center ring-2 ring-purple-200 dark:ring-purple-600 shadow-lg">
                  <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-purple-800 dark:text-purple-200">Chat Backup</h3>
                  <p className="text-sm font-body text-purple-600/80 dark:text-purple-400/80">Backup chat history to cloud</p>
                </div>
              </div>
              <Switch
                checked={chat.chatBackup}
                onCheckedChange={() => handleToggle('chatBackup')}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-violet-500"
              />
            </div>
          </div>

          {/* Font Size */}
          <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-orange-200/50 dark:border-orange-700/50">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900 dark:to-amber-900 rounded-full flex items-center justify-center ring-2 ring-orange-200 dark:ring-orange-600 shadow-lg">
                  <Type className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-orange-800 dark:text-orange-200">Font Size</h3>
                  <p className="text-sm font-body text-orange-600/80 dark:text-orange-400/80">Adjust text size in chats</p>
                </div>
              </div>
              <Select value={chat.fontSize} onValueChange={(value) => handleSelect('fontSize', value)}>
                <SelectTrigger className="bg-white/80 dark:bg-gray-700/80 border-orange-200 dark:border-orange-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chat Theme */}
          <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-indigo-900/20 dark:to-blue-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-indigo-200/50 dark:border-indigo-700/50">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900 dark:to-blue-900 rounded-full flex items-center justify-center ring-2 ring-indigo-200 dark:ring-indigo-600 shadow-lg">
                  <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-indigo-800 dark:text-indigo-200">Chat Theme</h3>
                  <p className="text-sm font-body text-indigo-600/80 dark:text-indigo-400/80">Choose your chat appearance</p>
                </div>
              </div>
              <Select value={chat.chatTheme} onValueChange={(value) => handleSelect('chatTheme', value)}>
                <SelectTrigger className="bg-white/80 dark:bg-gray-700/80 border-indigo-200 dark:border-indigo-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Wallpapers */}
          <div className="bg-gradient-to-r from-pink-50/80 to-rose-50/80 dark:from-pink-900/20 dark:to-rose-900/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-pink-200/50 dark:border-pink-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900 dark:to-rose-900 rounded-full flex items-center justify-center ring-2 ring-pink-200 dark:ring-pink-600 shadow-lg">
                <Image className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-pink-800 dark:text-pink-200">Wallpapers</h3>
                <p className="text-sm font-body text-pink-600/80 dark:text-pink-400/80">Customize chat backgrounds</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-pink-300 dark:border-pink-600 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900"
              >
                Choose
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSettings; 