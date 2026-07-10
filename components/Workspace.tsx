"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { Editor } from "./Editor";

const WS_URL_NODE_A = "ws://localhost:3001/workspace/demo-doc";
const WS_URL_NODE_B = "ws://localhost:3002/workspace/demo-doc";

export function Workspace() {
  const [docA] = useState(() => new Y.Doc());
  const [docB] = useState(() => new Y.Doc());
  
  const [textA] = useState(() => docA.getText("shared-workspace"));
  const [textB] = useState(() => docB.getText("shared-workspace"));

  const [aOffline, setAOffline] = useState(false);
  const [bOffline, setBOffline] = useState(false);

  const [aStatus, setAStatus] = useState("Disconnected");
  const [bStatus, setBStatus] = useState("Disconnected");

  // Setup WebSocket for Client A (Connects to Server Node 1 on port 3001)
  useEffect(() => {
    if (aOffline) {
      setAStatus("Disconnected");
      return;
    }

    setAStatus("Connecting...");
    const ws = new WebSocket(WS_URL_NODE_A);
    ws.binaryType = "arraybuffer"; // Important for Yjs Uint8Array

    ws.onopen = () => {
      setAStatus("Connected");
      const state = Y.encodeStateAsUpdate(docA);
      ws.send(state);
    };

    const realMessageHandler = (event: MessageEvent) => {
      const update = new Uint8Array(event.data);
      Y.applyUpdate(docA, update, "websocket");
    };

    ws.onmessage = realMessageHandler;
    ws.onclose = () => setAStatus("Disconnected");
    ws.onerror = () => setAStatus("Error");

    const handleUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== "websocket" && ws.readyState === WebSocket.OPEN) {
        ws.send(update);
      }
    };
    
    docA.on("update", handleUpdate);

    return () => {
      docA.off("update", handleUpdate);
      ws.close();
    };
  }, [docA, aOffline]);

  // Setup WebSocket for Client B (Connects to Server Node 2 on port 3002)
  useEffect(() => {
    if (bOffline) {
      setBStatus("Disconnected");
      return;
    }

    setBStatus("Connecting...");
    const ws = new WebSocket(WS_URL_NODE_B);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      setBStatus("Connected");
      const state = Y.encodeStateAsUpdate(docB);
      ws.send(state);
    };

    const realMessageHandler = (event: MessageEvent) => {
      const update = new Uint8Array(event.data);
      Y.applyUpdate(docB, update, "websocket");
    };

    ws.onmessage = realMessageHandler;
    ws.onclose = () => setBStatus("Disconnected");
    ws.onerror = () => setBStatus("Error");

    const handleUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== "websocket" && ws.readyState === WebSocket.OPEN) {
        ws.send(update);
      }
    };
    
    docB.on("update", handleUpdate);

    return () => {
      docB.off("update", handleUpdate);
      ws.close();
    };
  }, [docB, bOffline]);

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full h-[600px] max-w-6xl mx-auto p-4 md:p-8">
      <Editor
        className="flex-1"
        label={`Edge Node A (${aStatus}) -> Port 3001`}
        yText={textA}
        isOffline={aOffline}
        onToggleConnection={() => setAOffline(!aOffline)}
      />
      
      {/* Network Link Visualization */}
      <div className="flex flex-col items-center justify-center gap-4 py-4 md:py-0">
        <div className={`h-full w-px transition-colors duration-500 hidden md:block ${(aStatus === "Connected" && bStatus === "Connected") ? 'bg-gradient-to-b from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-white/5'}`}></div>
        
        <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${(aStatus === "Connected" && bStatus === "Connected") ? 'text-red-400' : 'text-neutral-600'}`}>
           <div className={`text-[10px] uppercase tracking-[0.2em] font-bold rounded-full px-3 py-1 border whitespace-nowrap md:-rotate-90 ${(aStatus === "Connected" && bStatus === "Connected") ? 'bg-red-500/10 border-red-500/30' : 'bg-neutral-800 border-neutral-700'}`}>
            {(aStatus === "Connected" && bStatus === "Connected") ? "Redis Pub/Sub Active" : "Disconnected"}
          </div>
        </div>
        
        <div className={`h-full w-px transition-colors duration-500 hidden md:block ${(aStatus === "Connected" && bStatus === "Connected") ? 'bg-gradient-to-b from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-white/5'}`}></div>
      </div>

      <Editor
        className="flex-1"
        label={`Edge Node B (${bStatus}) -> Port 3002`}
        yText={textB}
        isOffline={bOffline}
        onToggleConnection={() => setBOffline(!bOffline)}
      />
    </div>
  );
}
