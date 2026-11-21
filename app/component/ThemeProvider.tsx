"use client";

import { useEffect } from "react";

export default function ThemeProvider() {
  useEffect(() => {
    const applyTheme = () => {
      const savedColor = localStorage.getItem("anki-theme-color");

      const color =
        savedColor && /^#[0-9a-fA-F]{6}$/.test(savedColor)
          ? savedColor
          : "#718675";

      document.documentElement.style.setProperty(
        "--anki-theme-color",
        color
      );
    };

    applyTheme();

    window.addEventListener("storage", applyTheme);

    return () => {
      window.removeEventListener("storage", applyTheme);
    };
  }, []);

  return null;
}