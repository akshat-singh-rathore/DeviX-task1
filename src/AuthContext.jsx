import { createContext, useContext, useState, useEffect } from "react";
import { auth, signInAnonymously } from "./firebase";

const AuthContext = createContext(null);

const SESSION_KEY = "chat_user_session";

function generateFriendlyNickname() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `Anon-${randomNum}`;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      // Check sessionStorage for active chat_user_session
      const savedSession = sessionStorage.getItem(SESSION_KEY);
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.uid && parsed.username) {
            setCurrentUser(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to parse saved session from sessionStorage:", e);
        }
      }

      // If no session exists, execute Firebase signInAnonymously(auth)
      let firebaseUid = null;
      try {
        const userCredential = await signInAnonymously(auth);
        firebaseUid = userCredential.user?.uid;
      } catch (err) {
        console.warn("Firebase anonymous authentication notice (falling back to session UID if offline/mock):", err);
      }

      const uid = firebaseUid || `anon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const username = generateFriendlyNickname();
      const newSession = { uid, username };

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      setCurrentUser(newSession);
      setLoading(false);
    }

    initAuth();
  }, []);

  const refreshNickname = () => {
    if (!currentUser) return;
    const newName = generateFriendlyNickname();
    const updated = { ...currentUser, username: newName };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    setCurrentUser(updated);
  };

  const value = {
    currentUser,
    loading,
    refreshNickname,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
