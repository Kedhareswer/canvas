"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { EditorPanel } from "@/components/editor/EditorPanel";

export function AppShell() {
  return (
    <PanelGroup direction="horizontal" className="h-full min-h-0 w-full overflow-hidden">
      <Panel defaultSize={35} minSize={25} maxSize={50} className="min-h-0 overflow-hidden">
        <ChatPanel />
      </Panel>
      <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/20 transition-colors" />
      <Panel defaultSize={65} minSize={40} className="min-h-0 overflow-hidden">
        <EditorPanel />
      </Panel>
    </PanelGroup>
  );
}
