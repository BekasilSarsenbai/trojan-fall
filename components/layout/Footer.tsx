export function Footer() {
  return (
    <footer className="border-t border-war-border bg-war-bg/60 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-war-dim flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div>
          © {new Date().getFullYear()} Trojan Fall · Chess as a War
        </div>
        <div className="flex gap-4">
          <span>Built for nFactorial Chess Challenge</span>
          <span>·</span>
          <span>Almaty / KZ</span>
        </div>
      </div>
    </footer>
  );
}
