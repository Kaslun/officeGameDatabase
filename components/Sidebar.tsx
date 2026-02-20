"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Discover", icon: CompassIcon },
  { href: "/games", label: "Games", icon: GamepadIcon },
  { href: "/requests", label: "Requests", icon: CartIcon },
] as const;

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function GamepadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const navLinks = (
    <>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          onClick={() => setMobileOpen(false)}
          className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            isActive(href)
              ? "bg-attensi text-zinc-900"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </Link>
      ))}
    </>
  );

  return (
    <>
      {/* Mobile top bar - high z so it stays above filter and page content when scaling */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Attensi Game Hub" width={32} height={32} className="h-8 w-8 object-contain" priority />
          <span className="font-bold text-white">Attensi Game Hub</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar: drawer on mobile (starts below header), always visible on lg+ */}
      <aside
        className={`fixed left-0 top-14 z-40 flex h-[calc(100vh-3.5rem)] w-56 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-200 ease-out lg:top-0 lg:h-full ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Link href="/" className="flex h-16 shrink-0 items-center gap-2 px-4 pt-4">
          <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" priority />
          <span className="text-lg font-bold text-white">Attensi Game Hub</span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col overflow-y-auto px-3">
          {navLinks}
        </nav>

        <div className="border-t border-zinc-800 px-3 py-4">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              setHelpOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <HelpIcon className="h-5 w-5 shrink-0" />
            Help
          </button>
        </div>
      </aside>

      {/* Help modal */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setHelpOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="help-title" className="text-lg font-semibold text-white">
                About Attensi Game Hub
              </h2>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Close help"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-zinc-300">
              <section>
                <h3 className="mb-1 font-medium text-white">What is this?</h3>
                <p>
                  Attensi Game Hub is an office game request tracker. You can discover games, request titles for your workplace library, and upvote other people&apos;s requests. Admins review requests and can approve them, reject them with a reason, or mark games as available.
                </p>
              </section>
              <section>
                <h3 className="mb-1 font-medium text-white">How it works</h3>
                <ul className="list-inside list-disc space-y-1">
                  <li><strong>Discover</strong> — Browse popular and new games, search, and request any game.</li>
                  <li><strong>Games</strong> — Filter by platform and genre, then request games you want.</li>
                  <li><strong>Requests</strong> — See all requests, filter by status or console, and upvote. One upvote per person per request.</li>
                  <li>Admins use the <strong>Admin</strong> area to manage requests and configure which consoles appear in the Games filter.</li>
                </ul>
              </section>
              <section>
                <h3 className="mb-1 font-medium text-white">Questions?</h3>
                <p>
                  {supportEmail ? (
                    <>Contact <a href={`mailto:${supportEmail}`} className="text-attensi hover:underline">{supportEmail}</a> for support or questions.</>
                  ) : (
                    <>Contact your office administrator or the person who set up this site if you have questions.</>
                  )}
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
