import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Move, Type, Palette, Upload, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { ref as dbRef, push, set } from 'firebase/database';
import { useAuthStore } from '../../store/authStore';

interface TextPosition {
  x: number;
  y: number;
}

interface StatusCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

const StatusCreator: React.FC<StatusCreatorProps> = ({ open, onOpenChange, onUploadSuccess }) => {
  const [text, setText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#6366f1');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState([48]);
  const [textPosition, setTextPosition] = useState<TextPosition>({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuthStore();

  const backgroundColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', 
    '#10b981', '#06b6d4', '#3b82f6', '#84cc16', '#f97316',
    '#000000', '#ffffff', '#6b7280', '#1f2937'
  ];

  const textColors = [
    '#ffffff', '#000000', '#ef4444', '#10b981', '#3b82f6',
    '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!text.trim()) return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTextPosition({ x, y });
  }, [text]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !text.trim()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setTextPosition({ x, y });
  }, [isDragging, text]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const generateStatusImage = async (): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Set canvas size (9:16 aspect ratio for stories)
    canvas.width = 360;
    canvas.height = 640;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add text
    if (text.trim()) {
      ctx.fillStyle = textColor;
      ctx.font = `bold ${textSize[0]}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Add text shadow for better readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Calculate text position
      const x = (textPosition.x / 100) * canvas.width;
      const y = (textPosition.y / 100) * canvas.height;

      // Word wrap text
      const words = text.split(' ');
      const lineHeight = textSize[0] * 1.2;
      let currentLine = '';
      let currentY = y - (words.length * lineHeight) / 2;

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > canvas.width * 0.8 && currentLine !== '') {
          ctx.fillText(currentLine, x, currentY);
          currentLine = words[i] + ' ';
          currentY += lineHeight;
        } else {
          currentLine = testLine;
        }
      }
      ctx.fillText(currentLine, x, currentY);
    }

    return canvas.toDataURL('image/png');
  };

  const handleCreate = async () => {
    if (!text.trim() || !user?.id) {
      setError('Please enter some text and make sure you are logged in.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const statusId = push(dbRef(db, `status/${user.id}`)).key;
      if (!statusId) {
        throw new Error('Failed to generate status ID');
      }

      // Generate the status image
      const imageDataUrl = await generateStatusImage();
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Upload to Firebase Storage
      const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../../lib/firebase');
      
      const fileRef = storageRef(storage, `status/${user.id}/${statusId}.png`);
      await uploadBytes(fileRef, blob);
      const mediaURL = await getDownloadURL(fileRef);
      
      const timestamp = Date.now();
      
      // Save to database
      await set(dbRef(db, `status/${user.id}/${statusId}`), {
        mediaURL,
        userId: user.id,
        timestamp,
        type: 'text',
        textContent: text,
        backgroundColor,
        textColor,
        textSize: textSize[0],
        textPosition,
      });
      
      setText('');
      setBackgroundColor('#6366f1');
      setTextColor('#ffffff');
      setTextSize([48]);
      setTextPosition({ x: 50, y: 50 });
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      onOpenChange(false);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message || 'Creation failed');
      } else {
        setError('Creation failed');
      }
    }
    setUploading(false);
  };

  const handleClose = () => {
    setText('');
    setBackgroundColor('#6366f1');
    setTextColor('#ffffff');
    setTextSize([48]);
    setTextPosition({ x: 50, y: 50 });
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Type className="w-5 h-5" />
            <span>Create Text Status</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview Area */}
          <div className="space-y-4">
            <Label>Preview</Label>
            <div 
              className="relative w-full aspect-[9/16] rounded-lg overflow-hidden shadow-lg cursor-move"
              style={{ backgroundColor }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {text.trim() && (
                <div
                  className="absolute select-none pointer-events-none"
                  style={{
                    left: `${textPosition.x}%`,
                    top: `${textPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                    color: textColor,
                    fontSize: `${textSize[0]}px`,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                    maxWidth: '80%',
                    wordWrap: 'break-word'
                  }}
                >
                  {text}
                </div>
              )}
              {!text.trim() && (
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                  <div className="text-center">
                    <Move className="w-8 h-8 mx-auto mb-2" />
                    <p>Click and drag to move text</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Text Input */}
            <div className="space-y-2">
              <Label htmlFor="status-text">Your Status Text</Label>
              <Textarea
                id="status-text"
                placeholder="What's on your mind?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={200}
              />
              <div className="text-xs text-gray-500 text-right">
                {text.length}/200
              </div>
            </div>

            <Separator />

            {/* Background Color */}
            <div className="space-y-3">
              <Label>Background Color</Label>
              <div className="grid grid-cols-7 gap-2">
                {backgroundColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      backgroundColor === color 
                        ? 'border-gray-800 scale-110' 
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Text Color */}
            <div className="space-y-3">
              <Label>Text Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {textColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      textColor === color 
                        ? 'border-gray-800 scale-110' 
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setTextColor(color)}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Text Size */}
            <div className="space-y-3">
              <Label>Text Size: {textSize[0]}px</Label>
              <Slider
                value={textSize}
                onValueChange={setTextSize}
                max={80}
                min={20}
                step={2}
                className="w-full"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={!text.trim() || uploading}>
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Create Status
              </>
            )}
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" disabled={uploading} onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>

        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default StatusCreator; 