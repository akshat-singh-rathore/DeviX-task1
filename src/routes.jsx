import React from "react";
import { createBrowserRouter, Navigate, useParams } from "react-router";
import App from "./App";
import ChatRoom from "./components/ChatRoom";

export const ROOMS = [
  {
    id: "general",
    name: "General",
    description: "Central discussion for all anonymous members.",
  },
  {
    id: "confessions",
    name: "Confessions",
    description: "Anonymous secrets and thoughts off the record.",
  },
  {
    id: "advice",
    name: "Advice",
    description: "Anonymous feedback and life advice.",
  },
  {
    id: "random",
    name: "Random",
    description: "Casual chatter and random topics.",
  },
  {
    id: "tech-talk",
    name: "Tech-Talk",
    description: "Software, tech, and development discussions.",
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