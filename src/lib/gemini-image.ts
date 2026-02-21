import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateImage(
  description: string,
  apiKey: string
): Promise<{ dataUri: string }> {
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      // @ts-expect-error -- responseModalities is valid for image generation
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const prompt = `Generate a clear, professional illustration: ${description}.
The image should be suitable for an academic/technical document.
Use clean lines, readable labels, and a white or light background.
Do not include any text watermarks.`;

  const result = await model.generateContent(prompt);
  const response = result.response;

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inlineData = (part as any).inlineData;
    if (inlineData) {
      const { data, mimeType } = inlineData as { data: string; mimeType: string };
      const mime = mimeType || "image/png";
      return { dataUri: `data:${mime};base64,${data}` };
    }
  }

  throw new Error("No image generated in Gemini response");
}
