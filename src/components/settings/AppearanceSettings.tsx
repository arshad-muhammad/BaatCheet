import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '../../store/settingsStore';
import { ArrowLeft, Moon, Sun, Palette, Minimize } from 'lucide-react';

const AppearanceSettings = () => {
  const navigate = useNavigate();
  const { appearance, updateAppearance } = useSettingsStore();

  const handleToggle = (key: keyof typeof appearance) => {
    if (typeof appearance[key] === 'boolean') {
      updateAppearance({ [key]: !appearance[key] });
    }
  };

  const handleSelect = (key: keyof typeof appearance, value: string) => {
    updateAppearance({ [key]: value as 'light' | 'dark' | 'auto' | string });
  };

  const accentColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
  ];

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
            <h1 className="text-xl font-bold text-gray-800">Appearance</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Dark Mode */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Moon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Dark Mode</h3>
                  <p className="text-sm text-gray-500">Use dark theme</p>
                </div>
              </div>
              <Switch
                checked={appearance.darkMode}
                onCheckedChange={() => handleToggle('darkMode')}
              />
            </div>
          </div>

          {/* Theme */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Sun className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Theme</h3>
                  <p className="text-sm text-gray-500">Choose your preferred theme</p>
                </div>
              </div>
              <Select value={appearance.theme} onValueChange={(value) => handleSelect('theme', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Accent Color */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Palette className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Accent Color</h3>
                  <p className="text-sm text-gray-500">Choose your accent color</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleSelect('accentColor', color.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      appearance.accentColor === color.value
                        ? 'border-gray-900 scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-full h-8 rounded-md"
                      style={{ backgroundColor: color.value }}
                    />
                    <p className="text-xs text-gray-600 mt-1">{color.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Compact Mode */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Minimize className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Compact Mode</h3>
                  <p className="text-sm text-gray-500">Use compact layout</p>
                </div>
              </div>
              <Switch
                checked={appearance.compactMode}
                onCheckedChange={() => handleToggle('compactMode')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings; 