import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from './firebase.config';

export interface AudioUploadResult {
  storagePath: string;
  downloadUrl: string;
  sizeBytes: number;
  mimeType: string;
}

export class AudioService {
  private storage = getStorage(app);

  /**
   * Uploads consultation audio to Firebase Storage under path:
   * users/{uid}/cases/{caseId}/audio/{filename}
   */
  async uploadAudio(
    uid: string,
    caseId: string,
    audioBlob: Blob,
    fileName = `consultation_${Date.now()}.webm`
  ): Promise<AudioUploadResult> {
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB max
    if (audioBlob.size > maxSizeBytes) {
      throw new Error('O arquivo de áudio excede o limite máximo permitido de 50MB.');
    }

    const storagePath = `users/${uid}/cases/${caseId}/audio/${fileName}`;
    const storageRef = ref(this.storage, storagePath);

    try {
      const snapshot = await uploadBytes(storageRef, audioBlob, {
        contentType: audioBlob.type || 'audio/webm',
        customMetadata: {
          uploadedBy: uid,
          caseId,
        },
      });

      const downloadUrl = await getDownloadURL(snapshot.ref);

      return {
        storagePath,
        downloadUrl,
        sizeBytes: audioBlob.size,
        mimeType: audioBlob.type || 'audio/webm',
      };
    } catch (error) {
      console.error(`[AudioService] Error uploading audio to ${storagePath}:`, error);
      throw error;
    }
  }
}

export const audioService = new AudioService();
