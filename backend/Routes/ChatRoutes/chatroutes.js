const express = require("express");
const { processUserMessage } = require("../../services/chat.service");
const { verifyToken } = require("../../config/auth.config");

const chatRouter = express.Router();
chatRouter.use(express.json());

chatRouter.post("/", async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ message: "Please provide a valid query message." });
  }

  // Extract optional authenticated user identity safely from token
  let authenticatedUser = null;
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader && (authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader);

  if (token) {
    try {
      authenticatedUser = verifyToken(token);
    } catch (e) {
      // Unauthenticated visitor
    }
  }

  try {
    const result = await processUserMessage(message, authenticatedUser);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Chatbot processing error:", err.message);
    return res.status(500).json({
      reply: "Sorry, I am having trouble answering right now. Please try again or check the menu directly.",
      intent: "error",
    });
  }
});

module.exports = chatRouter;
