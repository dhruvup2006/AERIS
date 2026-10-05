"use client";

import { motion, useReducedMotion } from "framer-motion";
import React, { useId, useState } from "react";
import { useTheme } from "next-themes";

export function HudButton({ 
  children, 
  variant = "primary", 
  style = "style1",
  size = "default",
  onClick, 
  delay = 0,
  enableAnimations = true,
  className = ""
}) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;
  const [isHovered, setIsHovered] = useState(false);
  
  let isDark = true;
  try {
    const themeContext = useTheme();
    if (themeContext && themeContext.theme) {
      isDark = themeContext.theme === "dark";
    }
  } catch (e) {
    isDark = true;
  }

  const getColors = () => {
    if (variant === "primary") {
      return {
        main: isDark ? "#38bdf8" : "#0284c7",
        bg: isDark ? "rgba(14, 165, 233, 0.15)" : "rgba(2, 132, 199, 0.1)",
        text: isDark ? "text-sky-300" : "text-sky-700",
        border: isDark ? "#38bdf8" : "#0284c7"
      };
    } else if (variant === "danger") {
      return {
        main: "#ef4444",
        bg: "rgba(239, 68, 68, 0.12)",
        text: "text-red-400",
        border: "#ef4444"
      };
    } else {
      return {
        main: isDark ? "#64748b" : "#374151",
        bg: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        text: isDark ? "text-zinc-300" : "text-gray-700",
        border: isDark ? "#3f3f46" : "#cbd5e1"
      };
    }
  };

  const colors = getColors();

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return "px-3 py-1.5 text-xs font-semibold";
      case "large":
        return "px-6 py-3 text-base font-semibold";
      default:
        return "px-4 py-2 text-sm font-semibold";
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-flex items-center justify-center rounded-lg tracking-wide transition-all duration-150 border cursor-pointer ${getSizeStyles()} ${colors.text} ${className}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        boxShadow: isHovered && variant === "primary" ? "0 0 12px rgba(56, 189, 248, 0.3)" : undefined
      }}
    >
      <span className="relative z-10 flex items-center gap-1.5 uppercase font-medium">
        {children}
      </span>
    </button>
  );
}
