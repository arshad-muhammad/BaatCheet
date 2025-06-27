import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storage, db } from '../../lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set } from 'firebase/database';

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

  const userId = localStorage.getItem('userId');

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
    if (!file || !userId) {
      setError('No file selected or user not logged in.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop();
      const statusId = push(dbRef(db, `status/${userId}`)).key;
      if (!statusId) {
        throw new Error('Failed to generate status ID');
      }
      
      const fileRef = storageRef(storage, `status/${userId}/${statusId}.${ext}`);
      await uploadBytes(fileRef, file);
      const mediaURL = await getDownloadURL(fileRef);
      const timestamp = Date.now();
      
      await set(dbRef(db, `status/${userId}/${statusId}`), {
        mediaURL,
        userId,
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
        </div>
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
      </DialogContent>
    </Dialog>
  );
};

export default StatusUploadDialog; 