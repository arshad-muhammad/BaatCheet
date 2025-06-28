import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ArrowLeft, Phone, Video, Settings, Send, Mic, Camera, File, Smile, Paperclip, Image as ImageIcon, MoreVertical, MessageCircle, Palette } from 'lucide-react';
import MessageBubble from './MessageBubble';
import WallpaperPicker from './WallpaperPicker';
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
import Peer from 'peerjs';
import { Dialog as CallDialog, DialogContent as CallDialogContent, DialogTitle as CallDialogTitle, DialogDescription as CallDialogDescription } from '@/components/ui/dialog';

// Add User type
interface User {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

// Add Message type
interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  type: 'text' | 'gif' | 'audio' | 'file';
  status?: 'sent' | 'delivered' | 'read';
  gifUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
}

const GIPHY_API_KEY = 'WANkwV9BDnk1q9dAwHH6hJPW2TCxmEqc'; // TODO: Replace with your actual Giphy API key
const gf = new GiphyFetch(GIPHY_API_KEY);

const ChatScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { chats, messages, addMessage, syncFirebaseMessages } = useChatStore();
  const { user } = useAuthStore();
  const { addCall, updateCallDuration, updateCallStatus } = useCallStore();
  const { chat: chatSettings, updateChat } = useSettingsStore();
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [firebaseMessages, setFirebaseMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  const [peer, setPeer] = useState<Peer | null>(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [incomingCallDialogOpen, setIncomingCallDialogOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Peer.MediaConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [callObj, setCallObj] = useState<Peer.MediaConnection | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const peerSetupRef = useRef(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);

  const chat = chats.find(c => c.id === id);
  const chatMessages = messages[id || ''] || [];

  // Get wallpaper style
  const getWallpaperStyle = () => {
    if (!chatSettings?.wallpaper || chatSettings.wallpaper === 'default') {
      return 'bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900';
    }
    if (chatSettings.wallpaper.startsWith('bg-')) {
      return chatSettings.wallpaper;
    }
    return 'bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900';
  };

  // Get wallpaper inline style for custom images
  const getWallpaperInlineStyle = () => {
    if (chatSettings?.wallpaper && (chatSettings.wallpaper.startsWith('data:') || chatSettings.wallpaper.startsWith('http'))) {
      return {
        backgroundImage: `url('${chatSettings.wallpaper}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    return {};
  };

  useEffect(() => {
    if (!id) return;
    const messagesRef = dbRef(db, `chats/${id}/messages`);
    setFirebaseMessages([]); // reset on chat change
    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      const msg = snapshot.val();
      const messageWithId = { ...msg, id: snapshot.key };
      setFirebaseMessages((prev) => [...prev, messageWithId]);
    });
    fetchAllUsers().then(users => {
      const map = {};
      users.forEach(u => { map[u.id] = u; });
      setUsersById(map);
    });
    return () => unsubscribe();
  }, [id]);

  // Sync Firebase messages with local store when firebaseMessages changes
  useEffect(() => {
    if (id && firebaseMessages.length > 0 && isMounted) {
      syncFirebaseMessages(id, firebaseMessages);
    }
  }, [firebaseMessages, id, isMounted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [firebaseMessages]);

  useEffect(() => setIsMounted(true), []);

  // Setup PeerJS on mount
  useEffect(() => {
    if (!user?.id || peerSetupRef.current) return;
    
    // Use userId as peer ID for coordination
    const peerId = user.id;
    
    // Check if we already have a peer instance and destroy it
    if (peer) {
      peer.destroy();
    }
    
    const p = new Peer(peerId, { 
      debug: 1,
      config: {
        'iceServers': [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ]
      }
    });
    
    setPeer(p);
    peerSetupRef.current = true;
    
    p.on('open', (id) => {
      console.log('PeerJS connected with ID:', id);
      // Store the actual peer ID in localStorage for coordination
      localStorage.setItem('peerId', id);
    });
    
    p.on('error', (err) => {
      console.error('PeerJS error:', err);
      // Handle different error types
      if (err.type === 'peer-unavailable') {
        console.log('Peer unavailable, this is normal for outgoing calls');
      } else if (err.type === 'unavailable-id') {
        console.log('ID already taken, trying with timestamp');
        // If ID is taken, try with timestamp
        const newPeerId = `${user.id}_${Date.now()}`;
        const newPeer = new Peer(newPeerId, { 
          debug: 1,
          config: {
            'iceServers': [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
              }
            ]
          }
        });
        setPeer(newPeer);
      }
    });
    
    p.on('call', (call) => {
      console.log('Incoming call received from:', call.peer);
      // Incoming call - show accept/reject dialog
      setIncomingCall(call);
      setCallType(call.metadata?.type === 'video' ? 'video' : 'audio');
      setIncomingCallDialogOpen(true);
    });
    
    return () => {
      if (p) {
        p.destroy();
      }
      peerSetupRef.current = false;
    };
  }, [user?.id]);

  // Attach streams to video and audio elements
  useEffect(() => {
    console.log('[Audio Debug] Stream attachment effect triggered');
    console.log('[Audio Debug] Local stream:', localStream);
    console.log('[Audio Debug] Remote stream:', remoteStream);
    
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log('[Audio Debug] Local video stream attached');
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log('[Audio Debug] Remote video stream attached');
    }
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
      console.log('[Audio Debug] Local audio stream attached');
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      console.log('[Audio Debug] Remote audio stream attached');
      // Ensure the audio element is playing
      remoteAudioRef.current.play().catch(e => {
        console.error('[Audio Debug] Failed to play remote audio:', e);
      });
    }
  }, [localStream, remoteStream, callDialogOpen]);

  const handleAcceptCall = async () => {
    if (!incomingCall || !user?.id) return;
    setIncomingCallDialogOpen(false);
    setCallDialogOpen(true);
    
    // Record the incoming call
    const callId = addCall({
      userId: user.id,
      otherUserId: incomingCall.peer,
      otherUserName: displayName || 'Unknown',
      otherUserAvatar: displayAvatar,
      type: 'incoming',
      callType: callType === 'video' ? 'video' : 'voice',
      missed: false,
      status: 'completed'
    });
    setCurrentCallId(callId);
    callStartTimeRef.current = Date.now();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true,
      });
      setLocalStream(stream);
      incomingCall.answer(stream);
      setCallObj(incomingCall);
      incomingCall.on('stream', (remoteStream: MediaStream) => {
        console.log('[Audio Debug] Remote stream received');
        console.log('[Audio Debug] Remote stream tracks:', remoteStream.getTracks());
        console.log('[Audio Debug] Remote stream has audio:', remoteStream.getAudioTracks().length > 0);
        setRemoteStream(remoteStream);
        setCallStatus('connected');
      });
      incomingCall.on('close', () => {
        setCallDialogOpen(false);
        setRemoteStream(null);
        setLocalStream(null);
        setCallObj(null);
        
        // Update call duration and status
        if (currentCallId && callStartTimeRef.current) {
          const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
          updateCallDuration(currentCallId, duration);
          updateCallStatus(currentCallId, 'completed');
        }
        setCurrentCallId(null);
        callStartTimeRef.current = null;
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      setIncomingCallDialogOpen(false);
      
      // Update call status to failed
      if (currentCallId) {
        updateCallStatus(currentCallId, 'failed');
      }
      setCurrentCallId(null);
      callStartTimeRef.current = null;
    }
  };

  const handleRejectCall = () => {
    if (!incomingCall || !user?.id) return;
    
    // Record the missed incoming call
    addCall({
      userId: user.id,
      otherUserId: incomingCall.peer,
      otherUserName: displayName || 'Unknown',
      otherUserAvatar: displayAvatar,
      type: 'incoming',
      callType: callType === 'video' ? 'video' : 'voice',
      missed: true,
      status: 'missed'
    });
    
    if (incomingCall) {
      incomingCall.close();
    }
    setIncomingCallDialogOpen(false);
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    if (callObj) callObj.close();
    setCallDialogOpen(false);
    setRemoteStream(null);
    setLocalStream(null);
    setCallObj(null);
    
    // Update call duration and status
    if (currentCallId && callStartTimeRef.current) {
      const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      updateCallDuration(currentCallId, duration);
      updateCallStatus(currentCallId, 'completed');
    }
    setCurrentCallId(null);
    callStartTimeRef.current = null;
  };

  if (!chat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
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
    if (newMessage.trim() && user?.id) {
      const msg = {
        senderId: user.id,
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
    if (!id || !user?.id) return;
    const msg = {
      senderId: user.id,
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
      senderId: user?.id,
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
        senderId: user?.id,
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

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!user?.id) {
      alert('Please log in to make calls.');
      return;
    }
    if (!chat || chat.isGroup) {
      alert('Calls are only available in 1:1 chats.');
      return;
    }
    if (!chat.otherUserId) {
      alert('Unable to identify the other user. Please try again.');
      return;
    }
    if (!peer) {
      alert('Call service is not ready. Please wait a moment and try again.');
      return;
    }
    try {
      setCallType(type);
      setCallStatus('connecting');
      setCallDialogOpen(true);
      const otherUserId = chat.otherUserId;
      
      // Record the outgoing call
      const callId = addCall({
        userId: user.id,
        otherUserId: otherUserId,
        otherUserName: displayName || 'Unknown',
        otherUserAvatar: displayAvatar,
        type: 'outgoing',
        callType: type === 'video' ? 'video' : 'voice',
        missed: false,
        status: 'completed'
      });
      setCurrentCallId(callId);
      callStartTimeRef.current = Date.now();
      
      console.log('Starting call to:', otherUserId);
      console.log('Current peer ID:', peer.id);
      
      // Request media permissions first
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true,
        });
        console.log('Media permissions granted');
      } catch (mediaError) {
        console.error('Media permission error:', mediaError);
        setCallStatus('failed');
        setCallDialogOpen(false);
        // Update call status to failed
        if (currentCallId) {
          updateCallStatus(currentCallId, 'failed');
        }
        // Show a more actionable error message
        if (mediaError && typeof mediaError === 'object' && 'name' in mediaError) {
          switch ((mediaError as any).name) {
            case 'NotAllowedError':
              alert('Camera/microphone access was denied. Please allow permissions in your browser settings and try again.');
              break;
            case 'NotFoundError':
              alert('No camera or microphone found. Please check your device and try again.');
              break;
            case 'NotReadableError':
              alert('Camera or microphone is already in use by another application.');
              break;
            default:
              alert('Failed to access camera/microphone. Please check your permissions and device.');
          }
        } else {
          alert('Failed to access camera/microphone. Please check your permissions and device.');
        }
        return;
      }
      setLocalStream(stream);
      // Make the call
      const call = peer.call(otherUserId, stream, { metadata: { type } });
      setCallObj(call);
      
      call.on('stream', (remoteStream: MediaStream) => {
        console.log('[Audio Debug] Remote stream received');
        console.log('[Audio Debug] Remote stream tracks:', remoteStream.getTracks());
        console.log('[Audio Debug] Remote stream has audio:', remoteStream.getAudioTracks().length > 0);
        setRemoteStream(remoteStream);
        setCallStatus('connected');
      });
      
      call.on('close', () => {
        console.log('Call ended');
        setCallStatus('idle');
        setCallDialogOpen(false);
        setRemoteStream(null);
        setLocalStream(null);
        setCallObj(null);
        
        // Update call duration and status
        if (currentCallId && callStartTimeRef.current) {
          const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
          updateCallDuration(currentCallId, duration);
          updateCallStatus(currentCallId, 'completed');
        }
        setCurrentCallId(null);
        callStartTimeRef.current = null;
      });
      
      call.on('error', (err) => {
        console.error('Call error:', err);
        setCallStatus('failed');
        setCallDialogOpen(false);
        setRemoteStream(null);
        setLocalStream(null);
        setCallObj(null);
        
        // Update call status to failed
        if (currentCallId) {
          updateCallStatus(currentCallId, 'failed');
        }
        setCurrentCallId(null);
        callStartTimeRef.current = null;
        
        if (err.type === 'peer-unavailable') {
          alert('The other user is not available for calls right now.');
        } else {
          alert('Call failed. The other user might not be online or available.');
        }
      });
      
      // Add a timeout to handle cases where the call doesn't connect
      setTimeout(() => {
        if (callStatus === 'connecting' && callObj === call) {
          console.log('Call timeout - no response from peer');
          setCallStatus('failed');
          setCallDialogOpen(false);
          setRemoteStream(null);
          setLocalStream(null);
          setCallObj(null);
          call.close();
          
          // Update call status to failed
          if (currentCallId) {
            updateCallStatus(currentCallId, 'failed');
          }
          setCurrentCallId(null);
          callStartTimeRef.current = null;
          
          alert('Call timed out. The other user might not be online.');
        }
      }, 15000); // 15 second timeout
      
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('failed');
      setCallDialogOpen(false);
      setRemoteStream(null);
      setLocalStream(null);
      setCallObj(null);
      
      // Update call status to failed
      if (currentCallId) {
        updateCallStatus(currentCallId, 'failed');
      }
      setCurrentCallId(null);
      callStartTimeRef.current = null;
      
      if (error instanceof Error) {
        alert(`Call error: ${error.message}`);
      } else {
        alert('Failed to start call. Please try again.');
      }
    }
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
      
      <div className="w-full max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl min-h-screen flex flex-col relative z-10 border-l border-r border-white/20 dark:border-gray-700/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-100/95 via-amber-100/95 to-orange-100/95 dark:from-gray-800/95 dark:via-gray-700/95 dark:to-gray-800/95 backdrop-blur-md border-b border-yellow-200/50 dark:border-gray-600/50 p-3 sm:p-4 shadow-lg">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-1.5 sm:p-2 hover:bg-yellow-200/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
            </Button>

            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="relative group flex-shrink-0">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-yellow-200 dark:ring-yellow-600 hover:ring-amber-300 dark:hover:ring-amber-400 transition-all duration-300 group-hover:scale-110 shadow-lg">
                  <AvatarImage src={displayAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 dark:from-yellow-500 dark:via-amber-500 dark:to-orange-500 text-white font-bold text-sm sm:text-base">
                    {(displayName || '').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!chat.isGroup && chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-green-400 to-emerald-400 border-2 border-white rounded-full animate-desi-pulse"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-yellow-800 dark:text-yellow-200 truncate text-base sm:text-lg">{displayName || 'Unknown'}</h2>
                <p className="text-xs sm:text-sm text-yellow-600/80 dark:text-yellow-400/80 font-medium truncate">
                  {chat.isGroup 
                    ? `${chat.members?.length || 0} members`
                    : chat.isOnline 
                      ? 'Online' 
                      : `Last seen ${formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 30), { addSuffix: true })}`
                  }
                </p>
              </div>
            </div>

            <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 sm:p-3 hover:bg-green-200/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover" 
                onClick={() => handleStartCall('audio')} 
                disabled={chat.isGroup} 
                title={chat.isGroup ? 'Calls only available in 1:1 chats' : 'Start voice call'}
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 sm:p-3 hover:bg-indigo-200/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover" 
                onClick={() => handleStartCall('video')} 
                disabled={chat.isGroup} 
                title={chat.isGroup ? 'Calls only available in 1:1 chats' : 'Start video call'}
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 sm:p-3 hover:bg-purple-200/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover"
                onClick={() => setShowWallpaperPicker(true)}
                title="Change wallpaper"
              >
                <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 sm:p-3 hover:bg-pink-200/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          className={`flex-1 overflow-y-auto p-4 space-y-4 ${getWallpaperStyle()}`}
          style={chatSettings?.wallpaper && (chatSettings.wallpaper.startsWith('data:') || chatSettings.wallpaper.startsWith('http')) ? {
            backgroundImage: `url('${chatSettings.wallpaper}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : {}}
        >
          {firebaseMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              chat={chat}
              currentUserId={user?.id}
              usersById={usersById}
              chatId={id || ''}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-gradient-to-r from-yellow-100/95 via-amber-100/95 to-orange-100/95 dark:from-gray-800/95 dark:via-gray-700/95 dark:to-gray-800/95 backdrop-blur-md border-t border-yellow-200/50 dark:border-gray-600/50 p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-3 hover:bg-yellow-200/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover" 
              onClick={() => setShowEmojiPicker(v => !v)}
            >
              <Smile className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-3 hover:bg-pink-200/50 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-300 hover:scale-110 desi-button-hover" 
              onClick={() => setShowGifPicker(v => !v)}
            >
              <ImageIcon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </Button>
            <label className="p-3 hover:bg-purple-200/50 rounded-xl cursor-pointer transition-all duration-300 hover:scale-110 desi-button-hover">
              <Paperclip className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <input type="file" className="hidden" onChange={handleFileChange} disabled={isUploadingFile} />
            </label>
            {isUploadingFile && (
              <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium animate-desi-pulse">Uploading...</span>
            )}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-12 border-2 border-yellow-200 dark:border-yellow-600 focus:border-orange-400 dark:focus:border-orange-400 focus:ring-orange-400 dark:focus:ring-orange-400 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm transition-all duration-300 hover:border-yellow-300 focus:bg-white dark:focus:bg-gray-600 shadow-lg desi-button-hover"
              />
            </div>
            {newMessage.trim() ? (
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-full p-3 transition-all duration-300 hover:scale-110 shadow-lg desi-button-hover"
              >
                <Send className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={handleOpenRecorder}
                disabled={isUploadingAudio}
                className="rounded-full p-3 transition-all duration-300 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 hover:scale-110 shadow-lg desi-button-hover"
              >
                <Mic className="w-5 h-5" />
              </Button>
            )}
          </div>
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 z-50 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-3 border border-yellow-200/50 dark:border-yellow-600/50">
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
            <div className="absolute bottom-20 left-20 z-50 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-3 w-[350px] h-[400px] border border-pink-200/50">
              <input
                type="text"
                value={gifSearch}
                onChange={e => setGifSearch(e.target.value)}
                placeholder="Search GIFs..."
                className="w-full mb-2 px-3 py-2 border-2 border-pink-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300"
              />
              <Grid
                fetchGifs={offset => gf.search(gifSearch || 'trending', { offset, limit: 10 })}
                width={320}
                columns={2}
                gutter={6}
                onGifClick={(gif, e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleGifSelect(gif);
                }}
                hideAttribution
              />
            </div>
          )}
        </div>
      </div>

      {/* Wallpaper Picker Dialog */}
      <WallpaperPicker 
        open={showWallpaperPicker} 
        onOpenChange={setShowWallpaperPicker} 
      />
      
      {/* Voice Recorder Dialog */}
      <Dialog open={showRecorder} onOpenChange={setShowRecorder}>
        <DialogContent className="max-w-xs w-full flex flex-col items-center space-y-4 bg-white/95 backdrop-blur-md border border-yellow-200/50 dark:border-yellow-600/50">
          <DialogTitle className="text-yellow-800 dark:text-yellow-200 font-bold">Voice Message</DialogTitle>
          <DialogDescription className="text-yellow-600 dark:text-yellow-400">Record and send a voice message.</DialogDescription>
          <div className="text-center">
            <div className="text-2xl font-mono mb-4 text-yellow-700 dark:text-yellow-300 font-bold">{`${Math.floor(recordingTime/60).toString().padStart(2,'0')}:${(recordingTime%60).toString().padStart(2,'0')}`}</div>
            {recorderState === 'idle' && (
              <Button onClick={handleStartRecording} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-lg desi-button-hover">
                <Mic className="w-8 h-8 text-white" />
              </Button>
            )}
            {recorderState === 'recording' && (
              <div className="flex flex-col items-center space-y-2">
                <Button onClick={handlePauseRecording} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto animate-desi-pulse shadow-lg desi-button-hover">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
                </Button>
                <Button onClick={handleStopRecording} variant="outline" className="mt-2 border-2 border-yellow-200 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 font-bold">Stop</Button>
              </div>
            )}
            {recorderState === 'paused' && (
              <div className="flex flex-col items-center space-y-2">
                <Button onClick={handleResumeRecording} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-lg desi-button-hover">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="currentColor" /></svg>
                </Button>
                <Button onClick={handleStopRecording} variant="outline" className="mt-2 border-2 border-yellow-200 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 font-bold">Stop</Button>
              </div>
            )}
          </div>
          <div className="flex w-full justify-between space-x-2">
            <Button variant="outline" onClick={handleDiscardRecording} className="flex-1 border-2 border-red-200 text-red-700 hover:bg-red-50 font-bold">Discard</Button>
            <Button onClick={handleSendRecording} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold shadow-lg desi-button-hover" disabled={isUploadingAudio || !audioBlob}>
              {isUploadingAudio ? (
                <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              ) : 'Send'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Call Dialog */}
      <CallDialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <CallDialogContent className="flex flex-col items-center space-y-4 max-w-md w-full bg-white/95 backdrop-blur-md border border-yellow-200/50 dark:border-yellow-600/50">
          <CallDialogTitle className="text-yellow-800 dark:text-yellow-200 font-bold">{callType === 'video' ? 'Video Call' : 'Voice Call'}</CallDialogTitle>
          <CallDialogDescription className="text-yellow-600 dark:text-yellow-400">
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'connected' && (callType === 'video' ? 'Video call in progress' : 'Voice call in progress')}
            {callStatus === 'failed' && 'Call failed'}
          </CallDialogDescription>
          {/* Hidden audio elements for voice calls */}
          <audio ref={localAudioRef} autoPlay muted playsInline />
          <audio ref={remoteAudioRef} autoPlay playsInline />
          <div className="w-full flex flex-col items-center">
            <div className="flex flex-col items-center space-y-2 w-full">
              {callType === 'video' ? (
                <>
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-32 h-32 bg-black rounded-2xl border-2 border-yellow-200 dark:border-yellow-600 shadow-lg" />
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-48 h-48 bg-black rounded-2xl border-2 border-pink-200 shadow-lg" />
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center mb-2 shadow-lg border-2 border-yellow-200 dark:border-yellow-600">
                    <Phone className="w-10 h-10 text-green-600" />
                  </div>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-2 shadow-lg border-2 border-amber-200 dark:border-amber-600">
                    <Avatar className="w-16 h-16 ring-2 ring-white">
                      <AvatarImage src={displayAvatar} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-400 text-white font-bold">{(displayName || '').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                </>
              )}
            </div>
            {callStatus === 'connecting' && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 font-medium">Connecting to {displayName}...</p>
              </div>
            )}
            <Button onClick={handleEndCall} className="mt-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold shadow-lg desi-button-hover">End Call</Button>
          </div>
        </CallDialogContent>
      </CallDialog>
      
      {/* Incoming Call Dialog */}
      <CallDialog open={incomingCallDialogOpen} onOpenChange={setIncomingCallDialogOpen}>
        <CallDialogContent className="flex flex-col items-center space-y-4 max-w-md w-full bg-white/95 backdrop-blur-md border border-yellow-200/50">
          <CallDialogTitle className="text-yellow-800 dark:text-yellow-200 font-bold">Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</CallDialogTitle>
          <CallDialogDescription className="text-yellow-600 dark:text-yellow-400">
            {displayName} is calling you...
          </CallDialogDescription>
          <div className="w-full flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center shadow-lg border-2 border-pink-200 animate-desi-pulse">
              <Avatar className="w-16 h-16 ring-2 ring-white">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-400 text-white font-bold">{(displayName || '').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex space-x-4">
              <Button onClick={handleAcceptCall} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 font-bold shadow-lg desi-button-hover">
                Accept
              </Button>
              <Button onClick={handleRejectCall} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 font-bold shadow-lg desi-button-hover">
                Reject
              </Button>
            </div>
          </div>
        </CallDialogContent>
      </CallDialog>
    </div>
  );
};

export default ChatScreen;
