"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { Editor } from "./Editor";

export function Workspace() {
  // Initialize Yjs documents natively, using useState for lazy initialization to prevent memory leaks during re-renders
  const [docA] = useState(() => new Y.Doc());
  const [docB] = useState(() => new Y.Doc());
  
  const [textA] = useState(() => docA.getText("shared-workspace"));
  const [textB] = useState(() => docB.getText("shared-workspace"));

  const [aOffline, setAOffline] = useState(false);
  const [bOffline, setBOffline] = useState(false);

  // In-memory transport layer simulation
  useEffect(() => {
    const handleUpdateA = (update: Uint8Array, origin: any) => {
      // If both nodes are online, instantly replicate state A -> B
      if (!aOffline && !bOffline) {
        Y.applyUpdate(docB, update);
      }
    };

    const handleUpdateB = (update: Uint8Array, origin: any) => {
      // If both nodes are online, instantly replicate state B -> A
      if (!aOffline && !bOffline) {
        Y.applyUpdate(docA, update);
      }
    };

    docA.on("update", handleUpdateA);
    docB.on("update", handleUpdateB);

    return () => {
      docA.off("update", handleUpdateA);
      docB.off("update", handleUpdateB);
    };
  }, [docA, docB, aOffline, bOffline]);

  // Network Restoration Protocol:
  // When network connectivity is restored (both clients come online), 
  // we must exchange their full state lattices to mathematically converge any divergent edits.
  useEffect(() => {
    if (!aOffline && !bOffline) {
      // Encode full state histories
      const fullStateA = Y.encodeStateAsUpdate(docA);
      const fullStateB = Y.encodeStateAsUpdate(docB);
      
      // Merge states deterministically. 
      // Because Yjs operations are commutative and associative, the order doesn't matter.
      Y.applyUpdate(docB, fullStateA);
      Y.applyUpdate(docA, fullStateB);
    }
  }, [docA, docB, aOffline, bOffline]);

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full h-[600px] max-w-6xl mx-auto p-4 md:p-8">
      <Editor
        className="flex-1"
        label="Edge Node A (Client 1)"
        yText={textA}
        isOffline={aOffline}
        onToggleConnection={() => setAOffline(!aOffline)}
      />
      
      {/* Network Link Visualization */}
      <div className="flex flex-col items-center justify-center gap-4 py-4 md:py-0">
        <div className={`h-full w-px transition-colors duration-500 hidden md:block ${(!aOffline && !bOffline) ? 'bg-gradient-to-b from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)]' : 'bg-white/5'}`}></div>
        
        <div className={`text-[10px] uppercase tracking-[0.2em] font-bold rounded-full px-3 py-1 border whitespace-nowrap md:-rotate-90 transition-all duration-500 ${(!aOffline && !bOffline) ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
          {!aOffline && !bOffline ? "Active Sync Line" : "Network Partitioned"}
        </div>
        
        <div className={`h-full w-px transition-colors duration-500 hidden md:block ${(!aOffline && !bOffline) ? 'bg-gradient-to-b from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)]' : 'bg-white/5'}`}></div>
      </div>

      <Editor
        className="flex-1"
        label="Edge Node B (Client 2)"
        yText={textB}
        isOffline={bOffline}
        onToggleConnection={() => setBOffline(!bOffline)}
      />
    </div>
  );
}
