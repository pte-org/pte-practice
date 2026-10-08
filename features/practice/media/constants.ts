export const RECORDING_TEXT = {
  checkMicrophone: "Check microphone",
  start: "Start recording",
  stop: "Stop recording",
  retry: "Try again",
  recording: "Recording",
  uploading: "Uploading recording",
  recorded: "Recording ready",
  noRecording: "No recording yet",
  duration: "Duration",
  microphoneReady: "Microphone ready.",
  microphoneDenied: "Microphone permission is required to record this response.",
  microphoneMissing: "No microphone was found on this device.",
  microphoneBusy: "The microphone is busy or unavailable right now.",
  microphoneUnsupported: "This browser cannot record audio in the required format.",
  uploadFailed: "The recording could not be uploaded. Your answer was not submitted.",
  bindingMissing: "This recording is not linked to the current practice task.",
  recordingRequired: "Record a response before submitting.",
} as const;

export const PRACTICE_RESPONSE_AUDIO_PURPOSE = "PRACTICE_RESPONSE_AUDIO" as const;
export const MAX_RECORDING_DURATION_SECONDS = 120;
