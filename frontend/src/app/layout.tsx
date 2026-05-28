import type { Metadata } from 'next';
import './globals.css';
import WebSocketInitializer from '@/components/WebSocketInitializer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VedaAI - Assessment Creator',
  description: 'AI-powered classroom assignment and question paper generator for teachers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans flex h-screen overflow-hidden">
        <WebSocketInitializer />
        
        {/* --- Side Bar Navigation --- */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between flex-shrink-0 z-10">
          <div>
            {/* Logo */}
            <div className="p-6 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-red-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                <span className="text-white font-black text-lg">V</span>
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">VedaAI</span>
            </div>

            {/* Create Assignment CTA */}
            <div className="px-4 mb-6">
              <Link href="/create" className="flex items-center justify-center space-x-2 py-3 px-4 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-slate-900/10 hover:shadow-orange-500/10 hover:border hover:border-orange-500/30 w-full group">
                <span className="text-orange-500 group-hover:scale-110 transition-transform font-bold">+</span>
                <span>Create Assignment</span>
              </Link>
            </div>

            {/* Navigation links */}
            <nav className="px-2 space-y-1">
              <Link href="/" className="flex items-center space-x-3 py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                <span>Home</span>
              </Link>
              <Link href="/" className="flex items-center space-x-3 py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                <span>My Groups</span>
              </Link>
              <Link href="/" className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-orange-50 text-orange-600 text-sm font-semibold transition-colors">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <span>Assignments</span>
                </div>
                <span className="bg-orange-200 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
              </Link>
              <Link href="/" className="flex items-center space-x-3 py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                <span>AI Teacher's Toolkit</span>
              </Link>
              <Link href="/" className="flex items-center space-x-3 py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>
                <span>My Library</span>
              </Link>
            </nav>
          </div>

          {/* Bottom Settings and Profile */}
          <div className="p-4 border-t border-slate-100">
            <Link href="/" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition-colors mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>Settings</span>
            </Link>

            {/* School Avatar Badge */}
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-700 font-bold border border-slate-300">
                DPS
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-800 truncate">Delhi Public School</h4>
                <p className="text-[10px] text-slate-500 truncate">Bokaro Steel City</p>
              </div>
            </div>
          </div>
        </aside>

        {/* --- Main Content Area --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          {/* Top Bar / Header */}
          <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between flex-shrink-0 z-10 no-print">
            <div className="flex items-center space-x-4">
              {/* Back Button */}
              <Link href="/" className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              </Link>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-slate-400">Home</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-800 font-medium">Assignments</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-orange-600 animate-pulse-ring"></span>
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  JD
                </div>
                <div className="text-left hidden md:block">
                  <h5 className="text-xs font-bold text-slate-800">John Doe</h5>
                  <p className="text-[10px] text-slate-400">Teacher Account</p>
                </div>
              </div>
            </div>
          </header>

          {/* Children Pages Content */}
          <main className="flex-1 overflow-y-auto min-h-0 relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
