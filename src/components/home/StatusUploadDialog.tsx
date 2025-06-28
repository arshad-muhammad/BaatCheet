import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Type } from 'lucide-react';
import { storage, db } from '../../lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set } from 'firebase/database';
import { useAuthStore } from '../../store/authStore';
import StatusCreator from './StatusCreator';

interface StatusUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

const StatusUploadDialog: React.FC<StatusUploadDialogProps> = ({ open, onOpenChange, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('media');
  const { user } = useAuthStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setError(null);
    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user?.id) {
      setError('No file selected or user not logged in.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop();
      const statusId = push(dbRef(db, `status/${user.id}`)).key;
      if (!statusId) {
        throw new Error('Failed to generate status ID');
      }
      
      const fileRef = storageRef(storage, `status/${user.id}/${statusId}.${ext}`);
      await uploadBytes(fileRef, file);
      const mediaURL = await getDownloadURL(fileRef);
      const timestamp = Date.now();
      
      await set(dbRef(db, `status/${user.id}/${statusId}`), {
        mediaURL,
        userId: user.id,
        timestamp,
        type: file.type.startsWith('video') ? 'video' : 'image',
      });
      
      setFile(null);
      setPreview(null);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      onOpenChange(false);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message || 'Upload failed');
      } else {
        setError('Upload failed');
      }
    }
    setUploading(false);
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setActiveTab('media');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Status</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="media" className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Media</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center space-x-2">
              <Type className="w-4 h-4" />
              <span>Text</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="media" className="space-y-4">
            <Input 
              type="file" 
              accept="image/*,video/*" 
              onChange={handleFileChange} 
              disabled={uploading} 
            />
            {preview && (
              <div className="w-full flex justify-center">
                {file?.type.startsWith('video') ? (
                  <video src={preview} controls className="max-h-60 rounded-lg" />
                ) : (
                  <img src={preview} alt="Preview" className="max-h-60 rounded-lg" />
                )}
              </div>
            )}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            
            <DialogFooter>
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" disabled={uploading} onClick={handleClose}>
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="text">
            <StatusCreator 
              open={activeTab === 'text'} 
              onOpenChange={(open) => {
                if (!open) {
                  setActiveTab('media');
                  onOpenChange(false);
                }
              }}
              onUploadSuccess={onUploadSuccess}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StatusUploadDialog; 