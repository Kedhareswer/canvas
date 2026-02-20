import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GeminiModel } from "@/store/settingsStore";

export interface GeminiConfig {
  temperature?: number;
  model?: GeminiModel;
  apiKey?: string;
}

export function createGemini(temperatureOrConfig: number | GeminiConfig = 0.7) {
  const config: GeminiConfig =
    typeof temperatureOrConfig === "number"
      ? { temperature: temperatureOrConfig }
      : temperatureOrConfig;

  return new ChatGoogleGenerativeAI({
    model: config.model ?? "gemini-2.5-flash",
    temperature: config.temperature ?? 0.7,
    apiKey: config.apiKey || process.env.GOOGLE_API_KEY,
  });
}
