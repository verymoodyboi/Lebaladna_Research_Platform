export async function transcribeAudio(
  env: Env,
  audio: Blob,
  filename: string,
): Promise<string> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", "gpt-4o-mini-transcribe");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Transcription failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json<{ text: string }>();
  return data.text;
}