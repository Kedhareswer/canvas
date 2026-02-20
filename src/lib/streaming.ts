import { StreamChunk } from "@/types/chat";

export function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  function sendSSE(chunk: StreamChunk) {
    if (controller) {
      const data = `data: ${JSON.stringify(chunk)}\n\n`;
      controller.enqueue(encoder.encode(data));
    }
  }

  function close() {
    if (controller) {
      controller.close();
    }
  }

  return { stream, sendSSE, close };
}
