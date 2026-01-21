'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceInputOptions {
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (error: string) => void;
}

interface VoiceInputState {
  isListening: boolean;
  isConnecting: boolean;
  interimText: string;
  finalText: string;
  error: string | null;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { onInterimResult, onFinalResult, onError } = options;

  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    isConnecting: false,
    interimText: '',
    finalText: '',
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const tokenRef = useRef<{ token: string; expireTime: number } | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        // Send stop command before closing
        // Aliyun requires message_id and task_id without dashes (32 hex chars)
        const stopMessage = JSON.stringify({
          header: {
            message_id: crypto.randomUUID().replace(/-/g, ''),
            task_id: crypto.randomUUID().replace(/-/g, ''),
            namespace: 'SpeechTranscriber',
            name: 'StopTranscription',
            appkey: process.env.NEXT_PUBLIC_ALIYUN_ASR_APP_KEY,
          }
        });
        wsRef.current.send(stopMessage);
      }
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Get or refresh token
  const getToken = useCallback(async (): Promise<string> => {
    // Check if we have a valid cached token
    if (tokenRef.current && tokenRef.current.expireTime > Date.now() + 60000) {
      return tokenRef.current.token;
    }

    // Fetch new token from our API
    const response = await fetch('/api/speech/token');
    if (!response.ok) {
      throw new Error('Failed to get ASR token');
    }
    const data = await response.json();
    tokenRef.current = {
      token: data.token,
      expireTime: data.expireTime,
    };
    return data.token;
  }, []);

  // Convert Float32Array to Int16Array (PCM)
  const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  // Start listening
  const startListening = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Get token
      const token = await getToken();

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        }
      });
      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Connect to Aliyun ASR WebSocket
      const wsUrl = `wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send start transcription command
        const appKey = process.env.NEXT_PUBLIC_ALIYUN_ASR_APP_KEY;
        // Aliyun requires message_id and task_id without dashes (32 hex chars)
        const messageId = crypto.randomUUID().replace(/-/g, '');
        const taskId = crypto.randomUUID().replace(/-/g, '');
        const startMessage = JSON.stringify({
          header: {
            message_id: messageId,
            task_id: taskId,
            namespace: 'SpeechTranscriber',
            name: 'StartTranscription',
            appkey: appKey,
          },
          payload: {
            format: 'pcm',
            sample_rate: 16000,
            enable_intermediate_result: true,
            enable_punctuation_prediction: true,
            enable_inverse_text_normalization: true,
          }
        });
        ws.send(startMessage);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const name = message.header?.name;

          if (name === 'TranscriptionStarted') {
            // Start sending audio
            setState(prev => ({ ...prev, isConnecting: false, isListening: true }));

            // Setup audio processing
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (ws.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = floatTo16BitPCM(inputData);
                ws.send(pcmData.buffer);
              }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
          } else if (name === 'TranscriptionResultChanged') {
            // Interim result
            const text = message.payload?.result || '';
            setState(prev => ({ ...prev, interimText: text }));
            onInterimResult?.(text);
          } else if (name === 'SentenceEnd') {
            // Final result for a sentence
            const text = message.payload?.result || '';
            setState(prev => ({
              ...prev,
              finalText: prev.finalText + text,
              interimText: '',
            }));
            onFinalResult?.(text);
          } else if (name === 'TranscriptionCompleted') {
            // Transcription finished
            cleanup();
            setState(prev => ({ ...prev, isListening: false, isConnecting: false }));
          } else if (name === 'TaskFailed') {
            const errorMsg = message.header?.status_text || message.payload?.status_text || 'ASR failed';
            setState(prev => ({ ...prev, error: errorMsg, isListening: false, isConnecting: false }));
            onError?.(errorMsg);
            cleanup();
          }
        } catch (e) {
          console.error('Failed to parse ASR message:', e);
        }
      };

      ws.onerror = () => {
        const errorMsg = 'WebSocket connection failed';
        setState(prev => ({ ...prev, error: errorMsg, isListening: false, isConnecting: false }));
        onError?.(errorMsg);
        cleanup();
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, isListening: false, isConnecting: false }));
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start voice input';
      setState(prev => ({ ...prev, error: errorMsg, isListening: false, isConnecting: false }));
      onError?.(errorMsg);
      cleanup();
    }
  }, [getToken, cleanup, onInterimResult, onFinalResult, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    cleanup();
    setState(prev => ({ ...prev, isListening: false, isConnecting: false }));
  }, [cleanup]);

  // Reset state
  const reset = useCallback(() => {
    cleanup();
    setState({
      isListening: false,
      isConnecting: false,
      interimText: '',
      finalText: '',
      error: null,
    });
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    startListening,
    stopListening,
    reset,
    isSupported: typeof navigator !== 'undefined' && 'mediaDevices' in navigator,
  };
}
