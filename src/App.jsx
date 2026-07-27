import React, { useState } from "react";
import { Outlet } from "react-router";
import { AuthProvider } from "./AuthContext";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-200 antialiased font-sans">
        {/* Sidebar Component */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 md:pl-64 h-full relative">
          {/* Mobile Navigation Header (<768px) */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-black border-b border-zinc-800 z-30 shrink-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="px-3 py-1 text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors"
                aria-label="Open menu"
              >
                Menu
              </button>
              <span className="font-bold text-zinc-100 text-sm">AnonChat</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
              Anonymous
            </span>
          </header>

          {/* Router Outlet for ChatRoom */}
          <main className="flex-1 flex flex-col min-h-0 bg-black relative overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
