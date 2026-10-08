export interface RecordedPracticeMedia {
  mediaPublicId: string;
  durationSeconds: number;
  contentType: "audio/wav";
}

export interface PracticeAudioUploadGrant {
  mediaPublicId: string;
  publicId: string;
  uploadUrl: string;
  apiKey: string;
  timestamp: string;
  signature: string;
  folder: string;
  resourceType: string;
  expiresInSeconds: number;
}
