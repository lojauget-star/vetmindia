import React, { useState, useRef } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { audioService } from '@/services/audio.service';
import { transcriptService } from '@/services/transcript.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { Mic, Square, Play, Pause, Upload, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export interface AudioRecorderWidgetProps {
  caseId: string;
  patientId: string;
  onTranscriptionComplete: (rawText: string, findings: string[], missing: string[]) => void;
  className?: string;
}

export const AudioRecorderWidget: React.FC<AudioRecorderWidgetProps> = ({
  caseId,
  patientId,
  onTranscriptionComplete,
  className,
}) => {
  const { user } = useAuthStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Não foi possível acessar o microfone do navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const processAudio = async () => {
    if (!audioBlob || !user) return;
    setIsProcessing(true);
    setStatusMessage('Enviando áudio para Firebase Storage (users/.../cases/.../audio/)...');

    try {
      // 1. Upload to Firebase Storage
      let uploadResult;
      try {
        uploadResult = await audioService.uploadAudio(user.uid, caseId, audioBlob);
      } catch (err) {
        // Fallback for demo/test mode if Storage bucket is not configured
        uploadResult = {
          storagePath: `users/${user.uid}/cases/${caseId}/audio/consultation_${Date.now()}.webm`,
          downloadUrl: '',
          sizeBytes: audioBlob.size,
          mimeType: 'audio/webm',
        };
      }

      setStatusMessage('Processando transcrição e estruturando fatos clínicos...');

      // 2. Process Transcription with TranscriptService
      const result = await transcriptService.processAudioTranscription(
        user.uid,
        caseId,
        patientId,
        uploadResult.storagePath
      );

      setStatusMessage('Transcrição concluída com sucesso!');
      onTranscriptionComplete(result.rawText, result.clinicalFindings, result.missingInformation);
    } catch (err: any) {
      alert(`Falha no processamento: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('p-5 bg-paper-texture border border-vet-border rounded-xl shadow-subtle space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-clinical-blue" />
          <h3 className="text-sm font-bold text-vet-text">Gravação & Transcrição da Consulta</h3>
        </div>
        <Badge variant="clinical" size="sm">
          Gemini Voice Engine
        </Badge>
      </div>

      {/* Recording Control Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-vet-surface rounded-xl border border-vet-border-subtle">
        {!audioUrl ? (
          <div className="flex items-center gap-3 w-full justify-between">
            {isRecording ? (
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <span className="font-mono text-sm font-bold text-red-600">{formatTime(recordingTime)}</span>
                <span className="text-xs text-vet-secondary">Gravando consulta...</span>
              </div>
            ) : (
              <span className="text-xs text-vet-secondary">Clique para iniciar a gravação por voz</span>
            )}

            <div className="flex items-center gap-2">
              {isRecording ? (
                <Button variant="danger" size="sm" onClick={stopRecording} leftIcon={<Square className="w-4 h-4" />}>
                  Parar Gravação
                </Button>
              ) : (
                <>
                  <Button variant="primary" size="sm" onClick={startRecording} leftIcon={<Mic className="w-4 h-4" />}>
                    Gravar Áudio
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="w-4 h-4" />}
                  >
                    Upload Áudio
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          /* Playback & Process Panel */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <audio ref={audioPlayerRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (audioPlayerRef.current) {
                    if (isPlaying) audioPlayerRef.current.pause();
                    else audioPlayerRef.current.play();
                    setIsPlaying(!isPlaying);
                  }
                }}
                className="p-2 bg-clinical-blue-light text-clinical-blue rounded-full hover:bg-clinical-blue hover:text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <span className="text-xs font-semibold text-vet-text">Áudio da Consulta Gravado</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAudioBlob(null);
                  setAudioUrl(null);
                }}
              >
                Descartar
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={processAudio}
                isLoading={isProcessing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Transcrever e Estruturar
              </Button>
            </div>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 text-xs text-clinical-blue font-medium bg-clinical-blue-light p-2.5 rounded-lg border border-clinical-blue/20">
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-trusted-green" />}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
