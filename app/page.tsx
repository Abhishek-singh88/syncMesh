import { Workspace } from "@/components/Workspace";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-indigo-500/30 font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-12 relative z-10 flex flex-col items-center">
        <header className="text-center mb-12">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-white/5 border border-white/10 text-xs font-medium tracking-wide text-neutral-300">
            Phase 1: Local CRDT Engine
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-br from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
            SyncMesh Workspace
          </h1>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            A distributed real-time collaborative engine built on Conflict-free Replicated Data Types (CRDTs). 
            Test the underlying data-structure lattice by simulating two isolated client nodes syncing over an in-memory transport layer.
          </p>
        </header>

        <Workspace />
      </div>
    </main>
  );
}