import { authedFetch } from './authedFetch';

export interface VoiceTranscriptionResponse {
  transcript: string;   // what the user said (speech-to-text)
  response?: string;    // AI-generated answer (if backend provides it)
  language?: string;    // detected language, e.g. "de", "en"
}

export async function submitVoiceQuery(
  audioUri: string,
  mimeType: string,
): Promise<VoiceTranscriptionResponse> {
  const ext = mimeType === 'audio/m4a' ? '.m4a' : '.audio';
  console.log('[voiceApi] submitVoiceQuery start', { audioUri, mimeType });

  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: `recording${ext}`,
    type: mimeType,
  } as unknown as Blob);

  console.log('[voiceApi] POST /v1/voice/query — uploading audio');
  const response = await authedFetch('/v1/voice/query', {
    method: 'POST',
    body: formData as unknown as BodyInit,
  });

  console.log('[voiceApi] response status:', response.status);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.warn('[voiceApi] error body:', body);
    throw new Error(`Voice query failed: ${response.status} ${body}`);
  }

  const data = await response.json() as VoiceTranscriptionResponse;
  console.log('[voiceApi] success:', data);
  return data;
}
