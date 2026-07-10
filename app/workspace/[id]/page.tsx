"use client";

import { useEffect, useState, use } from "react";
import * as Y from "yjs";
import { Editor } from "../../../components/Editor";
import { Link, Users, Share2, ShieldCheck, AlertCircle } from "lucide-react";

// Use environment variable, fallback to localhost for development
const WS_URL_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const documentId = resolvedParams.id;
  const WS_URL = `${WS_URL_BASE}/workspace/${documentId}`;

  const [doc] = useState(() => new Y.Doc());
  const [yText] = useState(() => doc.getText("shared-workspace"));
  
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setStatus("connecting");
    const ws = new WebSocket(WS_URL);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      setStatus("connected");
      const state = Y.encodeStateAsUpdate(doc);
      ws.send(state);
    };

    const realMessageHandler = (event: MessageEvent) => {
      const update = new Uint8Array(event.data);
      Y.applyUpdate(doc, update, "websocket");
    };

    ws.onmessage = realMessageHandler;
    
    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("disconnected");

    const handleUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== "websocket" && ws.readyState === WebSocket.OPEN) {
        ws.send(update);
      }
    };
    
    doc.on("update", handleUpdate);

    return () => {
      doc.off("update", handleUpdate);
      ws.close();
    };
  }, [doc, WS_URL]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-white font-sans selection:bg-indigo-500/30">
      
      {/* Premium Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#0F0F0F] border-b border-white/5 shadow-md z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-sm font-semibold tracking-wide text-white/90 hidden sm:block">SyncMesh</span>
          </div>
          
          <div className="h-4 w-px bg-white/10 mx-2 hidden sm:block"></div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/5">
            <Link className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-xs font-mono text-neutral-300">{documentId}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <div className="relative flex h-2.5 w-2.5">
              {status === "connected" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                status === "connected" ? "bg-emerald-500" : 
                status === "connecting" ? "bg-amber-500" : "bg-red-500"
              }`}></span>
            </div>
            <span className="text-xs font-medium text-neutral-400 capitalize hidden sm:block">
              {status}
            </span>
          </div>

          <button 
            onClick={handleCopyLink}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            {isCopied ? <ShieldCheck className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:block">{isCopied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </header>

      {/* Warning Banner if disconnected */}
      {status === "disconnected" && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-200">You are offline. Edits will sync automatically when you reconnect.</span>
        </div>
      )}

      {/* Editor Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full max-h-96 bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="h-full w-full max-w-5xl mx-auto p-4 sm:p-8 relative z-10">
          <Editor yText={yText} />
        </div>
      </main>

    </div>
  );
}
