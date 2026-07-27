import React from "react";
import { NavLink } from "react-router";
import { useAuth } from "../AuthContext";
import { ROOMS } from "../routes";
import {
  MessageSquare,
  Lock,
  Lightbulb,
  Shuffle,
  Code,
  UserCheck,
  RefreshCw,
  X,
  Shield,
  Sparkles,
  Radio,
} from "lucide-react";

const ICON_MAP = {
  general: MessageSquare,
  confessions: Lock,
  advice: Lightbulb,
  random: Shuffle,
  "tech-talk": Code,
};

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, refreshNickname } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-1.5">
                AnonChat <Sparkles className="w-3.5 h-3.5 text-cyan-400 inline" />
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Encrypted & Ephemeral
              </p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Anonymous Identity Badge */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-950/40">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Your Session Identity</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-cyan-400 shrink-0 font-bold text-sm">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100 truncate">
                  {currentUser?.username || "Anonymous"}
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  UID: {currentUser?.uid ? `${currentUser.uid.slice(0, 10)}...` : "—"}
                </div>
              </div>
            </div>

            <button
              onClick={refreshNickname}
              title="Generate new alias"
              className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Rooms */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Public Live Rooms</span>
          </div>

          {ROOMS.map((room) => {
            const IconComponent = ICON_MAP[room.id] || MessageSquare;
            return (
              <NavLink
                key={room.id}
                to={`/room/${room.id}`}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-slate-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3 truncate">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="truncate">{room.name}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>24h Ephemeral Buffer</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Messages auto-expire 24h after posting. No logs retained.
          </p>
        </div>
      </aside>
    </>
  );
}
