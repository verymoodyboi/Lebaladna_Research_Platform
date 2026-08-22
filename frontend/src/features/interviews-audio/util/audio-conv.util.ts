/**
 * Converts any browser-decodable audio Blob (m4a, webm, mp3, etc.) into a
 * 16kHz mono WAV Blob. This sidesteps the known Whisper API issue where
 * certain iPhone-encoded m4a files get rejected despite m4a being a
 * supported format, and keeps upload size small since Whisper gets no
 * benefit from anything above 16kHz mono for speech.
 *
 * On unsupported/undecodable input this throws — callers should catch and
 * fall back to uploading the original file untouched.
 */
export async function convertToMonoWav16k(file: Blob): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx: typeof AudioContext =
    window.AudioContext || (window as any).webkitAudioContext;

  const decodeCtx = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  } finally {
    await decodeCtx.close();
  }

  const targetSampleRate = 16000;
  const offlineCtx = new OfflineAudioContext(
    1, // mono output — multi-channel sources are downmixed automatically
    Math.ceil(decoded.duration * targetSampleRate),
    targetSampleRate,
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start(0);

  const rendered = await offlineCtx.startRendering();
  return encodeWav(rendered);
}

function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels; // 1, per convertToMonoWav16k
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const data = buffer.getChannelData(0);
  const dataLength = data.length * bytesPerSample;

  const out = new ArrayBuffer(44 + dataLength);
  const view = new DataView(out);

  const writeStr = (offset: number, str: string) =>
    [...str].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([out], { type: "audio/wav" });
}