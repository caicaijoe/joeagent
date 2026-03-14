"use client";

import { useEffect, useState } from "react";

export default function TypewriterText({
  text,
  speed = 20,
  onComplete,
  onProgress,
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (typeof onProgress === "function") {
      onProgress(displayedText);
    }
  }, [displayedText, onProgress]);

  useEffect(() => {
    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);

      return () => clearTimeout(timer);
    }

    if (!isComplete) {
      setIsComplete(true);

      if (typeof onComplete === "function") {
        onComplete();
      }
    }
  }, [displayedText, text, speed, isComplete, onComplete]);

  return (
    <span
      aria-live="polite"
      className="font-mono text-agent-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]"
    >
      {displayedText}
      {!isComplete && (
        <span className="ml-0.5 inline-block animate-pulse">_</span>
      )}
    </span>
  );
}
