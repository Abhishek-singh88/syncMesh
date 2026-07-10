"use client";

import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

interface EditorProps {
  yText: Y.Text;
  label: string;
  className?: string;
  isOffline?: boolean;
  onToggleConnection?: () => void;
}

export function Editor({ yText, label, className, isOffline, onToggleConnection }: EditorProps) {
  const [value, setValue] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize and listen to Yjs changes
  useEffect(() => {
    setValue(yText.toString());

    const observer = () => {
      // When Y.Text changes from another client, update our local state
      setValue(yText.toString());
    };

    yText.observe(observer);
    return () => yText.unobserve(observer);
  }, [yText]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    const oldVal = yText.toString();
    
    // Simple diffing algorithm to preserve CRDT character-level intent
    // rather than replacing the entire string which ruins concurrent edits.
    let start = 0;
    while (start < oldVal.length && start < newValue.length && oldVal[start] === newValue[start]) {
      start++;
    }
    
    let endOld = oldVal.length - 1;
    let endNew = newValue.length - 1;
    while (endOld >= start && endNew >= start && oldVal[endOld] === newValue[endNew]) {
      endOld--;
      endNew--;
    }
    
    const removeCount = endOld - start + 1;
    const insertStr = newValue.slice(start, endNew + 1);

    yText.doc?.transact(() => {
      if (removeCount > 0) {
        yText.delete(start, removeCount);
      }
      if (insertStr.length > 0) {
        yText.insert(start, insertStr);
      }
    }, "local-textarea");
  };

  return (
    <div className={cn("flex flex-col h-full bg-[#161618] rounded-2xl border border-white/5 shadow-2xl overflow-hidden transition-all duration-300", isOffline && "opacity-80 scale-[0.99]", className)}>
      <div className="flex items-center justify-between px-5 py-3.5 bg-black/40 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={cn("w-2.5 h-2.5 rounded-full transition-colors shadow-sm", isOffline ? "bg-red-500 shadow-red-500/50" : "bg-emerald-500 shadow-emerald-500/50")}></div>
          <h2 className="text-sm font-medium text-neutral-200 tracking-wide">{label}</h2>
        </div>
        {onToggleConnection && (
          <button 
            onClick={onToggleConnection}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-all",
              isOffline 
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" 
                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            )}
          >
            {isOffline ? <WifiOff size={12} /> : <Wifi size={12} />}
            {isOffline ? "Stay Offline" : "Go Offline"}
          </button>
        )}
      </div>
      <textarea
        ref={textAreaRef}
        value={value}
        onChange={handleChange}
        className="flex-1 w-full p-5 bg-transparent text-neutral-300 resize-none outline-none font-mono text-[14px] leading-relaxed selection:bg-indigo-500/30"
        placeholder="Type here to see changes sync across nodes..."
        spellCheck={false}
      />
    </div>
  );
}
