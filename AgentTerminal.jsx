"use client";

import { useEffect, useRef, useState } from "react";
import TypewriterText from "./TypewriterText";

const BOOT_MESSAGE =
  "JOEAGENT v2.0. OPENAI LINK READY. OPERATOR CHANNEL SYNCHRONIZED.";

const FALLBACK_REPLY = "[SYSTEM_ERROR] NEURAL LINK DISCONNECTED.";

const createMessage = (role, content, options = {}) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  role,
  content,
  typed: role === "user",
  localOnly: false,
  ...options,
});

const createInitialHistory = () => [
  createMessage("assistant", BOOT_MESSAGE, {
    typed: false,
    localOnly: true,
  }),
];

const toApiHistory = (messages) =>
  messages
    .filter((message) => !message.localOnly)
    .map(({ role, content }) => ({ role, content }));

export default function AgentTerminal({
  isAgentProcessing,
  setIsAgentProcessing,
}) {
  const [history, setHistory] = useState(() => createInitialHistory());
  const [input, setInput] = useState("");
  const [isBootTyping, setIsBootTyping] = useState(true);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const isMountedRef = useRef(true);
  const pendingReplyIdRef = useRef(null);

  const isBusy = isBootTyping || isAgentProcessing;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: history.length > 1 ? "smooth" : "auto",
    });
  }, [history]);

  useEffect(() => {
    if (!isBusy) {
      inputRef.current?.focus();
    }
  }, [isBusy]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  };

  const appendAgentMessage = (content) => {
    const message = createMessage("assistant", content, { typed: false });

    pendingReplyIdRef.current = message.id;
    setHistory((prev) => [...prev, message]);
  };

  const handleAgentComplete = (messageId) => {
    setHistory((prev) =>
      prev.map((message) =>
        message.id === messageId ? { ...message, typed: true } : message
      )
    );

    if (messageId === history[0]?.id) {
      setIsBootTyping(false);
    }

    if (pendingReplyIdRef.current === messageId) {
      pendingReplyIdRef.current = null;
      setIsAgentProcessing(false);
    }
  };

  const handleSubmit = async (event) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();

    const value = input.trim();

    if (!value || isBusy) {
      return;
    }

    const userMessage = createMessage("user", value);
    const nextHistory = [...history, userMessage];

    setHistory(nextHistory);
    setInput("");
    setIsAgentProcessing(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: toApiHistory(nextHistory),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      const reply =
        typeof payload.reply === "string" && payload.reply.trim()
          ? payload.reply.trim()
          : FALLBACK_REPLY;

      if (!isMountedRef.current) {
        return;
      }

      if (!response.ok) {
        console.error("JOEAGENT route returned a non-OK response:", payload);
      }

      appendAgentMessage(reply);
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      console.error("JOEAGENT terminal fetch error:", error);
      appendAgentMessage(FALLBACK_REPLY);
    }
  };

  return (
    <div className="flex h-full min-h-[300px] w-full flex-col overflow-hidden border border-agent-gold-dark bg-agent-black/80 backdrop-blur-md sm:min-h-[360px]">
      <div className="flex items-center justify-between gap-3 border-b border-agent-gold-dark/70 bg-agent-gold/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-agent-gold-dark">
        <span>[ JOEAGENT_TERMINAL_SECURE_LINK ]</span>
        <span className={isAgentProcessing ? "text-agent-gold" : "text-agent-gold-dark/80"}>
          {isAgentProcessing ? "PROCESSING" : "STANDBY"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 font-mono text-sm leading-relaxed">
        <div className="space-y-3">
          {history.map((message) => (
            <div key={message.id} className="break-words">
              {message.role === "user" ? (
                <div className="text-gray-300">{message.content}</div>
              ) : message.typed ? (
                <div className="font-mono text-agent-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">
                  {message.content}
                </div>
              ) : (
                <TypewriterText
                  text={message.content}
                  onComplete={() => handleAgentComplete(message.id)}
                  onProgress={scrollToBottom}
                />
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-agent-gold-dark/70 bg-agent-black/70 px-4 py-3 font-mono text-sm">
        <span className="shrink-0 text-agent-gold">OPERATOR@JOE&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          disabled={isBusy}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleSubmit}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          className="w-full border-none bg-transparent font-mono text-agent-gold outline-none placeholder:text-agent-gold-dark/70 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder={
            isBootTyping
              ? "INITIALIZING NEURAL LINK..."
              : isAgentProcessing
                ? "EXECUTING MARKET INFERENCE..."
                : "ASK JOEAGENT ANYTHING"
          }
        />
      </div>
    </div>
  );
}
