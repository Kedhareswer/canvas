import { generateImage } from "@/lib/gemini-image";

export interface GeneratedImage {
  placeholder: string;
  description: string;
  dataUri: string;
}

const GEN_PLACEHOLDER_REGEX = /\[gen:([^\]]+)\]/g;

export async function processImagePlaceholders(
  latex: string,
  apiKey: string,
  onProgress?: (msg: string) => void
): Promise<{ latex: string; generatedImages: GeneratedImage[] }> {
  const matches: Array<{ full: string; description: string }> = [];

  GEN_PLACEHOLDER_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = GEN_PLACEHOLDER_REGEX.exec(latex)) !== null) {
    matches.push({ full: match[0], description: match[1].trim() });
  }

  if (matches.length === 0) {
    return { latex, generatedImages: [] };
  }

  const generatedImages: GeneratedImage[] = [];
  let updatedLatex = latex;

  // Process sequentially to avoid rate limits (max 3 images)
  const toProcess = matches.slice(0, 3);

  for (const { full, description } of toProcess) {
    try {
      onProgress?.(`Generating image: ${description.slice(0, 60)}...`);
      const { dataUri } = await generateImage(description, apiKey);
      updatedLatex = updatedLatex.replace(full, dataUri);
      generatedImages.push({ placeholder: full, description, dataUri });
    } catch (error) {
      console.error(`Image generation failed for: ${description}`, error);
      onProgress?.(`Failed to generate image: ${description.slice(0, 40)}`);
    }
  }

  return { latex: updatedLatex, generatedImages };
}
