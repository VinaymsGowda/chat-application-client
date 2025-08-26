import React, { useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import { Info } from "lucide-react";
import { useDispatch } from "react-redux";
import { fetchChats } from "../../redux/features/Chat/Chat";

function Conversations() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchChats(""));
  }, [dispatch]);

  return (
    <div className="h-full flex items-center justify-center p-8 bg-gray-50">
      <div className="text-center">
        <div className="mx-auto bg-gray-200 rounded-full h-24 w-24 flex items-center justify-center mb-4">
          <Info size={32} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-gray-800 mb-2">
          No Chat selected
        </h3>
        <p className="text-gray-500 max-w-sm">
          Select a Chat or search users to start a new conversation.
        </p>
      </div>
    </div>
  );
}

export default Conversations;
