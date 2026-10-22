import React, { useState, useRef, useEffect } from "react";
import api from "../config/api";

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am your CraveCart AI Concierge. Ask me about menus, vegetarian picks, discounts, or your live order delivery status.",
      suggestions: [
        "Where is my order?",
        "Show active coupons",
        "Find spicy biryani",
        "Top-rated restaurants",
      ],
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
          text: "I am having trouble connecting with our kitchen network. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Launcher */}
      <button
        type="button"
        className="btn btn-crave-primary shadow-lg position-fixed d-flex align-items-center justify-content-center"
        style={{
          bottom: "24px",
          right: "24px",
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          zIndex: 1050,
          border: "2px solid #FFFFFF",
          boxShadow: "0 8px 24px rgba(255, 82, 0, 0.4)",
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Food Assistant"
      >
        {isOpen ? (
          <i className="bi bi-x-lg fs-5"></i>
        ) : (
          <i className="bi bi-chat-dots-fill fs-5"></i>
        )}
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div
          className="glass-panel position-fixed overflow-hidden d-flex flex-column shadow-xl"
          style={{
            bottom: "94px",
            right: "24px",
            width: "390px",
            maxWidth: "calc(100vw - 32px)",
            height: "530px",
            maxHeight: "calc(100vh - 120px)",
            borderRadius: "24px",
            zIndex: 1050,
            border: "1px solid rgba(255, 82, 0, 0.2)",
          }}
        >
          {/* Header */}
          <div
            className="p-3 text-white d-flex justify-content-between align-items-center"
            style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center border border-primary border-opacity-50"
                style={{ width: "36px", height: "36px" }}
              >
                <i className="bi bi-robot fs-5 text-white"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold font-heading text-white">CraveCart AI Concierge</h6>
                <small className="d-flex align-items-center gap-1 text-light opacity-75" style={{ fontSize: "11px" }}>
                  <span
                    className="d-inline-block rounded-circle bg-success"
                    style={{ width: "6px", height: "6px" }}
                  ></span>
                  Live Orders & Menu Intelligence
                </small>
              </div>
            </div>
            <button
              className="btn btn-sm text-white-50 p-1 border-0 hover-lift"
              onClick={() => setIsOpen(false)}
              aria-label="Close Assistant"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div
            className="flex-grow-1 p-3 overflow-y-auto"
            style={{ fontSize: "13.5px", backgroundColor: "#F8FAFC" }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`d-flex mb-3 ${
                  msg.sender === "user" ? "justify-content-end" : "justify-content-start"
                }`}
              >
                <div
                  className={`p-3 rounded-4 shadow-xs ${
                    msg.sender === "user"
                      ? "bg-primary text-white"
                      : "bg-white text-dark border"
                  }`}
                  style={{
                    maxWidth: "86%",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.45",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  {msg.sender === "bot" && (
                    <div className="d-flex align-items-center gap-1 text-primary fw-semibold small mb-1">
                      <i className="bi bi-sparkles"></i> Crave Assistant
                    </div>
                  )}
                  {msg.text}

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 pt-2 border-top d-flex flex-wrap gap-1">
                      {msg.suggestions.map((sugg, i) => (
                        <button
                          key={i}
                          type="button"
                          className="btn btn-sm btn-crave-secondary py-1 px-2 rounded-pill font-heading"
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
                <div className="bg-white p-2 px-3 rounded-4 shadow-sm text-muted small border d-inline-flex align-items-center gap-2">
                  <span className="spinner-grow spinner-grow-sm text-primary" />
                  <span>Synthesizing kitchen knowledge...</span>
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
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <input
              type="text"
              className="form-control rounded-pill border-0 bg-light px-3 py-2"
              placeholder="Ask about foods, offers, status..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{ fontSize: "13px" }}
            />
            <button
              type="submit"
              className="btn btn-crave-primary rounded-circle d-flex align-items-center justify-content-center p-0"
              style={{ width: "38px", height: "38px", flexShrink: 0 }}
              disabled={!inputMessage.trim()}
              aria-label="Send message"
            >
              <i className="bi bi-send-fill fs-6"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
