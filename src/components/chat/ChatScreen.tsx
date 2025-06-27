import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatStore } from '../../store/chatStore';
import { ArrowLeft, Phone, Video, Settings, Send, Mic, Camera, File, Smile, Paperclip, Image as ImageIcon } from 'lucide-react';
import MessageBubble from './MessageBubble';
import type { Message as MessageType } from './MessageBubble';
import { formatDistanceToNow } from 'date-fns';
import { db, storage } from '../../lib/firebase';
import { ref as dbRef, push, onChildAdded } from 'firebase/database';
import { fetchAllUsers } from '../../lib/firebase';
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import IGif from '@giphy/js-types/dist/gif';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Add User type
interface User {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

const GIPHY_API_KEY = 'WANkwV9BDnk1q9dAwHH6hJPW2TCxmEqc'; // TODO: Replace with your actual Giphy API key
const gf = new GiphyFetch(GIPHY_API_KEY);

const ChatScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { chats, messages, addMessage } = useChatStore();
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [firebaseMessages, setFirebaseMessages] = useState<MessageType[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = localStorage.getItem('userId') || 'me';
  const [usersById, setUsersById] = useState<Record<string, User>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [gifSearch, setGifSearch] = useState('');
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recorderState, setRecorderState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingSend, setPendingSend] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const chat = chats.find(c => c.id === id);
  const chatMessages = messages[id || ''] || [];

