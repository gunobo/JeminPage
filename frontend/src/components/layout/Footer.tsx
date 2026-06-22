export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-auto py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <span>© 2026 imjemin. All rights reserved.</span>
        <div className="flex gap-6">
          <a href="https://github.com/imjemin" target="_blank" rel="noreferrer" className="hover:text-[#1a1a2e] transition-colors">
            GitHub
          </a>
          <a href="mailto:startea0716@gmail.com" className="hover:text-[#1a1a2e] transition-colors">
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
