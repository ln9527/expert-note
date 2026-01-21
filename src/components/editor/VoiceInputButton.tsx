'use client';

import React from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceInputButton({
  onTranscript,
  onInterimTranscript,
  disabled = false,
  className = '',
}: VoiceInputButtonProps) {
  const {
    isListening,
    isConnecting,
    interimText,
    error,
    startListening,
    stopListening,
    isSupported,
  } = useVoiceInput({
    onFinalResult: (text) => {
      onTranscript(text);
    },
    onInterimResult: (text) => {
      onInterimTranscript?.(text);
    },
  });

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={`p-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed ${className}`}
        title="Voice input not supported in this browser"
      >
        <MicOffIcon />
      </button>
    );
  }

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isConnecting}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${isListening
            ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          ${(disabled || isConnecting) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        title={isListening ? 'Stop recording' : 'Start voice input (Chinese/English)'}
      >
        {isConnecting ? (
          <LoadingIcon />
        ) : isListening ? (
          <MicActiveIcon />
        ) : (
          <MicIcon />
        )}
      </button>

      {/* Interim text indicator */}
      {isListening && interimText && (
        <span className="ml-2 text-xs text-gray-500 italic max-w-[150px] truncate">
          {interimText}
        </span>
      )}

      {/* Error indicator */}
      {error && (
        <span className="ml-2 text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}

// Icons
function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicActiveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
