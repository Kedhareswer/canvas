import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { LLMProvider, GeminiModel, GroqModel } from "@/store/settingsStore";

export interface LLMConfig {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  apiKey?: string;
  groqApiKey?: string;
}

export function createLLM(config: LLMConfig = {}): BaseChatModel {
  const provider = config.provider ?? "gemini";

  if (provider === "groq") {
    return new ChatGroq({
      model: (config.model as GroqModel) ?? "llama-3.3-70b-versatile",
      temperature: config.temperature ?? 0.7,
      apiKey: config.groqApiKey || process.env.GROQ_API_KEY,
    });
  }

  return new ChatGoogleGenerativeAI({
    model: (config.model as GeminiModel) ?? "gemini-2.5-flash",
    temperature: config.temperature ?? 0.7,
    apiKey: config.apiKey || process.env.GOOGLE_API_KEY,
  });
}
