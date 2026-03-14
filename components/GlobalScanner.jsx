"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const MAX_LOGS = 9;
const MIN_DELAY_MS = 800;
const MAX_DELAY_MS = 2500;
const INITIAL_LOGS = [
  { id: "boot-1", text: "[SCANNING] BSC Block #38642012..." },
  { id: "boot-2", text: "[ALERT] Whale transfer detected: 184.42 ETH." },
  { id: "boot-3", text: "[OPTIMIZING] Arbitrage route. Margin: 1.84%." },
  { id: "boot-4", text: "[SYS] Decrypting neural node 0xA7C2D91F..." },
  { id: "boot-5", text: "[TRACE] Solana slot 271443905 indexed." },
  { id: "boot-6", text: "[WATCH] JOE liquidity variance: 2.41%." },
  { id: "boot-7", text: "[VECTOR] Routing orderflow to mesh 8F2A." },
  { id: "boot-8", text: "[MONITOR] BTC funding bias shifted 0.041." },
  { id: "boot-9", text: "[SYNC] Neural relay checksum accepted." },
];

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min, max, digits = 2) =>
  (Math.random() * (max - min) + min).toFixed(digits);

const randomHex = (length = 6) =>
  Array.from({ length }, () => randomInt(0, 15).toString(16)).join("");

const createScannerLog = () => {
  const templates = [
    () => `[SCANNING] BSC Block #${randomInt(38200000, 38999999)}...`,
    () => `[ALERT] Whale transfer detected: ${randomFloat(12, 980, 2)} ETH.`,
    () => `[OPTIMIZING] Arbitrage route. Margin: ${randomFloat(0.18, 4.92, 2)}%.`,
    () => `[SYS] Decrypting neural node 0x${randomHex(8)}...`,
    () => `[TRACE] Solana slot ${randomInt(250000000, 299999999)} indexed.`,
    () => `[WATCH] JOE liquidity variance: ${randomFloat(0.4, 8.6, 2)}%.`,
    () => `[VECTOR] Routing orderflow to mesh ${randomHex(4).toUpperCase()}.`,
    () => `[MONITOR] BTC funding bias shifted ${randomFloat(-0.12, 0.18, 3)}.`,
  ];

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    text: templates[randomInt(0, templates.length - 1)](),
  };
};

export default function GlobalScanner() {
  const [logs, setLogs] = useState(INITIAL_LOGS);

  useEffect(() => {
    let timeoutId;
    let isCancelled = false;

    const scheduleNextTick = () => {
      timeoutId = window.setTimeout(() => {
        if (isCancelled) {
          return;
        }

        setLogs((currentLogs) => [
          createScannerLog(),
          ...currentLogs.slice(0, MAX_LOGS - 1),
        ]);

        scheduleNextTick();
      }, randomInt(MIN_DELAY_MS, MAX_DELAY_MS));
    };

    scheduleNextTick();

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute left-6 top-24 z-10 hidden h-64 w-64 max-w-xs overflow-hidden opacity-70 blur-[0.5px] md:block xl:left-10"
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
        maskImage:
          "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
      }}
      aria-hidden="true"
    >
      <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.28em] text-[#B8860B]/50">
        Global Scanner Matrix
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{
                layout: { duration: 0.24, ease: "easeOut" },
                opacity: { duration: 0.22, ease: "easeOut" },
                y: { duration: 0.22, ease: "easeOut" },
              }}
              className="overflow-hidden truncate whitespace-nowrap font-mono text-[10px] leading-tight tracking-wider text-[#FFD700]/40"
            >
              {log.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
