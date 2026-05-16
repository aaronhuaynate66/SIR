'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceNoteResult {
  mentions: string[];
  emotion:  string;
  topics:   string[];
  signals:  string[];
}

interface Props {
  personId?: string;
  onSaved?:  (result: VoiceNoteResult) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

declare global {
  interface Window {
    SpeechRecognition:       new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  lang:           string;
  continuous:     boolean;
  interimResults: boolean;
  start():  void;
  stop():   void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror:  ((e: Event) => void) | null;
  onend:    (() => void) | null;
}

export default function VoiceNote({ personId, onSaved }: Props) {
  const [recording,   setRecording]   = useState(false);
  const [transcript,  setTranscript]  = useState('');
  const [audioUrl,    setAudioUrl]    = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [result,      setResult]      = useState<VoiceNoteResult | null>(null);
  const [errMsg,      setErrMsg]      = useState('');
  const [elapsed,     setElapsed]     = useState(0);
  const [open,        setOpen]        = useState(false);

  const mediaRef  = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const srRef     = useRef<SpeechRecognitionInstance | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    setErrMsg('');
    setTranscript('');
    setAudioUrl(null);
    setResult(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(250);

      // SpeechRecognition for live transcription
      const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (SR) {
        const sr = new SR();
        sr.lang           = 'es-ES';
        sr.continuous     = true;
        sr.interimResults = true;
        sr.onresult       = (e: SpeechRecognitionEvent) => {
          let full = '';
          for (let i = 0; i < e.results.length; i++) {
            full += e.results[i]![0]!.transcript;
          }
          setTranscript(full);
        };
        sr.onerror = () => undefined;
        sr.start();
        srRef.current = sr;
      }

      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev >= 119) { stopRecording(); return prev; }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setErrMsg('No se pudo acceder al micrófono');
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRef.current?.stop();
    srRef.current?.stop();
    setRecording(false);
  }

  async function handleSave() {
    if (!transcript.trim()) { setErrMsg('Transcripción vacía — habla antes de guardar'); return; }
    setSaving(true);
    setErrMsg('');
    try {
      const res = await fetch('/api/voice/transcribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ transcript, personId }),
      });
      const data = await res.json() as VoiceNoteResult & { error?: string };
      if (!res.ok) { setErrMsg(data.error ?? 'Error al guardar'); return; }
      setResult(data);
      onSaved?.(data);
    } catch {
      setErrMsg('Error de red');
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    stopRecording();
    setTranscript('');
    setAudioUrl(null);
    setResult(null);
    setErrMsg('');
    setElapsed(0);
    setOpen(false);
  }

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Nota de voz"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px',
          background: '#1a1d27', border: '1px solid #2a2d3e',
          borderRadius: 8, color: '#94a3b8', fontSize: 13,
          cursor: 'pointer',
        }}
      >
        🎙 Nota de voz
      </button>
    );
  }

  return (
    <div style={{
      background: '#1a1d27', border: '1px solid #2a2d3e',
      borderRadius: 12, padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>🎙 Nota de voz</span>
        <button onClick={handleDiscard} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      {/* Record / Stop button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        {!recording ? (
          <button
            onClick={startRecording}
            disabled={saving}
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#ef4444', border: 'none',
              color: '#fff', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ●
          </button>
        ) : (
          <button
            onClick={stopRecording}
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#374151', border: '2px solid #ef4444',
              color: '#fff', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse 1s infinite',
            }}
          >
            ■
          </button>
        )}
        <div>
          <p style={{ color: recording ? '#ef4444' : '#64748b', fontSize: 13, margin: '0 0 2px', fontWeight: recording ? 600 : 400 }}>
            {recording ? `Grabando… ${fmt(elapsed)} / 2:00` : audioUrl ? 'Grabación lista' : 'Toca para grabar'}
          </p>
          <p style={{ color: '#334155', fontSize: 11, margin: 0 }}>Máximo 2 minutos</p>
        </div>
      </div>

      {/* Audio preview */}
      {audioUrl && (
        <audio controls src={audioUrl} style={{ width: '100%', marginBottom: 14, height: 36 }} />
      )}

      {/* Live / editable transcript */}
      <textarea
        value={transcript}
        onChange={e => setTranscript(e.target.value)}
        placeholder={recording ? 'Transcripción en vivo…' : 'La transcripción aparecerá aquí (editable)'}
        rows={4}
        style={{
          width: '100%', padding: '10px 12px',
          background: '#13151f', border: '1px solid #2a2d3e',
          borderRadius: 8, color: '#e2e8f0', fontSize: 13,
          resize: 'vertical', boxSizing: 'border-box' as const,
          marginBottom: 12,
        }}
      />

      {errMsg && (
        <p style={{ color: '#fca5a5', fontSize: 13, margin: '0 0 10px', background: '#fca5a51a', padding: '6px 10px', borderRadius: 6 }}>
          {errMsg}
        </p>
      )}

      {result ? (
        <div style={{ background: '#13151f', borderRadius: 8, padding: '12px 14px', fontSize: 13 }}>
          <p style={{ color: '#86efac', fontWeight: 600, margin: '0 0 8px' }}>✓ Guardada y analizada</p>
          {result.emotion !== 'neutro' && <p style={{ color: '#94a3b8', margin: '0 0 4px' }}>Estado emocional: <span style={{ color: '#e2e8f0' }}>{result.emotion}</span></p>}
          {result.topics.length > 0 && <p style={{ color: '#94a3b8', margin: '0 0 4px' }}>Temas: <span style={{ color: '#e2e8f0' }}>{result.topics.join(', ')}</span></p>}
          {result.mentions.length > 0 && <p style={{ color: '#94a3b8', margin: 0 }}>Menciones: <span style={{ color: '#e2e8f0' }}>{result.mentions.join(', ')}</span></p>}
          <button onClick={handleDiscard} style={{ marginTop: 10, background: 'none', border: 'none', color: '#6366f1', fontSize: 12, cursor: 'pointer', padding: 0 }}>
            Nueva nota →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving || recording || !transcript.trim()}
            style={{
              padding: '8px 16px',
              background: saving || recording || !transcript.trim() ? '#2a2d3e' : '#6366f1',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600,
              cursor: saving || recording || !transcript.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Guardando…' : 'Transcribir y guardar'}
          </button>
          <button
            onClick={handleDiscard}
            style={{
              padding: '8px 14px',
              background: 'transparent', border: '1px solid #2a2d3e',
              color: '#64748b', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            }}
          >
            Descartar
          </button>
        </div>
      )}
    </div>
  );
}
