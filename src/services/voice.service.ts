import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export type SttProvider = "gemini" | "whisper";

export class VoiceService {
  /**
   * Transcribe audio — prefers free Gemini (same key as chat), falls back to Whisper if configured.
   */
  async transcribe(
    audioBuffer: Buffer,
    mimeType: string
  ): Promise<{ transcript: string; provider: SttProvider }> {
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const transcript = await this.transcribeWithGemini(
          audioBuffer,
          mimeType
        );
        return { transcript, provider: "gemini" };
      } catch (error) {
        console.warn("Gemini transcription failed, trying Whisper:", error);
      }
    }

    if (openaiKey) {
      const transcript = await this.transcribeWithWhisper(audioBuffer, mimeType);
      return { transcript, provider: "whisper" };
    }

    throw new Error(
      "No speech-to-text provider configured. Set GOOGLE_GENERATIVE_AI_API_KEY or OPENAI_API_KEY."
    );
  }

  private async transcribeWithGemini(
    audioBuffer: Buffer,
    mimeType: string
  ): Promise<string> {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe the following audio verbatim. Return only the spoken words, no commentary.",
            },
            {
              type: "file",
              mimeType: mimeType || "audio/webm",
              data: audioBuffer,
            },
          ],
        },
      ],
    });

    const trimmed = text?.trim();
    if (!trimmed) {
      throw new Error("Gemini returned an empty transcript");
    }
    return trimmed;
  }

  private async transcribeWithWhisper(
    audioBuffer: Buffer,
    mimeType: string
  ): Promise<string> {
    const extension = mimeType.includes("mp3") ? "mp3" : "webm";
    const blob = new Blob([new Uint8Array(audioBuffer)], {
      type: mimeType || "audio/webm",
    });
    const formData = new FormData();
    formData.append("file", blob, `recording.${extension}`);
    formData.append("model", "whisper-1");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Whisper API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as { text?: string };
    if (!data.text?.trim()) {
      throw new Error("Whisper returned an empty transcript");
    }
    return data.text.trim();
  }
}
