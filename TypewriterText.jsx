"use client";

import { useEffect, useState } from "react";
import useAgentSound from "./hooks/useAgentSound";

export default function TypewriterText({
  text,
  speed = 20,
  onComplete,
  onProgress,
}) {
  const { playTyping } = useAgentSound();
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
        playTyping();
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
  }, [displayedText, text, speed, isComplete, onComplete, playTyping]);

  return (
    <span
      aria-live="polite"
      className="font-mono whitespace-pre-wrap text-agent-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]"
    >
      {displayedText}
      {!isComplete && (
        <span className="ml-0.5 inline-block animate-pulse">_</span>
      )}
    </span>
  );
}
