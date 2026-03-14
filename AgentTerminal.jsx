"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import useAgentSound from "./hooks/useAgentSound";
import TypewriterText from "./TypewriterText";

const FALLBACK_REPLY = "[SYSTEM_ERROR] NEURAL LINK DISCONNECTED.";
const ALPHA_COMMAND = "/ALPHA";
const ALPHA_LOCKED_REPLY =
  "> ERROR: OPERATOR NOT INITIALIZED. ACTIVATE AI_LINK TO PROCEED.";
const QUICK_COMMANDS = ["/PRICE", "/MARKET", "/HELP"];
const BOOT_MESSAGE_ID = "boot-4";
const BOOT_SEQUENCE = [
  {
    id: "boot-1",
    content: "> JOEAGENT_CORE_v3.1 ONLINE.",
    typed: true,
  },
  {
    id: "boot-2",
    content: "> DIRECTIVE: LIQUIDITY OPTIMIZATION AND GOVERNANCE.",
    typed: true,
  },
  {
    id: "boot-3",
    content: "> PRIMARY TARGET: MERCHANT MOE [MANTLE NETWORK].",
    typed: true,
  },
  {
    id: BOOT_MESSAGE_ID,
    content: "> SYSTEMS PRIMED. AWAITING OPERATOR INPUT.",
    typed: false,
  },
];

const createMessage = (id, role, content, options = {}) => ({
  id,
  role,
  content,
  typed: role === "user",
  localOnly: false,
  ...options,
});

const createInitialHistory = () => [
  ...BOOT_SEQUENCE.map((message) =>
    createMessage(message.id, "assistant", message.content, {
      typed: message.typed,
      localOnly: true,
    })
  ),
];

const toApiHistory = (messages) =>
  messages
    .filter((message) => !message.localOnly)
    .map(({ role, content }) => ({ role, content }));

export default function AgentTerminal({
  isAgentProcessing,
  isAuthorized = false,
  setIsAgentProcessing,
}) {
  const { playEnter, playError, playConfirm } = useAgentSound();
  const [history, setHistory] = useState(() => createInitialHistory());
  const [input, setInput] = useState("");
  const [isBootTyping, setIsBootTyping] = useState(true);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const isMountedRef = useRef(true);
  const bootMessageIdRef = useRef(BOOT_MESSAGE_ID);
  const nextMessageIdRef = useRef(1);
  const pendingReplyIdRef = useRef(null);
  const submitLockRef = useRef(false);

  const isBusy = isBootTyping || isAgentProcessing;
  const quickCommands = isAuthorized
    ? [...QUICK_COMMANDS, ALPHA_COMMAND]
    : QUICK_COMMANDS;

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

  const createRuntimeMessage = (role, content, options = {}) => {
    const id = `msg-${nextMessageIdRef.current}`;
    nextMessageIdRef.current += 1;
    return createMessage(id, role, content, options);
  };

  const appendAgentMessage = (content, options = {}) => {
    const { pending = true, ...messageOptions } = options;
    const message = createRuntimeMessage("assistant", content, {
      typed: false,
      ...messageOptions,
    });

    if (pending) {
      pendingReplyIdRef.current = message.id;
    }
    setHistory((prev) => [...prev, message]);
  };

  const handleAgentComplete = (messageId) => {
    setHistory((prev) =>
      prev.map((message) =>
        message.id === messageId ? { ...message, typed: true } : message
      )
    );

    if (messageId === bootMessageIdRef.current) {
      setIsBootTyping(false);
    }

    if (pendingReplyIdRef.current === messageId) {
      pendingReplyIdRef.current = null;
      submitLockRef.current = false;
      playConfirm();
      setIsAgentProcessing(false);
    }
  };

  const submitOperatorMessage = async (rawValue) => {
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    const normalizedValue = value.toUpperCase();
    const isAlphaCommand = normalizedValue === ALPHA_COMMAND;

    if (!value || isBusy || submitLockRef.current) {
      return;
    }

    if (isAlphaCommand && !isAuthorized) {
      const userMessage = createRuntimeMessage("user", value, {
        localOnly: true,
      });

      setHistory((prev) => [...prev, userMessage]);
      setInput("");
      playError();
      appendAgentMessage(ALPHA_LOCKED_REPLY, {
        localOnly: true,
        pending: false,
      });
      return;
    }

    playEnter();
    submitLockRef.current = true;

    const userMessage = createRuntimeMessage("user", value);
    const nextHistory = [...history, userMessage];
    const requestMessages = toApiHistory(nextHistory);

    setHistory(nextHistory);
    setInput("");
    setIsAgentProcessing(true);
    pendingReplyIdRef.current = null;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: requestMessages,
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
        playError();
      }

      if (reply.includes("COMMAND_REJECTED")) {
        playError();
      }

      appendAgentMessage(reply);
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      console.error("JOEAGENT terminal fetch error:", error);
      playError();
      appendAgentMessage(FALLBACK_REPLY);
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
    await submitOperatorMessage(input);
  };

  const handleQuickCommand = async (command) => {
    await submitOperatorMessage(command);
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
                <div className="whitespace-pre-wrap text-gray-300">
                  {message.content}
                </div>
              ) : message.typed ? (
                <div className="font-mono whitespace-pre-wrap text-agent-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">
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

      <div className="border-t border-agent-gold-dark/70 bg-agent-black/70 px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickCommands.map((command) => (
            <motion.button
              key={command}
              type="button"
              disabled={isBusy}
              onClick={() => handleQuickCommand(command)}
              whileHover={
                isBusy
                  ? {}
                  : {
                      x: [0, -1, 1, 0],
                      y: [0, 1, -1, 0],
                    }
              }
              transition={{
                duration: 0.18,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              className={`group relative overflow-hidden border bg-black/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.24em] backdrop-blur-sm transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                command === ALPHA_COMMAND
                  ? "border-[#FFD700] text-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.3),inset_0_0_10px_rgba(255,215,0,0.08)] hover:shadow-[0_0_14px_rgba(255,215,0,0.42)] hover:[text-shadow:0_0_10px_rgba(255,215,0,0.78)]"
                  : "border-[#8A6D3B] text-[#FFD700]/85 hover:border-[#FFD700] hover:text-[#FFD700] hover:shadow-[0_0_8px_rgba(255,215,0,0.22)] hover:[text-shadow:0_0_6px_rgba(255,215,0,0.5)]"
              }`}
            >
              <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,215,0,0.1)_50%,transparent_100%)] opacity-0 transition duration-200 group-hover:opacity-100" />
              <span className="relative">{command}</span>
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-3 font-mono text-sm">
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
                  : "SELECT DIRECTIVE OR TYPE MANUALLY..."
            }
          />
        </div>
      </div>
    </div>
  );
}
