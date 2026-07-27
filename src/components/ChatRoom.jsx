import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import { ROOMS } from "../routes";
import { db, ref, push, set, onValue, off, get24HourTimestampCutoff } from "../firebase";

import {
  Send,
  Smile,
  MessageSquare,
  Lock,
  Lightbulb,
  Shuffle,
  Code,
  Clock,
  Radio,
  User,
  Info,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const ICON_MAP = {
  general: MessageSquare,
  confessions: Lock,
  advice: Lightbulb,
  random: Shuffle,
  "tech-talk": Code,
};

const EMOJI_LIST = ["😊", "😂", "🔥", "🚀", "💡", "🤫", "💯", "👍", "👀", "✨"];

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const MAX_CHAR_LIMIT = 500;

export default function ChatRoom({ roomId }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Find room metadata
  const currentRoom = ROOMS.find((r) => r.id === roomId) || ROOMS[0];
  const RoomIcon = ICON_MAP[currentRoom.id] || MessageSquare;

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

  // 1. Firebase Real-time Listener & 24h Filter
  useEffect(() => {
    setLoading(true);
    const messagesRef = ref(db, `messages/${roomId}`);

    // BroadcastChannel fallback for multi-tab testing if Firebase is offline/mock
    const channelName = `anon_chat_room_${roomId}`;
    let bc;
    try {
      bc = new BroadcastChannel(channelName);
    } catch (e) {
      console.warn("BroadcastChannel not supported", e);
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
          const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
          let msgList = [];

          if (data) {
            msgList = Object.entries(data)
              .map(([id, value]) => ({ id, ...value }))
              .filter((msg) => msg.timestamp && msg.timestamp >= cutoff)
              .sort((a, b) => a.timestamp - b.timestamp);
          }

          // Combine with any local session items if snapshot is empty
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
          console.warn("Firebase listener notice (using local BroadcastChannel fallback):", error);
          const fallback = getLocalFallbackMsgs();
          setMessages(fallback);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn("Firebase onValue error:", err);
      const fallback = getLocalFallbackMsgs();
      setMessages(fallback);
      setLoading(false);
    }

    // BroadcastChannel listener
    if (bc) {
      bc.onmessage = (event) => {
        if (event.data && event.data.type === "NEW_MESSAGE") {
          const newMsg = event.data.message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const updated = [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp);
            return updated;
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

  // Scroll to bottom when messages array changes
  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // 2. Handle Send Message
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
    setShowEmojiPicker(false);

    // Save to local state immediately for instant feedback
    setMessages((prev) => [...prev, messagePayload]);
    setTimeout(() => scrollToBottom(true), 50);

    // Save to localStorage fallback
    try {
      const localStoreKey = `anon_chat_msgs_${roomId}`;
      const stored = localStorage.getItem(localStoreKey);
      const prevMsgs = stored ? JSON.parse(stored) : [];
      const updatedLocal = [...prevMsgs, messagePayload].filter(
        (m) => m.timestamp >= now - TWENTY_FOUR_HOURS_MS
      );
      localStorage.setItem(localStoreKey, JSON.stringify(updatedLocal));
    } catch (e) {
      console.error("Failed saving to local fallback", e);
    }

    // Broadcast to other local browser tabs
    try {
      const bc = new BroadcastChannel(`anon_chat_room_${roomId}`);
      bc.postMessage({ type: "NEW_MESSAGE", message: messagePayload });
      bc.close();
    } catch (e) {
      // ignore
    }

    // Push to Firebase Realtime Database
    try {
      const messagesRef = ref(db, `messages/${roomId}`);
      const newMsgRef = push(messagesRef);
      await set(newMsgRef, messagePayload);
    } catch (err) {
      console.warn("Firebase push notice (message kept in ephemeral local session):", err);
    }
  };

  const addEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
    if (inputRef.current) inputRef.current.focus();
  };

  // Helper to generate deterministic avatar gradient per username
  const getAvatarGradient = (name) => {
    const gradients = [
      "from-cyan-500 to-blue-600",
      "from-purple-500 to-indigo-600",
      "from-emerald-500 to-teal-600",
      "from-rose-500 to-pink-600",
      "from-amber-500 to-orange-600",
    ];
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* 1. ROOM HEADER */}
      <header className="px-6 py-4 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-20 shrink-0 shadow-md">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${currentRoom.color} shadow-lg text-white shrink-0`}>
            <RoomIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-lg text-slate-100 truncate">
                #{currentRoom.name}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-online mr-1.5" />
                Live • Online
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {currentRoom.description}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>24h Auto-Expire Buffer</span>
        </div>
      </header>

      {/* 2. MESSAGE LIST CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative bg-slate-950/60">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Connecting to room...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="font-semibold text-slate-200 text-base">
                No messages yet in #{currentRoom.name}
              </h3>
              <p className="text-xs text-slate-400">
                Be the first anonymous voice to start the conversation! All messages automatically vanish after 24 hours.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;

            return (
              <div
                key={msg.id || msg.timestamp}
                className={`flex items-end space-x-2.5 animate-message ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar for foreign messages */}
                {!isMe && (
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                      msg.senderName
                    )} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md`}
                    title={msg.senderName}
                  >
                    {msg.senderName ? msg.senderName.charAt(5) || "A" : "A"}
                  </div>
                )}

                {/* Bubble Container */}
                <div className={`max-w-[85%] sm:max-w-[70%] space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                  {/* Sender Header */}
                  <div className={`flex items-center space-x-2 text-[11px] text-slate-400 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className="font-medium text-slate-300">
                      {isMe ? "You" : msg.senderName || "Anonymous"}
                    </span>
                    <span>•</span>
                    <span>{formatTime(msg.timestamp)}</span>
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed break-words shadow-md transition-all ${
                      isMe
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none border border-cyan-400/20"
                        : "bg-slate-900/90 text-slate-100 rounded-bl-none border border-slate-800/80 glass-card"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                {/* Avatar for own messages */}
                {isMe && (
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. EMOJI PICKER OVERLAY */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-6 z-30 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-md flex items-center gap-1.5 animate-message">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="p-2 text-lg hover:bg-slate-800 rounded-xl transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* 4. MESSAGE INPUT FORM */}
      <footer className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md z-20 shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto space-y-2">
          <div className="relative flex items-center bg-slate-950/80 rounded-2xl border border-slate-800 focus-within:border-cyan-500/60 transition-colors shadow-inner px-3 py-1.5">
            {/* Emoji Toggle */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="p-2 text-slate-400 hover:text-cyan-400 transition-colors rounded-xl hover:bg-slate-800/50 shrink-0"
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Main Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Send anonymous message to #${currentRoom.name}...`}
              maxLength={MAX_CHAR_LIMIT}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
            />

            {/* Character Counter */}
            <div className="text-[11px] text-slate-400 font-mono px-2 shrink-0">
              <span className={inputText.length >= MAX_CHAR_LIMIT ? "text-rose-400 font-bold" : ""}>
                {inputText.length}
              </span>
              <span className="text-slate-400">/{MAX_CHAR_LIMIT}</span>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || inputText.length > MAX_CHAR_LIMIT}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-md hover:shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 ml-1"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}