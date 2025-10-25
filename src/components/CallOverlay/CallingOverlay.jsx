import React from "react";
import ReactDOM from "react-dom";

const CallingOverlay = ({ calleeName, onCancel }) => {
  return ReactDOM.createPortal(
    <div className="fixed bottom-5 right-5 bg-white shadow-lg rounded-xl p-4 w-80">
      <p className="font-bold text-black">Calling {calleeName}...</p>
      <p className="text-gray-600 mt-2">Ringing...</p>
      <div className="flex justify-center mt-4">
        <button className="bg-red-500 px-4 py-2 rounded-lg" onClick={onCancel}>
          End Call
        </button>
      </div>
    </div>,
    document.body
  );
};

export default CallingOverlay;
