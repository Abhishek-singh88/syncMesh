import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { cn } from "../lib/utils";

interface EditorProps {
  yText: Y.Text;
  className?: string;
}

export function Editor({ yText, className }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Sync textarea changes to Yjs
    const handleInput = (e: Event) => {
      const target = e.target as HTMLTextAreaElement;
      
      // Calculate delta
      const lengthDiff = target.value.length - yText.toString().length;
      const selectionStart = target.selectionStart;

      if (lengthDiff > 0) {
        // Insertion
        const insertedText = target.value.substring(
          selectionStart - lengthDiff,
          selectionStart
        );
        yText.insert(selectionStart - lengthDiff, insertedText);
      } else if (lengthDiff < 0) {
        // Deletion
        yText.delete(selectionStart, Math.abs(lengthDiff));
      }
    };

    // Sync Yjs changes to textarea
    const handleYjsUpdate = () => {
      if (!textarea) return;
      const currentSelectionStart = textarea.selectionStart;
      const currentSelectionEnd = textarea.selectionEnd;
      
      textarea.value = yText.toString();
      
      // Restore cursor position
      textarea.setSelectionRange(currentSelectionStart, currentSelectionEnd);
    };

    // Initial sync
    textarea.value = yText.toString();

    // Event listeners
    textarea.addEventListener("input", handleInput);
    yText.observe(handleYjsUpdate);

    return () => {
      textarea.removeEventListener("input", handleInput);
      yText.unobserve(handleYjsUpdate);
    };
  }, [yText]);

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <textarea
        ref={textareaRef}
        placeholder="Start typing... Your edits sync instantly across all devices."
        className="w-full h-full min-h-[60vh] resize-none bg-transparent text-white/90 text-lg md:text-xl font-mono leading-relaxed tracking-wide placeholder:text-neutral-600 focus:outline-none focus:ring-0 p-4 border-none"
        spellCheck={false}
      />
    </div>
  );
}
