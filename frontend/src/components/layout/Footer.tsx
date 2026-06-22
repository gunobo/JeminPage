export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-xs font-semibold tracking-widest text-white/20 uppercase">
          © 2026 imjemin
        </span>
        <div className="flex gap-8">
          <a href="https://github.com/gunobo" target="_blank" rel="noreferrer"
            className="text-xs font-semibold tracking-widest uppercase text-white/20 hover:text-white transition-colors">
            GitHub
          </a>
          <a href="mailto:startea0716@gmail.com"
            className="text-xs font-semibold tracking-widest uppercase text-white/20 hover:text-white transition-colors">
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
