import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";

function shortError(e: unknown): string {
  if (e instanceof Error) return e.message.slice(0, 120);
  return "Invalid";
}

export async function POST(req: NextRequest) {
  const { googleApiKey, exaApiKey, groqApiKey } = await req.json();

  const errors: string[] = [];
  let googleValid: boolean | undefined;
  let exaValid: boolean | undefined;
  let groqValid: boolean | undefined;

  if (googleApiKey) {
    const validationModels = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3-flash-preview",
      "gemini-3-pro-preview",
    ];

    let lastError: unknown;
    googleValid = false;

    for (const model of validationModels) {
      try {
        const llm = new ChatGoogleGenerativeAI({
          model,
          temperature: 0,
          apiKey: googleApiKey,
          maxOutputTokens: 1,
        });
        await llm.invoke("hi");
        googleValid = true;
        break;
      } catch (e) {
        lastError = e;
      }
    }

    if (!googleValid) {
      errors.push(`Google API Key: ${shortError(lastError)}`);
    }
  }

  if (groqApiKey) {
    try {
      const llm = new ChatGroq({
        model: "llama-3.1-8b-instant",
        temperature: 0,
        apiKey: groqApiKey,
        maxTokens: 1,
      });
      await llm.invoke("hi");
      groqValid = true;
    } catch (e) {
      groqValid = false;
      errors.push(`Groq API Key: ${shortError(e)}`);
    }
  }

  if (exaApiKey) {
    try {
      const res = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": exaApiKey,
        },
        body: JSON.stringify({ query: "test", numResults: 1 }),
      });
      exaValid = res.ok;
      if (!res.ok) errors.push(`Exa API Key: HTTP ${res.status}`);
    } catch (e) {
      exaValid = false;
      errors.push(`Exa API Key: ${shortError(e)}`);
    }
  }

  const valid = errors.length === 0 && (googleApiKey ? googleValid : true) && (groqApiKey ? groqValid : true);
  return NextResponse.json({
    valid,
    google: googleValid,
    groq: groqValid,
    exa: exaValid,
    message: valid ? "All provided keys are valid." : undefined,
    error: errors.length > 0 ? errors.join("; ") : undefined,
  });
}
