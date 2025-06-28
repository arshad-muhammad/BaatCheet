import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '../../store/settingsStore';
import { ArrowLeft, MessageSquare, Send, Download, Database, Type, Palette } from 'lucide-react';

const ChatSettings = () => {
  const navigate = useNavigate();
  const { chat, updateChat } = useSettingsStore();

  const handleToggle = (key: keyof typeof chat) => {
    if (typeof chat[key] === 'boolean') {
      updateChat({ [key]: !chat[key] });
    }
  };

  const handleSelect = (key: keyof typeof chat, value: string) => {
    updateChat({ [key]: value as any });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm shadow-xl min-h-screen">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Chat Settings</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Enter to Send */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Enter to Send</h3>
                  <p className="text-sm text-gray-500">Press Enter to send messages</p>
                </div>
              </div>
              <Switch
                checked={chat.enterToSend}
                onCheckedChange={() => handleToggle('enterToSend')}
              />
            </div>
          </div>

          {/* Media Auto Download */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Media Auto Download</h3>
                  <p className="text-sm text-gray-500">Automatically download media files</p>
                </div>
              </div>
              <Switch
                checked={chat.mediaAutoDownload}
                onCheckedChange={() => handleToggle('mediaAutoDownload')}
              />
            </div>
          </div>

          {/* Chat Backup */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Database className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Chat Backup</h3>
                  <p className="text-sm text-gray-500">Backup chat history to cloud</p>
                </div>
              </div>
              <Switch
                checked={chat.chatBackup}
                onCheckedChange={() => handleToggle('chatBackup')}
              />
            </div>
          </div>

          {/* Font Size */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Type className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Font Size</h3>
                  <p className="text-sm text-gray-500">Adjust text size in chats</p>
                </div>
              </div>
              <Select value={chat.fontSize} onValueChange={(value) => handleSelect('fontSize', value)}>
                <SelectTrigger>
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
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Palette className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Chat Theme</h3>
                  <p className="text-sm text-gray-500">Choose your chat appearance</p>
                </div>
              </div>
              <Select value={chat.chatTheme} onValueChange={(value) => handleSelect('chatTheme', value)}>
                <SelectTrigger>
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
        </div>
      </div>
    </div>
  );
};

export default ChatSettings; 