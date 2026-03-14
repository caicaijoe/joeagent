"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import AgentTerminal from "../AgentTerminal";
import AgentWindow from "../AgentWindow";
import FloatingCubes from "../FloatingCubes";

const logLines = [
  "> boot sequence initialized...",
  "> loading agent kernel v2.4.7",
  "> syncing cyber-fi relay nodes",
  "> identity signature verified",
  "> JOEAGENT online_",
];

export default function HomePage() {
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);
  const jitterX = useMotionValue(0);
  const jitterY = useMotionValue(0);

  const heroX = useSpring(parallaxX, {
    stiffness: 42,
    damping: 16,
    mass: 1.1,
  });

  const heroY = useSpring(parallaxY, {
    stiffness: 42,
    damping: 16,
    mass: 1.1,
  });

  useEffect(() => {
    if (!isAgentProcessing) {
      jitterX.set(0);
      jitterY.set(0);
      return;
    }

    const interval = setInterval(() => {
      jitterX.set(Math.random() * 4 - 2);
      jitterY.set(Math.random() * 4 - 2);
    }, 48);

    return () => clearInterval(interval);
  }, [isAgentProcessing, jitterX, jitterY]);

  const handleMouseMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    parallaxX.set(-x * 36);
    parallaxY.set(-y * 24);
  };

  const resetParallax = () => {
    parallaxX.set(0);
    parallaxY.set(0);
  };

  return (
    <motion.main
      className="relative min-h-screen w-screen overflow-hidden bg-agent-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={resetParallax}
    >
      <FloatingCubes />

      <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
        <motion.div
          className="relative flex w-full max-w-4xl items-center justify-center"
          style={{ x: heroX, y: heroY }}
        >
          <motion.div
            className="joeagent-core relative"
            animate={
              isAgentProcessing
                ? {
                    y: 0,
                    scale: [1, 1.018, 0.996, 1.014, 1],
                  }
                : {
                    y: [0, -10, 0, 10, 0],
                    scale: [1, 1.012, 1],
                  }
            }
            transition={{
              duration: isAgentProcessing ? 0.42 : 6.4,
              repeat: Number.POSITIVE_INFINITY,
              ease: isAgentProcessing ? "linear" : "easeInOut",
            }}
          >
            <motion.div
              className="absolute inset-[-14%] rounded-full bg-[radial-gradient(circle,rgba(255,215,0,0.34)_0%,rgba(255,215,0,0.18)_28%,rgba(255,215,0,0.06)_54%,transparent_74%)] blur-3xl"
              animate={
                isAgentProcessing
                  ? {
                      opacity: [0.3, 0.82, 0.42, 0.94, 0.3],
                      scale: [0.96, 1.12, 1.02, 1.18, 0.96],
                    }
                  : {
                      opacity: [0.12, 0.2, 0.12],
                      scale: [0.98, 1.04, 0.98],
                    }
              }
              transition={{
                duration: isAgentProcessing ? 0.58 : 4.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />

            <motion.img
              src="/joeagent-main.png"
              alt="JOEAGENT"
              className="relative z-10 h-auto w-[320px] max-w-[78vw] select-none object-contain sm:w-[420px] lg:w-[520px]"
              draggable="false"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: isAgentProcessing
                  ? "drop-shadow(0 0 80px rgba(255,215,0,0.8)) drop-shadow(0 0 120px rgba(255,215,0,0.38)) drop-shadow(0 18px 48px rgba(0,0,0,0.82))"
                  : "drop-shadow(0 0 20px rgba(255,215,0,0.2)) drop-shadow(0 0 46px rgba(255,215,0,0.18)) drop-shadow(0 18px 48px rgba(0,0,0,0.75))",
              }}
              transition={{
                opacity: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                filter: { duration: isAgentProcessing ? 0.14 : 1.2, ease: "easeInOut" },
              }}
              style={{
                x: jitterX,
                y: jitterY,
              }}
            />

            <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
              <div className="absolute inset-x-[8%] top-0 h-24 animate-scanline bg-[linear-gradient(180deg,transparent_0%,rgba(255,215,0,0.18)_48%,transparent_100%)] mix-blend-screen blur-sm" />
              <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.1),transparent_58%)]"
                animate={
                  isAgentProcessing
                    ? { opacity: [0.2, 0.56, 0.28, 0.64, 0.2] }
                    : { opacity: [0.08, 0.16, 0.08] }
                }
                transition={{
                  duration: isAgentProcessing ? 0.46 : 5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="relative z-20 flex min-h-screen flex-col p-5 sm:p-8 lg:p-10">
        <div className="flex items-start justify-between gap-6">
          <motion.h1
            className="font-orbitron text-4xl font-black uppercase tracking-[0.32em] text-transparent sm:text-6xl lg:text-7xl [background-image:linear-gradient(180deg,#fff6bf_0%,#ffe878_18%,#ffd700_42%,#b98a2d_68%,#fff1a6_100%)] bg-clip-text [text-shadow:0_0_26px_rgba(255,215,0,0.12)]"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            JOEAGENT
          </motion.h1>
        </div>

        <div className="relative mt-auto flex flex-col gap-5 xl:min-h-[26rem]">
          <div className="flex w-full flex-col gap-5 xl:max-w-md xl:pr-8">
            <motion.div
              className="w-full"
              initial={{ opacity: 0, x: -24, y: 18 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3 }}
            >
              <AgentWindow title="SYS_LOG">
                <div className="space-y-1.5">
                  {logLines.map((line, index) => (
                    <div key={line} className="overflow-hidden whitespace-nowrap">
                      <motion.div
                        className="w-fit border-r border-agent-gold/70 pr-1"
                        initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0.3 }}
                        animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
                        transition={{
                          duration: 1.1,
                          delay: 0.65 + index * 0.42,
                          ease: "easeInOut",
                        }}
                      >
                        {line}
                      </motion.div>
                    </div>
                  ))}
                </div>
              </AgentWindow>
            </motion.div>

            <motion.div
              className="w-full"
              initial={{ opacity: 0, x: -16, y: 22 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
            >
              <AgentWindow title="ACTION">
                <button
                  type="button"
                  className="group relative inline-flex w-full items-center justify-center overflow-hidden border border-agent-gold px-4 py-4 font-orbitron text-sm font-bold uppercase tracking-[0.22em] text-agent-gold transition duration-300 hover:bg-agent-gold hover:text-agent-black focus:outline-none focus:ring-2 focus:ring-agent-gold/60"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,215,0,0.12)_50%,transparent_100%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                  <span className="relative">AI LINK ARMED</span>
                </button>
              </AgentWindow>
            </motion.div>
          </div>

          <motion.div
            className="w-full self-center xl:absolute xl:bottom-0 xl:right-0 xl:w-[min(46vw,56rem)] xl:max-w-none"
            initial={{ opacity: 0, x: 24, y: 18 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45 }}
          >
            <AgentTerminal
              isAgentProcessing={isAgentProcessing}
              setIsAgentProcessing={setIsAgentProcessing}
            />
          </motion.div>
        </div>
      </div>
    </motion.main>
  );
}
