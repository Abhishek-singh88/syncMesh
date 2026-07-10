"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Zap, Globe, Layers } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreateWorkspace = () => {
    setIsGenerating(true);
    // Generate a random ID and redirect
    const newWorkspaceId = crypto.randomUUID().split("-")[0];
    setTimeout(() => {
      router.push(`/workspace/${newWorkspaceId}`);
    }, 600); // Small delay for the animation
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative font-sans selection:bg-indigo-500/30">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white/90">SyncMesh</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-white/50">
          <a href="https://github.com/Abhishek-singh88/syncMesh" className="hover:text-white transition-colors">GitHub</a>
          <button 
            onClick={handleCreateWorkspace}
            className="cursor-pointer px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-300"
          >
            Launch App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 max-w-4xl mx-auto">


        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-tight">
          Real-time <br /> collaboration, <br /> without the chaos.
        </h1>
        
        <p className="text-lg md:text-xl text-neutral-400 mb-12 max-w-2xl font-light">
          Experience the power of Conflict-free Replicated Data Types (CRDTs). 
          SyncMesh is a horizontally scalable, offline-resilient backend engine built for the modern web.
        </p>

        <button 
          onClick={handleCreateWorkspace}
          disabled={isGenerating}
          className="cursor-pointer group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-transform active:scale-95 disabled:opacity-80"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <span className="relative z-10">Create New Workspace</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

      </main>

      {/* Feature Highlights */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 pb-32">
        
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/[0.07] transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 border border-indigo-500/30 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-white/90 mb-2">Sub-Millisecond Sync</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Stateful WebSockets stream binary CRDT patches instantly, completely bypassing traditional REST bottlenecks.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/[0.07] transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 border border-purple-500/30 group-hover:scale-110 transition-transform">
            <Globe className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white/90 mb-2">Horizontally Scalable</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Built on a Redis Pub/Sub backplane. Traffic is automatically routed across multiple Fastify nodes.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/[0.07] transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/30 group-hover:scale-110 transition-transform">
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white/90 mb-2">Lazy Persistence</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            A sliding-window debouncer protects your database. Data is flushed to MongoDB only when users stop typing.
          </p>
        </div>

      </section>
      
    </div>
  );
}