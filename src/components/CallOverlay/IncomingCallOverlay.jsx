import React from "react";
import ReactDOM from "react-dom";

const IncomingCallOverlay = ({ callerName, onAccept, onReject }) => {
  return ReactDOM.createPortal(
    <div className="fixed bottom-5 right-5 bg-white shadow-lg rounded-xl p-4 w-80">
      <p className="font-bold text-black">Incoming Call from {callerName}</p>
      <div className="flex justify-between mt-4">
        <button
          className="bg-green-500 px-4 py-2 rounded-lg"
          onClick={onAccept}
        >
          Accept
        </button>
        <button className="bg-red-500 px-4 py-2 rounded-lg" onClick={onReject}>
          Reject
        </button>
      </div>
    </div>,
    document.body
  );
};

export default IncomingCallOverlay;
