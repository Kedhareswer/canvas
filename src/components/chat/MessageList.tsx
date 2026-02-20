"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { MessageBubble } from "./MessageBubble";

export function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6">
        <p className="text-sm text-center">
          Ask the AI to write, review, format, or research for your LaTeX document.
        </p>
        <div className="mt-4 space-y-2 text-xs">
          <p>&quot;Write an introduction about machine learning&quot;</p>
          <p>&quot;Review my document for grammar issues&quot;</p>
          <p>&quot;Add citations about neural networks&quot;</p>
          <p>&quot;Format the tables with booktabs&quot;</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
