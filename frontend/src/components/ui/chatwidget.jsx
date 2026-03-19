import { useState } from "react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5">
      {/* Chat Icon (when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition"
        >
          💬
        </button>
      )}

      {/* Chat Window (when open) */}
      {isOpen && (
        <div className="w-80 h-96 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b bg-blue-600 text-white rounded-t-2xl">
            <h2 className="font-semibold">Health Assistant</h2>
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 p-3 overflow-y-auto text-sm">
            <p className="text-gray-600">👋 Hello! How can I help you today?</p>
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
