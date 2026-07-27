import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import { ROOMS } from "../routes";
import { db, ref, push, set, onValue, off, get24HourTimestampCutoff } from "../firebase";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const MAX_CHAR_LIMIT = 500;

export default function ChatRoom({ roomId }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Find room metadata
  const currentRoom = ROOMS.find((r) => r.id === roomId) || ROOMS[0];

  // Format local time (e.g., "10:42 AM")
  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  };

  // Firebase Real-time Listener & 24h Filter
  useEffect(() => {
    setLoading(true);
    const messagesRef = ref(db, `messages/${roomId}`);

    const channelName = `anon_chat_room_${roomId}`;
    let bc;
    try {
      bc = new BroadcastChannel(channelName);
    } catch (e) {
      // fallback
    }

    const localStoreKey = `anon_chat_msgs_${roomId}`;
    const getLocalFallbackMsgs = () => {
      try {
        const stored = localStorage.getItem(localStoreKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const cutoff = get24HourTimestampCutoff();
          return parsed.filter((m) => m.timestamp >= cutoff);
        }
      } catch (e) {
        console.error("Failed loading fallback msgs", e);
      }
      return [];
    };

    let unsubscriber = null;

    try {
      unsubscriber = onValue(
        messagesRef,
        (snapshot) => {
          const data = snapshot.val();
          const cutoff = get24HourTimestampCutoff();
          let msgList = [];

          if (data) {
            msgList = Object.entries(data)
              .map(([id, value]) => ({ id, ...value }))
              .filter((msg) => msg.timestamp && msg.timestamp >= cutoff)
              .sort((a, b) => a.timestamp - b.timestamp);
          }

          if (msgList.length === 0) {
            const fallback = getLocalFallbackMsgs();
            if (fallback.length > 0) {
              msgList = fallback;
            }
          }

          setMessages(msgList);
          setLoading(false);
          setTimeout(() => scrollToBottom(false), 50);
        },
        (error) => {
          const fallback = getLocalFallbackMsgs();
          setMessages(fallback);
          setLoading(false);
        }
      );
    } catch (err) {
      const fallback = getLocalFallbackMsgs();
      setMessages(fallback);
      setLoading(false);
    }

    if (bc) {
      bc.onmessage = (event) => {
        if (event.data && event.data.type === "NEW_MESSAGE") {
          const newMsg = event.data.message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp);
          });
          setTimeout(() => scrollToBottom(true), 50);
        }
      };
    }

    return () => {
      if (unsubscriber) unsubscriber();
      if (bc) bc.close();
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || trimmed.length > MAX_CHAR_LIMIT || !currentUser) return;

    const now = Date.now();
    const messagePayload = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 7)}`,
      text: trimmed,
      senderId: currentUser.uid,
      senderName: currentUser.username,
      timestamp: now,
      expireAt: now + TWENTY_FOUR_HOURS_MS,
    };

    setInputText("");

    setMessages((prev) => [...prev, messagePayload]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const localStoreKey = `anon_chat_msgs_${roomId}`;
      const stored = localStorage.getItem(localStoreKey);
      const prevMsgs = stored ? JSON.parse(stored) : [];
      const updatedLocal = [...prevMsgs, messagePayload].filter(
        (m) => m.timestamp >= now - TWENTY_FOUR_HOURS_MS
      );
      localStorage.setItem(localStoreKey, JSON.stringify(updatedLocal));
    } catch (e) {
      // fallback
    }

    try {
      const bc = new BroadcastChannel(`anon_chat_room_${roomId}`);
      bc.postMessage({ type: "NEW_MESSAGE", message: messagePayload });
      bc.close();
    } catch (e) {
      // ignore
    }

    try {
      const messagesRef = ref(db, `messages/${roomId}`);
      const newMsgRef = push(messagesRef);
      await set(newMsgRef, messagePayload);
    } catch (err) {
      // fallback
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-black text-zinc-200 overflow-hidden relative font-sans">
      {/* ROOM HEADER */}
      <header className="px-5 py-3.5 bg-black border-b border-zinc-800 flex items-center justify-between z-20 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-base text-zinc-100 truncate">
              #{currentRoom.name}
            </h2>
            <span className="text-[11px] font-mono text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded">
              Live
            </span>
          </div>
          <p className="text-xs text-zinc-500 truncate mt-0.5">
            {currentRoom.description}
          </p>
        </div>

        <div className="hidden sm:block text-[11px] font-mono text-zinc-500 border border-zinc-800 px-2.5 py-1 rounded">
          24h Ephemeral
        </div>
      </header>

      {/* MESSAGE LIST */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-black">
        {loading ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-xs font-mono">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center px-4 space-y-1">
            <p className="text-sm font-medium text-zinc-400">
              No messages in #{currentRoom.name}
            </p>
            <p className="text-xs text-zinc-500 max-w-sm">
              Send a message to start the conversation. Messages expire automatically after 24 hours.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;

            return (
              <div
                key={msg.id || msg.timestamp}
                className={`flex flex-col animate-message ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                {/* Sender Header */}
                <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-500 mb-1 px-1">
                  <span className={isMe ? "text-zinc-300 font-medium" : "text-zinc-400"}>
                    {isMe ? "You" : msg.senderName || "Anonymous"}
                  </span>
                  <span>•</span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>

                {/* Bubble Content */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 rounded text-sm leading-relaxed break-words ${
                    isMe
                      ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                      : "bg-zinc-900 text-zinc-200 border border-zinc-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* MESSAGE INPUT FORM */}
      <footer className="p-3 sm:p-4 bg-black border-t border-zinc-800 z-20 shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center space-x-2 bg-black rounded border border-zinc-800 focus-within:border-zinc-600 px-3 py-1.5 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${currentRoom.name}...`}
              maxLength={MAX_CHAR_LIMIT}
              className="flex-1 bg-transparent px-1 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />

            <div className="text-[11px] font-mono text-zinc-500 px-1 shrink-0">
              <span className={inputText.length >= MAX_CHAR_LIMIT ? "text-zinc-300 font-bold" : ""}>
                {inputText.length}
              </span>
              <span>/{MAX_CHAR_LIMIT}</span>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || inputText.length > MAX_CHAR_LIMIT}
              className="px-3 py-1.5 text-xs font-medium font-mono text-zinc-200 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 rounded border border-zinc-700 transition-colors shrink-0"
            >
              Send
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}