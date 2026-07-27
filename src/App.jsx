import React, { useState } from "react";
import { Outlet } from "react-router";
import { AuthProvider } from "./AuthContext";
import Sidebar from "./components/Sidebar";
import { Menu, Shield } from "lucide-react";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased">
        {/* Sidebar Component */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 md:pl-72 h-full relative">
          {/* Mobile Top Navigation Header (< 768px) */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-30 shrink-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800/80 hover:bg-slate-800 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-slate-100 text-sm">AnonChat</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
              Anonymous
            </span>
          </header>

          {/* Router Outlet for ChatRoom */}
          <main className="flex-1 flex flex-col min-h-0 bg-slate-950 relative overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
