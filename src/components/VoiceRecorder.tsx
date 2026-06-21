import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2, Trash2 } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      const startTime = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setDuration(0);
      };

      mediaRecorder.start(100);
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(Math.floor((Date.now() - startTime) / 1000)), 100);
    } catch {
      // permission denied or no mic
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const cancel = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setAudioBlob(null);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
  }, [audioUrl]);

  const send = useCallback(() => {
    if (audioBlob) onSend(audioBlob);
    setAudioBlob(null);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
  }, [audioBlob, audioUrl, onSend]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (audioUrl) {
    return (
      <div className="flex items-center space-x-2 bg-black/40 rounded-xl px-3 py-1.5 animate-fade-in">
        <audio src={audioUrl} controls className="h-8 w-32" />
        <span className="text-[9px] text-neutral-500 font-black">{formatTime(duration)}</span>
        <button onClick={cancel} className="text-red-500 p-1 active:scale-90 transition-all" aria-label="Törlés"><Trash2 size={14} /></button>
        <button onClick={send} className="bg-brand-orange text-black px-2.5 py-1 rounded-lg text-[9px] font-black active:scale-90 transition-all">Küldés</button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onMouseDown={recording ? stopRecording : startRecording}
      className={`p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center ${recording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-black text-neutral-500 hover:text-neutral-300'} ${recording ? '' : 'border border-border-subtle'}`}
      aria-label={recording ? 'Leállítás' : 'Hangfelvétel'}
    >
      {recording ? (
        <span className="flex items-center space-x-1 text-[9px] font-black">
          <Square size={12} /> {formatTime(duration)}
        </span>
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
};
