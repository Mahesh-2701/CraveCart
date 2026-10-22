const { verifyToken } = require("../config/auth.config");

const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader && (authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader);

  if (!token) {
    return res.status(401).json({ message: "Authentication required. Please provide a valid Bearer token." });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    // Map legacy role aliases for seamless compatibility
    req.restaurant = payload.role === "restaurant" ? payload : req.restaurant;
    req.deliveryperson = (payload.role === "deliveryperson" || payload.role === "delivery") ? payload : req.deliveryperson;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please login again." });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthenticated request." });
    }

    const normalizedUserRole = (req.user.role || "").toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    // Role mapping aliases
    const aliases = {
      user: ["user", "customer"],
      customer: ["user", "customer"],
      delivery: ["delivery", "deliveryperson"],
      deliveryperson: ["delivery", "deliveryperson"],
      admin: ["admin"],
      restaurant: ["restaurant"],
    };

    const hasMatch = normalizedAllowed.some((role) => {
      if (role === normalizedUserRole) return true;
      if (aliases[role] && aliases[role].includes(normalizedUserRole)) return true;
      return false;
    });

    if (!hasMatch) {
      return res.status(403).json({
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

// Protect individual resource ownership (prevents IDOR)
const enforceOwnership = (paramField = "id") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Admins have override privileges for management
    if (req.user.role === "admin") {
      return next();
    }

    const targetId = req.params[paramField];
    const requesterId = req.user.id || req.user._id;

    if (targetId && requesterId && targetId.toString() !== requesterId.toString()) {
      return res.status(403).json({
        message: "Forbidden: You are not authorized to view or modify another account's resource.",
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
  enforceOwnership,
};
