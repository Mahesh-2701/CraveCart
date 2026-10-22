require("dotenv").config();
const jwt = require("jsonwebtoken");

const PRIMARY_SECRET = process.env.JWT_SECRET || process.env.SECRET_TOKEN || "asdfghjkl";
const LEGACY_SECRETS = ["asdfghjkl", "mahiraji", "rajimahi", "mahesh"];

function signToken(payload, options = { expiresIn: "24h" }) {
  return jwt.sign(payload, PRIMARY_SECRET, options);
}

function verifyToken(token) {
  // Try primary secret first
  try {
    return jwt.verify(token, PRIMARY_SECRET);
  } catch (primaryErr) {
    // Attempt fallback verification against legacy route-specific secrets to preserve existing sessions
    for (const secret of LEGACY_SECRETS) {
      if (secret === PRIMARY_SECRET) continue;
      try {
        return jwt.verify(token, secret);
      } catch (err) {
        // Continue trying
      }
    }
    throw primaryErr;
  }
}

module.exports = {
  PRIMARY_SECRET,
  signToken,
  verifyToken,
};
