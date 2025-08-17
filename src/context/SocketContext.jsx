import React, { useState, useEffect, createContext, useContext } from "react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "../redux/features/Auth/User";
import { io } from "socket.io-client";

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

function SocketProvider({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectUser);

  const [socket] = useState(() =>
    io(import.meta.env.VITE_SERVER_URL, { autoConnect: false })
  );

  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      socket.connect();
      socket.on("connect", () => {
        socket.emit("user-room", currentUser.id);
      });
    } else {
      socket.disconnect();
    }

    return () => {
      socket.off("connect");
    };
  }, [isAuthenticated, currentUser?.id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketProvider;
