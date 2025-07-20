"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { chatService, ChatContext } from "@/services/chatService";
import ReactMarkdown from "react-markdown";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal = ({ isOpen, onClose }: ChatModalProps) => {
  const [context, setContext] = useState<ChatContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
    setInput,
  } = useChat({
    api: "http://localhost:3005/api/chat/stream",
    initialMessages: [],
    onFinish: (message) => {
      saveChatHistory([...messages, message]);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
      loadContext();
    }
  }, [isOpen]);

  const loadChatHistory = () => {
    try {
      const stored = localStorage.getItem("chat-history");
      if (stored) {
        const history = JSON.parse(stored);
        setMessages(history);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const saveChatHistory = (newMessages: any[]) => {
    try {
      localStorage.setItem("chat-history", JSON.stringify(newMessages));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  const loadContext = async () => {
    try {
      const ctx = await chatService.getChatContext();
      setContext(ctx);
    } catch (error) {
      console.error("Error loading context:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem("chat-history");
  };

  if (!isOpen) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-4 bg-dark bg-opacity-50"
      style={{
        zIndex: 1050,
      }}
    >
      <div
        className="bg-light rounded shadow-lg w-100 d-flex flex-column"
        style={{ maxWidth: "700px", height: "80vh" }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-light">
          <div className="d-flex align-items-center">
            <MessageSquare className="me-2 text-primary" size={20} />
            <h3 className="h5 mb-0 fw-semibold text-dark">
              Asistente de CAPREPA
            </h3>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={clearHistory}
              className="btn btn-sm btn-outline-secondary"
            >
              Limpiar
            </button>
            <button
              onClick={onClose}
              className="btn btn-sm btn-close"
              aria-label="Close"
            ></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-fill overflow-auto p-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted mt-5">
              <MessageSquare className="mx-auto mb-3 text-muted" size={48} />
              <p className="mb-0">
                ¡Pregúntame cualquier cosa sobre el sistema CAPREPA!
              </p>
              {context && (
                <div className="p-1 bg-light rounded mb-3">
                  <div className="d-grid gap-1">
                    {context?.exampleQueries.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(query)}
                        className="btn btn-link text-primary text-decoration-none text-start p-1 small"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="d-grid gap-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`d-flex ${
                    message.role === "user"
                      ? "justify-content-end"
                      : "justify-content-start"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-light text-dark"
                    }`}
                    style={{ maxWidth: "70%" }}
                  >
                    <div className="mb-0">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0">{children}</p>
                          ),
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-secondary bg-opacity-25 px-1 rounded small">
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-secondary bg-opacity-25 p-2 rounded small overflow-auto">
                                <code>{children}</code>
                              </pre>
                            );
                          },
                          ul: ({ children }) => (
                            <ul className="mb-2">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="mb-2">{children}</ol>
                          ),
                          li: ({ children }) => (
                            <li className="mb-1">{children}</li>
                          ),
                          h1: ({ children }) => (
                            <h5 className="fw-bold mb-2">{children}</h5>
                          ),
                          h2: ({ children }) => (
                            <h6 className="fw-bold mb-2">{children}</h6>
                          ),
                          h3: ({ children }) => (
                            <h6 className="fw-semibold mb-2">{children}</h6>
                          ),
                          strong: ({ children }) => (
                            <strong className="fw-bold">{children}</strong>
                          ),
                          em: ({ children }) => (
                            <em className="fst-italic">{children}</em>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-top">
          <form onSubmit={handleSubmit} className="d-flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Preguntame sobre el sistema CAPREPA..."
              className="form-control"
              disabled={status === "streaming"}
            />
            <button
              type="submit"
              disabled={!input.trim() || status === "streaming"}
              className="btn btn-primary d-flex align-items-center"
            >
              {status === "streaming" ? (
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
