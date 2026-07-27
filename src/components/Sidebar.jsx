import React from "react";
import { NavLink } from "react-router";
import { useAuth } from "../AuthContext";
import { ROOMS } from "../routes";

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, refreshNickname } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-black border-r border-zinc-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-base tracking-tight text-zinc-100">
              AnonChat
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Ephemeral • 24h
            </p>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-800 rounded md:hidden"
            aria-label="Close menu"
          >
            Close
          </button>
        </div>

        {/* User Identity Session */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
            Current Identity
          </div>

          <div className="flex items-center justify-between p-2.5 rounded border border-zinc-800 bg-zinc-900">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-zinc-100 truncate">
                {currentUser?.username || "Anonymous"}
              </div>
              <div className="text-[10px] font-mono text-zinc-500 truncate">
                {currentUser?.uid ? currentUser.uid.slice(0, 14) : "—"}
              </div>
            </div>

            <button
              onClick={refreshNickname}
              className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 shrink-0 transition-colors"
              title="Generate new alias"
            >
              New ID
            </button>
          </div>
        </div>

        {/* Navigation Rooms */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-2 pb-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            Rooms
          </div>

          {ROOMS.map((room) => (
            <NavLink
              key={room.id}
              to={`/room/${room.id}`}
              onClick={onClose}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 font-semibold border-l-2 border-zinc-400"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`
              }
            >
              {room.name}
            </NavLink>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-800 text-[11px] text-zinc-500 font-mono">
          Messages automatically expire after 24 hours.
        </div>
      </aside>
    </>
  );
}
