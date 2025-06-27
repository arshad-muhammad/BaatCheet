import React, { useRef, useState } from 'react';
import { Check, CheckCheck, Star, Reply, Forward, Trash2, File } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  chat: any;
  currentUserId: string;
  usersById: Record<string, any>;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, chat, currentUserId, usersById }) => {
  const isOwnMessage = message.senderId === currentUserId;
  const isGroup = chat.isGroup;
  let senderName = '';
  if (isGroup && usersById && usersById[message.senderId]) {
    senderName = usersById[message.senderId].name || usersById[message.senderId].phone || message.senderId;
  }

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
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
          <div className="font-bold text-blue-600 mb-1 text-xs">{senderName}</div>
        )}
        <div
          className={`rounded-2xl px-4 py-2 shadow-sm break-words ${
            isOwnMessage
              ? 'bg-blue-100 text-blue-900 rounded-br-md'
              : 'bg-gray-50 text-gray-800 rounded-bl-md border border-gray-200'
          }`}
        >
          {message.replyTo && (
            <div className={`text-xs mb-2 pb-2 border-l-2 pl-2 ${
              isOwnMessage ? 'border-blue-200 text-blue-700' : 'border-gray-300 text-gray-600'
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
                className="max-h-60 max-w-full rounded-lg border border-gray-200 shadow-sm"
                loading="lazy"
              />
            </div>
          )}
          {message.fileUrl && message.fileType === 'video' && (
            <div className="my-2 flex justify-center">
              <video
                src={message.fileUrl}
                controls
                className="max-h-60 max-w-full rounded-lg border border-gray-200 shadow-sm"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          {message.fileUrl && message.fileType === 'file' && (
            <div className="my-2 flex items-center space-x-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
              <File className="w-5 h-5 text-blue-500" />
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline break-all"
                download={message.fileName}
              >
                {message.fileName || 'Download file'}
              </a>
            </div>
          )}
          {('audioUrl' in message && message.audioUrl) ? (
            <div className="flex flex-col items-center w-full my-2">
              <div className="flex items-center w-full space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <button
                  onClick={handlePlayPause}
                  className="focus:outline-none"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" /><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" /></svg>
                  ) : (
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="currentColor" /></svg>
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
                  className="flex-1 accent-blue-500 h-1"
                  step="0.01"
                  aria-label="Seek"
                />
                <span className="text-xs text-blue-700 min-w-[40px] text-right">
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
            <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
          )}
          <div className={`flex items-center justify-end space-x-1 mt-1 ${
            isOwnMessage ? 'text-blue-600' : 'text-gray-500'
          }`}>
            <span className="text-xs">
              {formatDistanceToNow(message.timestamp, { addSuffix: false })}
            </span>
            {isOwnMessage && getStatusIcon()}
            {message.isStarred && (
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
            )}
          </div>
        </div>

        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex space-x-1 mt-1">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <div
                key={emoji}
                className="bg-white border border-gray-200 rounded-full px-2 py-1 text-xs flex items-center space-x-1 shadow-sm"
              >
                <span>{emoji}</span>
                <span className="text-gray-600">{users.length}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`absolute top-0 ${
          isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
        } opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex space-x-1`}>
          <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
            <Reply className="w-3 h-3" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
            <Forward className="w-3 h-3" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded text-yellow-600">
            <Star className="w-3 h-3" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded text-red-600">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
