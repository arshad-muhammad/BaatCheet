import React, { useRef, useState } from 'react';
import { Check, CheckCheck, Star, Reply, Forward, Trash2, File } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useChatStore } from '../../store/chatStore';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: string;
  reactions?: { [emoji: string]: string[] };
  isStarred?: boolean;
  audioUrl?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
}

interface MessageBubbleProps {
  message: Message;
  chat: {
    id: string;
    name: string;
    isGroup: boolean;
    avatar?: string;
  };
  currentUserId: string;
  usersById: Record<string, {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
    avatar?: string;
  }>;
  chatId: string;
  fontSize?: 'small' | 'medium' | 'large';
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, chat, currentUserId, usersById, chatId, fontSize }) => {
  const { toggleStar } = useChatStore();
  const isOwnMessage = message.senderId === currentUserId;
  const isGroup = chat.isGroup;
  let senderName = '';
  if (isGroup && usersById && usersById[message.senderId]) {
    senderName = usersById[message.senderId].name || usersById[message.senderId].phone || message.senderId;
  }

  const handleStarToggle = () => {
    toggleStar(chatId, message.id);
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-orange-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-pink-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-green-500" />;
      default:
        return null;
    }
  };

  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };
  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };
  const handleAudioPlay = () => setIsPlaying(true);
  const handleAudioPause = () => setIsPlaying(false);

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group py-1`}>
      <div className={`max-w-xs lg:max-w-md relative ${isOwnMessage ? 'ml-8' : 'mr-8'}`}>
        {isGroup && !isOwnMessage && (
          <div className="font-bold text-pink-600 mb-1 text-xs animate-desi-fade">{senderName}</div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 shadow-lg break-words transition-all duration-300 hover:shadow-xl ${
            isOwnMessage
              ? 'bg-gradient-to-br from-orange-100 to-pink-100 text-orange-900 rounded-br-md border border-orange-200'
              : 'bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-900 rounded-bl-md border border-purple-200'
          }`}
        >
          {message.replyTo && (
            <div className={`text-xs mb-2 pb-2 border-l-2 pl-2 ${
              isOwnMessage ? 'border-orange-300 text-orange-700' : 'border-purple-300 text-purple-600'
            }`}>
              Replying to message...
            </div>
          )}
          {/* File/image/video rendering */}
          {message.fileUrl && message.fileType === 'image' && (
            <div className="my-2 flex justify-center">
              <img
                src={message.fileUrl}
                alt={message.fileName || 'Image'}
                className="max-h-60 max-w-full rounded-xl border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300"
                loading="lazy"
              />
            </div>
          )}
          {message.fileUrl && message.fileType === 'video' && (
            <div className="my-2 flex justify-center">
              <video
                src={message.fileUrl}
                controls
                className="max-h-60 max-w-full rounded-xl border-2 border-pink-200 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          {message.fileUrl && message.fileType === 'file' && (
            <div className="my-2 flex items-center space-x-2 bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-200 rounded-xl px-3 py-2 shadow-md">
              <File className="w-5 h-5 text-orange-600" />
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-700 underline break-all font-medium hover:text-pink-700 transition-colors duration-300"
                download={message.fileName}
              >
                {message.fileName || 'Download file'}
              </a>
            </div>
          )}
          {('audioUrl' in message && message.audioUrl) ? (
            <div className="flex flex-col items-center w-full my-2">
              <div className="flex items-center w-full space-x-2 bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-200 rounded-xl px-3 py-2 shadow-md">
                <button
                  onClick={handlePlayPause}
                  className="focus:outline-none hover:scale-110 transition-transform duration-300"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" /><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" /></svg>
                  ) : (
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="currentColor" /></svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={progress}
                  onChange={e => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = Number(e.target.value);
                      setProgress(Number(e.target.value));
                    }
                  }}
                  className="flex-1 accent-orange-500 h-2 rounded-full"
                  step="0.01"
                  aria-label="Seek"
                />
                <span className="text-xs text-orange-700 min-w-[40px] text-right font-medium">
                  {duration
                    ? `${Math.floor(progress/60).toString().padStart(2,'0')}:${Math.floor(progress%60).toString().padStart(2,'0')}`
                    : '00:00'}
                </span>
              </div>
              <audio
                ref={audioRef}
                src={message.audioUrl}
                onPlay={handleAudioPlay}
                onPause={handleAudioPause}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                className="hidden"
                preload="auto"
              />
              <span className="sr-only">Voice message</span>
            </div>
          ) : (
            <p className={`leading-relaxed whitespace-pre-line font-medium ${fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-lg' : 'text-sm'}`}>{message.text}</p>
          )}
          <div className={`flex items-center justify-end space-x-1 mt-2 ${
            isOwnMessage ? 'text-orange-600' : 'text-purple-600'
          }`}>
            <span className="text-xs font-medium">
              {formatDistanceToNow(message.timestamp, { addSuffix: false })}
            </span>
            {isOwnMessage && getStatusIcon()}
            {message.isStarred && (
              <Star className="w-3 h-3 text-yellow-500 fill-current animate-desi-pulse" />
            )}
          </div>
        </div>

        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex space-x-1 mt-1">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <div
                key={emoji}
                className="bg-white/90 backdrop-blur-sm border-2 border-orange-200 rounded-full px-2 py-1 text-xs flex items-center space-x-1 shadow-lg"
              >
                <span>{emoji}</span>
                <span className="text-orange-600 font-medium">{users.length}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`absolute top-0 ${
          isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
        } opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-orange-200 p-2 flex space-x-1`}>
          <button className="p-2 hover:bg-orange-100 rounded-lg text-orange-600 transition-all duration-300 hover:scale-110">
            <Reply className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-pink-100 rounded-lg text-pink-600 transition-all duration-300 hover:scale-110">
            <Forward className="w-4 h-4" />
          </button>
          <button 
            onClick={handleStarToggle}
            className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
              message.isStarred 
                ? 'bg-yellow-100 text-yellow-600' 
                : 'hover:bg-yellow-100 text-yellow-600'
            }`}
          >
            <Star className={`w-4 h-4 ${message.isStarred ? 'fill-current' : ''}`} />
          </button>
          <button className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-all duration-300 hover:scale-110">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
