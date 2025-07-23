"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import ChatModal from "./ChatModal";

const ChatFloatingButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center position-fixed shadow"
        style={{
          bottom: "1.5rem",
          right: "1.5rem",
          width: "3.5rem",
          height: "3.5rem",
          zIndex: 1040,
        }}
        title="Open Budget Assistant"
      >
        <MessageSquare size={24} />

        {/* Pulse animation */}
        <div
          className="position-absolute bg-primary rounded-circle"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            animation: "pulse 2s infinite",
            opacity: 0.75,
          }}
        ></div>
      </button>

      <ChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default ChatFloatingButton;