  useEffect(() => {
    if (!id) return;
    const messagesRef = dbRef(db, `chats/${id}/messages`);
    setFirebaseMessages([]); // reset on chat change
    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      const msg = snapshot.val();
      setFirebaseMessages((prev) => [...prev, { ...msg, id: snapshot.key }]);
    });
    fetchAllUsers().then(users => {
      const map = {};
      users.forEach(u => { map[u.id] = u; });
      setUsersById(map);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [firebaseMessages]);

  useEffect(() => setIsMounted(true), []);

  if (!chat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-600">Chat not found</h2>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const msg = {
        senderId: userId,
        text: newMessage.trim(),
        timestamp: Date.now(),
        type: 'text',
      };
      const messagesRef = dbRef(db, `chats/${id}/messages`);
      await push(messagesRef, msg);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Compute display name and avatar for 1:1 chats
  let displayName = chat.name;
  let displayAvatar = chat.avatar;
  if (!chat.isGroup) {
    displayName = chat.otherUserName || chat.name || chat.otherUserId || 'Unknown';
    displayAvatar = chat.otherUserAvatar || chat.avatar || '';
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (!inputRef.current) return;
    const input = inputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newValue = newMessage.slice(0, start) + emojiData.emoji + newMessage.slice(end);
    setNewMessage(newValue);
    // Move cursor after inserted emoji
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
    }, 0);
  };

  const handleGifSelect = async (gif: IGif) => {
    if (!id) return;
    const msg = {
      senderId: userId,
      text: '',
      gifUrl: gif.images.fixed_height.url,
      timestamp: Date.now(),
      type: 'gif',
    };
    const messagesRef = dbRef(db, `chats/${id}/messages`);
    await push(messagesRef, msg);
    setShowGifPicker(false);
  };

  const startTimer = () => {
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };
  const stopTimer = () => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const handleOpenRecorder = () => {
    setShowRecorder(true);
    setRecorderState('idle');
    setRecordingTime(0);
  };
  const handleCloseRecorder = () => {
    setShowRecorder(false);
    setRecorderState('idle');
    setRecordingTime(0);
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };
  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert('Audio recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setAudioBlob(null);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        stopTimer();
        if (audioChunksRef.current.length) {
          setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        }
      };
      mediaRecorder.start();
      setRecorderState('recording');
      startTimer();
    } catch (err) {
      alert('Could not start audio recording.');
    }
  };
  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecorderState('paused');
      stopTimer();
    }
  };
  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecorderState('recording');
      startTimer();
    }
  };
  const handleDiscardRecording = () => {
    setAudioBlob(null);
    handleCloseRecorder();
  };
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecorderState('idle');
      stopTimer();
    }
  };
  const handleSendRecording = async () => {
    if (!id || !audioBlob) return;
    setIsUploadingAudio(true);
    const fileName = `voice_${Date.now()}.webm`;
    const audioRef = storageRef(storage, `voice_messages/${id}/${fileName}`);
    await uploadBytes(audioRef, audioBlob);
    const audioUrl = await getDownloadURL(audioRef);
    const msg = {
      senderId: userId,
      text: '',
      audioUrl,
      timestamp: Date.now(),
      type: 'audio',
    };
    const messagesRef = dbRef(db, `chats/${id}/messages`);
    await push(messagesRef, msg);
    setIsUploadingAudio(false);
    setAudioBlob(null);
    handleCloseRecorder();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setIsUploadingFile(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const fileType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : 'file';
      const fileRef = storageRef(storage, `chat_files/${id}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);
      const msg = {
        senderId: userId,
        text: '',
        fileUrl,
        fileName: file.name,
        fileType,
        timestamp: Date.now(),
        type: fileType,
      };
      const messagesRef = dbRef(db, `chats/${id}/messages`);
      await push(messagesRef, msg);
    } catch (err) {
      alert('Failed to upload file.');
    }
    setIsUploadingFile(false);
    setSelectedFile(null);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm shadow-xl min-h-screen flex flex-col">
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-3 flex-1">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={displayAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-green-400 text-white">
                    {(displayName || '').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!chat.isGroup && chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-gray-900 truncate">{displayName || 'Unknown'}</h2>
                <p className="text-sm text-gray-500">
                  {chat.isGroup 
                    ? `${chat.members?.length || 0} members`
                    : chat.isOnline 
                      ? 'Online' 
                      : `Last seen ${formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 30), { addSuffix: true })}`
                  }
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
                <Phone className="w-5 h-5 text-green-600" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
                <Video className="w-5 h-5 text-blue-600" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
                <Settings className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {firebaseMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              chat={chat}
              currentUserId={userId}
              usersById={usersById}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100" onClick={() => setShowEmojiPicker(v => !v)}>
              <Smile className="w-5 h-5 text-yellow-500" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100" onClick={() => setShowGifPicker(v => !v)}>
              <ImageIcon className="w-5 h-5 text-pink-500" />
            </Button>
            <label className="p-2 hover:bg-gray-100 rounded cursor-pointer">
              <Paperclip className="w-5 h-5 text-gray-500" />
              <input type="file" className="hidden" onChange={handleFileChange} disabled={isUploadingFile} />
            </label>
            {isUploadingFile && (
              <span className="ml-2 text-xs text-blue-500 animate-pulse">Uploading...</span>
            )}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-full"
              />
            </div>
            {newMessage.trim() ? (
              <Button
                onClick={handleSendMessage}
                className="bg-green-500 hover:bg-green-600 rounded-full p-3"
              >
                <Send className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={handleOpenRecorder}
                disabled={isUploadingAudio}
                className="rounded-full p-3 transition-colors bg-blue-500 hover:bg-blue-600"
              >
                <Mic className="w-5 h-5" />
              </Button>
            )}
          </div>
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 z-50 bg-white shadow-lg rounded-lg p-2">
              {isMounted && (
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={Theme.AUTO}
                  emojiStyle={EmojiStyle.APPLE}
                  width={350}
                  height={400}
                  autoFocusSearch={false}
                />
              )}
            </div>
          )}
          {showGifPicker && (
            <div className="absolute bottom-20 left-20 z-50 bg-white shadow-lg rounded-lg p-2 w-[350px] h-[400px]">
              <input
                type="text"
                value={gifSearch}
                onChange={e => setGifSearch(e.target.value)}
                placeholder="Search GIFs..."
                className="w-full mb-2 px-2 py-1 border rounded"
              />
              <Grid
                fetchGifs={offset => gf.search(gifSearch || 'trending', { offset, limit: 10 })}
                width={320}
                columns={2}
                gutter={6}
                onGifClick={gif => handleGifSelect(gif)}
                hideAttribution
              />
            </div>
          )}
        </div>
      </div>
      <Dialog open={showRecorder} onOpenChange={setShowRecorder}>
        <DialogContent className="max-w-xs w-full flex flex-col items-center space-y-4">
          <DialogTitle>Voice Message</DialogTitle>
          <DialogDescription>Record and send a voice message.</DialogDescription>
          <div className="text-center">
            <div className="text-2xl font-mono mb-4">{`${Math.floor(recordingTime/60).toString().padStart(2,'0')}:${(recordingTime%60).toString().padStart(2,'0')}`}</div>
            {recorderState === 'idle' && (
              <Button onClick={handleStartRecording} className="bg-red-500 hover:bg-red-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Mic className="w-8 h-8 text-white" />
              </Button>
            )}
            {recorderState === 'recording' && (
              <div className="flex flex-col items-center space-y-2">
                <Button onClick={handlePauseRecording} className="bg-yellow-500 hover:bg-yellow-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
                </Button>
                <Button onClick={handleStopRecording} variant="outline" className="mt-2">Stop</Button>
              </div>
            )}
            {recorderState === 'paused' && (
              <div className="flex flex-col items-center space-y-2">
                <Button onClick={handleResumeRecording} className="bg-green-500 hover:bg-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="currentColor" /></svg>
                </Button>
                <Button onClick={handleStopRecording} variant="outline" className="mt-2">Stop</Button>
              </div>
            )}
          </div>
          <div className="flex w-full justify-between space-x-2">
            <Button variant="outline" onClick={handleDiscardRecording} className="flex-1">Discard</Button>
            <Button onClick={handleSendRecording} className="flex-1 bg-green-500 hover:bg-green-600 text-white" disabled={isUploadingAudio || !audioBlob}>
              {isUploadingAudio ? (
                <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              ) : 'Send'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatScreen;
