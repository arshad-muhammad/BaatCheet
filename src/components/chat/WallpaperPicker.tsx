import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Image as ImageIcon, Upload, X, Check } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

interface WallpaperOption {
  id: string;
  name: string;
  preview: string;
  value: string;
  type: 'gradient' | 'image';
}

const predefinedWallpapers: WallpaperOption[] = [
  {
    id: 'default',
    name: 'Default',
    preview: 'bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100',
    value: 'default',
    type: 'gradient'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    preview: 'bg-gradient-to-br from-pink-400 via-red-400 to-yellow-400',
    value: 'bg-gradient-to-br from-pink-400 via-red-400 to-yellow-400',
    type: 'gradient'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    preview: 'bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400',
    value: 'bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400',
    type: 'gradient'
  },
  {
    id: 'forest',
    name: 'Forest',
    preview: 'bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400',
    value: 'bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400',
    type: 'gradient'
  },
  {
    id: 'lavender',
    name: 'Lavender',
    preview: 'bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400',
    value: 'bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400',
    type: 'gradient'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    preview: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black',
    value: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black',
    type: 'gradient'
  },
  {
    id: 'warm',
    name: 'Warm',
    preview: 'bg-gradient-to-br from-orange-300 via-amber-300 to-yellow-300',
    value: 'bg-gradient-to-br from-orange-300 via-amber-300 to-yellow-300',
    type: 'gradient'
  },
  {
    id: 'cool',
    name: 'Cool',
    preview: 'bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300',
    value: 'bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300',
    type: 'gradient'
  }
];

interface WallpaperPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WallpaperPicker: React.FC<WallpaperPickerProps> = ({ open, onOpenChange }) => {
  const { chat, updateChat } = useSettingsStore();
  const [selectedWallpaper, setSelectedWallpaper] = useState(chat.wallpaper);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWallpaperSelect = (wallpaper: WallpaperOption) => {
    setSelectedWallpaper(wallpaper.value);
  };

  const handleCustomImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setCustomImageUrl(url);
        setSelectedWallpaper(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    updateChat({ wallpaper: selectedWallpaper });
    onOpenChange(false);
  };

  const handleReset = () => {
    setSelectedWallpaper('default');
    setCustomImageUrl('');
    updateChat({ wallpaper: 'default' });
  };

  const getCurrentWallpaper = () => {
    if (selectedWallpaper === 'default') {
      return 'bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100';
    }
    if (selectedWallpaper.startsWith('bg-')) {
      return selectedWallpaper;
    }
    if (selectedWallpaper.startsWith('data:') || selectedWallpaper.startsWith('http')) {
      return `bg-[url('${selectedWallpaper}')] bg-cover bg-center bg-no-repeat`;
    }
    return 'bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full bg-white/95 backdrop-blur-md border border-yellow-200/50 dark:border-yellow-600/50">
        <DialogTitle className="text-yellow-800 dark:text-yellow-200 font-bold text-xl">
          Chat Wallpaper
        </DialogTitle>
        <DialogDescription className="text-yellow-600 dark:text-yellow-400">
          Choose a wallpaper for your chat background
        </DialogDescription>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wallpaper Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Predefined Wallpapers</h3>
            <div className="grid grid-cols-2 gap-3">
              {predefinedWallpapers.map((wallpaper) => (
                <div
                  key={wallpaper.id}
                  className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                    selectedWallpaper === wallpaper.value
                      ? 'border-yellow-500 ring-2 ring-yellow-300'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                  onClick={() => handleWallpaperSelect(wallpaper)}
                >
                  <div className={`w-full h-24 ${wallpaper.preview}`} />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 text-center">
                    {wallpaper.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Image Upload */}
            <div className="space-y-3">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Custom Image</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border-2 border-yellow-200 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                {customImageUrl && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCustomImageUrl('');
                      setSelectedWallpaper('default');
                    }}
                    className="border-2 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomImageUpload}
                className="hidden"
              />
              {customImageUrl && (
                <div className="relative rounded-xl overflow-hidden border-2 border-yellow-500 ring-2 ring-yellow-300">
                  <img
                    src={customImageUrl}
                    alt="Custom wallpaper"
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 text-center">
                    Custom Image
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Preview</h3>
            <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 h-64">
              {selectedWallpaper === 'default' || selectedWallpaper.startsWith('bg-') ? (
                <div className={`absolute inset-0 ${getCurrentWallpaper()}`} />
              ) : null}
              {(selectedWallpaper.startsWith('data:') || selectedWallpaper.startsWith('http')) && (
                <img
                  src={selectedWallpaper}
                  alt="Wallpaper preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              
              {/* Simulated chat interface */}
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-300 rounded w-20 mb-1" />
                    <div className="h-2 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/90 backdrop-blur-md rounded-lg p-2 mb-2">
                  <div className="h-3 bg-gray-300 rounded w-32 mb-1" />
                  <div className="h-2 bg-gray-200 rounded w-24" />
                </div>
                <div className="bg-yellow-100/90 backdrop-blur-md rounded-lg p-2 ml-8">
                  <div className="h-3 bg-yellow-300 rounded w-28 mb-1" />
                  <div className="h-2 bg-yellow-200 rounded w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between space-x-3 pt-4 border-t border-yellow-200/50 dark:border-yellow-600/50">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
          >
            Reset to Default
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-2 border-yellow-200 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold shadow-lg"
            >
              Apply Wallpaper
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WallpaperPicker; 