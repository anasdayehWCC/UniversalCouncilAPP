"use client"

import Link from 'next/link'

export const Footer = () => (
  <footer className="glass-panel border-t border-border/40 px-4 py-3 text-sm text-white">
    <div className="mx-auto flex max-w-7xl items-center justify-between">
      <nav className="flex gap-4">
        <Link href="/privacy" target="_blank" className="hover:underline">
          Privacy
        </Link>
        <Link href="/support" target="_blank" className="hover:underline">
          Support
        </Link>
      </nav>
      <div className="text-xs text-white/80">UK-hosted • Entra secured</div>
    </div>
  </footer>
)
