import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { ArrowLeft, Phone, Video, Settings, Send, Mic, Camera, File, Smile, Paperclip, Image as ImageIcon } from 'lucide-react';
import MessageBubble from './MessageBubble';
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
  const { chats, messages, addMessage } = useChatStore();
  const { user } = useAuthStore();
  const { addCall, updateCallDuration, updateCallStatus } = useCallStore();
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
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100" onClick={() => handleStartCall('audio')} disabled={chat.isGroup} title={chat.isGroup ? 'Calls only available in 1:1 chats' : 'Start voice call'}>
                <Phone className="w-5 h-5 text-green-600" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100" onClick={() => handleStartCall('video')} disabled={chat.isGroup} title={chat.isGroup ? 'Calls only available in 1:1 chats' : 'Start video call'}>
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
              currentUserId={user?.id}
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
      <CallDialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <CallDialogContent className="flex flex-col items-center space-y-4 max-w-md w-full">
          <CallDialogTitle>{callType === 'video' ? 'Video Call' : 'Voice Call'}</CallDialogTitle>
          <CallDialogDescription>
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
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-32 h-32 bg-black rounded-lg border" />
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-48 h-48 bg-black rounded-lg border" />
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                    <Phone className="w-10 h-10 text-green-600" />
                  </div>
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={displayAvatar} />
                      <AvatarFallback>{(displayName || '').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                </>
              )}
            </div>
            {callStatus === 'connecting' && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Connecting to {displayName}...</p>
              </div>
            )}
            <Button onClick={handleEndCall} className="mt-4 bg-red-500 hover:bg-red-600 text-white">End Call</Button>
          </div>
        </CallDialogContent>
      </CallDialog>
      <CallDialog open={incomingCallDialogOpen} onOpenChange={setIncomingCallDialogOpen}>
        <CallDialogContent className="flex flex-col items-center space-y-4 max-w-md w-full">
          <CallDialogTitle>Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</CallDialogTitle>
          <CallDialogDescription>
            {displayName} is calling you...
          </CallDialogDescription>
          <div className="w-full flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
              <Avatar className="w-16 h-16">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback>{(displayName || '').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex space-x-4">
              <Button onClick={handleAcceptCall} className="bg-green-500 hover:bg-green-600 text-white px-6">
                Accept
              </Button>
              <Button onClick={handleRejectCall} className="bg-red-500 hover:bg-red-600 text-white px-6">
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
