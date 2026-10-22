import React from "react";
import { Link } from "react-router-dom";

export default function CraveCartLogo({
  variant = "dark", // "dark", "light", "white"
  size = "md", // "sm", "md", "lg"
  clickable = true,
  to = "/",
  className = "",
}) {
  const sizeMap = {
    sm: { icon: 28, text: "fs-5" },
    md: { icon: 36, text: "fs-4" },
    lg: { icon: 46, text: "fs-2" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isLight = variant === "light" || variant === "white";

  const content = (
    <div className={`d-inline-flex align-items-center gap-2 text-decoration-none user-select-none ${className}`}>
      {/* Original CraveCart Circular 'C' Logo Emblem */}
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <circle cx="50" cy="50" r="48" fill="#FF6F00" />
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fontSize="46"
          fill="#FFFFFF"
          fontFamily="Outfit, -apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight="700"
        >
          C
        </text>
      </svg>

      {/* Brand Name Typography */}
      <span
        className={`fw-bold ${currentSize.text} tracking-tight ${isLight ? "text-white" : "text-dark"}`}
        style={{ letterSpacing: "-0.5px", lineHeight: 1 }}
      >
        Crave<span style={{ color: "#FF6F00" }}>Cart</span>
      </span>
    </div>
  );

  if (clickable) {
    return (
      <Link to={to} className="text-decoration-none d-inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}

