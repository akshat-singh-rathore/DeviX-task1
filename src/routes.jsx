import React from "react";
import { createBrowserRouter, Navigate, useParams } from "react-router";
import App from "./App";
import ChatRoom from "./components/ChatRoom";

export const ROOMS = [
  {
    id: "general",
    name: "General",
    description: "Welcome to the central hangout hub for all anonymous chatter.",
    icon: "MessageSquare",
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: "confessions",
    name: "Confessions",
    description: "Share your secrets & raw thoughts completely off the record.",
    icon: "Lock",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "advice",
    name: "Advice",
    description: "Seek feedback, real life guidance, or sound judgment anonymously.",
    icon: "Lightbulb",
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "random",
    name: "Random",
    description: "Memes, random shower thoughts, and unpredictable conversations.",
    icon: "Shuffle",
    color: "from-emerald-400 to-teal-500",
  },
  {
    id: "tech-talk",
    name: "Tech-Talk",
    description: "Discuss code, web dev, AI models, frameworks, and tech trends.",
    icon: "Code",
    color: "from-cyan-400 to-indigo-500",
  },
];

function RoomRouteWrapper() {
  const { roomId } = useParams();
  const isValidRoom = ROOMS.some((room) => room.id === roomId);

  if (!isValidRoom) {
    return <Navigate to="/room/general" replace />;
  }

  return <ChatRoom roomId={roomId} />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/room/general" replace />,
      },
      {
        path: "room/:roomId",
        element: <RoomRouteWrapper />,
      },
      {
        path: "*",
        element: <Navigate to="/room/general" replace />,
      },
    ],
  },
]);