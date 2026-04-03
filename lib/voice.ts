import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function transcribeVoice(fileBuffer: Buffer): Promise<string> {
  const tmpPath = path.join(os.tmpdir(), `lexon-voice-${Date.now()}.ogg`);
  fs.writeFileSync(tmpPath, fileBuffer);

  try {
    const transcription = await getClient().audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: "whisper-1",
      language: "tr",
    });
    return transcription.text;
  } finally {
    fs.unlinkSync(tmpPath);
  }
}
