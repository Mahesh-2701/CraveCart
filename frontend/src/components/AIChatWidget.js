import React, { useState, useRef, useEffect } from "react";
import api from "../config/api";

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I'm your **CraveCart Food Assistant**. Ask me about dishes, vegetarian options, active coupons, or your live order status!",
      suggestions: ["Where is my order?", "Show active coupons", "Find biryani", "Which restaurants are open?"],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    // Append user message
    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await api.post("/api/chat", { message: query });
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: response.data.reply,
          suggestions: response.data.suggestions || [],
          data: response.data.data,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I am having trouble reaching the kitchen right now. Please try again or check the menu directly.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        className="btn btn-primary-crave shadow-lg position-fixed d-flex align-items-center justify-content-center"
        style={{
          bottom: "24px",
          right: "24px",
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          zIndex: 1050,
          border: "2px solid #ffffff",
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Food Assistant"
      >
        {isOpen ? (
          <span style={{ fontSize: "22px", lineHeight: "1" }}>✕</span>
        ) : (
          <span style={{ fontSize: "24px", lineHeight: "1" }}>💬</span>
        )}
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div
          className="card shadow-xl border-0 position-fixed overflow-hidden d-flex flex-column"
          style={{
            bottom: "94px",
            right: "24px",
            width: "380px",
            maxWidth: "calc(100vw - 32px)",
            height: "520px",
            maxHeight: "calc(100vh - 120px)",
            borderRadius: "20px",
            zIndex: 1050,
            background: "#ffffff",
          }}
        >
          {/* Header */}
          <div
            className="p-3 text-white d-flex justify-content-between align-items-center"
            style={{ background: "linear-gradient(135deg, #FF5200 0%, #FF7A00 100%)" }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px", fontSize: "16px" }}
              >
                🤖
              </div>
              <div>
                <h6 className="mb-0 fw-bold">CraveCart Assistant</h6>
                <small className="opacity-90" style={{ fontSize: "11px" }}>
                  🟢 Live Data & Order Support
                </small>
              </div>
            </div>
            <button
              className="btn btn-sm text-white p-0 border-0 fs-5"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-grow-1 p-3 overflow-y-auto bg-light" style={{ fontSize: "13.5px" }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`d-flex mb-3 ${msg.sender === "user" ? "justify-content-end" : "justify-content-start"}`}
              >
                <div
                  className={`p-3 rounded-4 ${
                    msg.sender === "user"
                      ? "bg-primary text-white"
                      : "bg-white text-dark shadow-sm border"
                  }`}
                  style={{ maxWidth: "84%", whiteSpace: "pre-wrap", lineHeight: "1.45" }}
                >
                  {msg.text}

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 pt-2 border-top d-flex flex-wrap gap-1">
                      {msg.suggestions.map((sugg, i) => (
                        <button
                          key={i}
                          type="button"
                          className="btn btn-sm btn-outline-primary py-0 px-2 rounded-pill"
                          style={{ fontSize: "11px" }}
                          onClick={() => handleSendMessage(sugg)}
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="d-flex justify-content-start mb-2">
                <div className="bg-white p-2 px-3 rounded-4 shadow-sm text-muted small">
                  <span className="spinner-grow spinner-grow-sm text-primary me-1" />
                  Checking menu & orders...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2 bg-white border-top d-flex gap-2 align-items-center"
          >
            <input
              type="text"
              className="form-control rounded-pill border-0 bg-light px-3"
              placeholder="Ask about foods, offers, status..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{ fontSize: "13px" }}
            />
            <button
              type="submit"
              className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center p-0"
              style={{ width: "36px", height: "36px", flexShrink: 0 }}
              disabled={!inputMessage.trim()}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
