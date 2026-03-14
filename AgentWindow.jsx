export default function AgentWindow({ title, children }) {
  return (
    <section className="relative w-full overflow-hidden border border-agent-gold-dark/80 bg-agent-black/80 backdrop-blur-md shadow-[5px_5px_0px_#8A6D3B]">
      <header className="flex items-center justify-between border-b border-agent-gold-dark/70 bg-agent-gold/20 px-4 py-2">
        <div className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-agent-gold">
          {String(title ?? "Agent Window")}
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-agent-gold/70 shadow-[0_0_10px_rgba(255,215,0,0.45)] animate-pulse" />
          <span className="h-2.5 w-2.5 rounded-full bg-agent-gold-dark shadow-[0_0_10px_rgba(138,109,59,0.45)] animate-pulse [animation-delay:300ms]" />
        </div>
      </header>

      <div className="px-4 py-5 font-mono text-xs leading-relaxed text-agent-gold sm:text-sm">
        {children}
      </div>
    </section>
  );
}
