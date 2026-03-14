"use client";

import {
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import AgentWindow from "../AgentWindow";
import useAgentSound from "../hooks/useAgentSound";

const FloatingCubes = dynamic(() => import("../FloatingCubes"), {
  ssr: false,
});

const GlobalScanner = dynamic(() => import("../components/GlobalScanner"), {
  ssr: false,
});

const AgentTerminal = dynamic(() => import("../AgentTerminal"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[300px] w-full flex-col overflow-hidden border border-agent-gold-dark bg-agent-black/80 backdrop-blur-md sm:min-h-[360px]">
      <div className="flex items-center justify-between gap-3 border-b border-agent-gold-dark/70 bg-agent-gold/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-agent-gold-dark">
        <span>[ JOEAGENT_TERMINAL_SECURE_LINK ]</span>
        <span className="text-agent-gold-dark/80">STANDBY</span>
      </div>

      <div className="flex-1 px-4 py-4 font-mono text-sm leading-relaxed text-agent-gold/45">
        INITIALIZING TERMINAL LINK...
      </div>

      <div className="flex items-center gap-3 border-t border-agent-gold-dark/70 bg-agent-black/70 px-4 py-3 font-mono text-sm">
        <span className="shrink-0 text-agent-gold">OPERATOR@JOE&gt;</span>
        <span className="text-agent-gold-dark/70">CONNECTING...</span>
      </div>
    </div>
  ),
});

const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false }
);

const PerspectiveCamera = dynamic(
  () => import("@react-three/drei").then((mod) => mod.PerspectiveCamera),
  { ssr: false }
);

const AgentCore3D = dynamic(() => import("../components/AgentCore3D"), {
  ssr: false,
});

const logLines = [
  "> boot sequence initialized...",
  "> loading agent kernel v2.4.7",
  "> syncing cyber-fi relay nodes",
  "> identity signature verified",
  "> JOEAGENT online_",
];

const idleGlow = [
  "drop-shadow(0 0 18px rgba(255,215,0,0.18)) drop-shadow(0 0 42px rgba(255,215,0,0.14)) drop-shadow(0 18px 48px rgba(0,0,0,0.74))",
  "drop-shadow(0 0 28px rgba(255,215,0,0.24)) drop-shadow(0 0 58px rgba(255,215,0,0.18)) drop-shadow(0 18px 48px rgba(0,0,0,0.78))",
  "drop-shadow(0 0 18px rgba(255,215,0,0.18)) drop-shadow(0 0 42px rgba(255,215,0,0.14)) drop-shadow(0 18px 48px rgba(0,0,0,0.74))",
];

const processingGlow = [
  "drop-shadow(0 0 56px rgba(255,215,0,0.5)) drop-shadow(0 0 80px rgba(255,215,0,0.8)) drop-shadow(0 0 136px rgba(255,215,0,0.36)) drop-shadow(0 18px 48px rgba(0,0,0,0.82))",
  "drop-shadow(0 0 72px rgba(255,215,0,0.64)) drop-shadow(0 0 96px rgba(255,215,0,0.96)) drop-shadow(0 0 160px rgba(255,215,0,0.42)) drop-shadow(0 18px 52px rgba(0,0,0,0.86))",
  "drop-shadow(0 0 56px rgba(255,215,0,0.5)) drop-shadow(0 0 80px rgba(255,215,0,0.8)) drop-shadow(0 0 136px rgba(255,215,0,0.36)) drop-shadow(0 18px 48px rgba(0,0,0,0.82))",
];

const idleFieldAnimation = {
  opacity: [0.1, 0.18, 0.1],
  scale: [0.98, 1.04, 0.98],
};

const processingFieldAnimation = {
  opacity: [0.24, 0.8, 0.34, 0.94, 0.24],
  scale: [0.96, 1.16, 1.02, 1.22, 0.96],
};

const idleShellAnimation = {
  y: [0, -8, 0, 6, 0],
  scale: [1, 1.008, 1],
};

const processingShellAnimation = {
  y: [0, -1, 1, -1, 0],
  scale: [1, 1.006, 0.998, 1.004, 1],
};

const getViewportCenter = () => {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
};

export default function HomePage() {
  const { playEnter, playHover, playScan, playHoverOut, startAmbient } =
    useAgentSound();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const [linkStatus, setLinkStatus] = useState("idle");

  const goldLightRef = useRef(null);
  const fillLightRef = useRef(null);
  const linkTimeoutRef = useRef(null);
  const prevProcessingRef = useRef(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const jitterX = useMotionValue(0);
  const jitterY = useMotionValue(0);

  const parallaxTargetX = useTransform(mouseX, (latest) => {
    if (typeof window === "undefined" || window.innerWidth === 0) {
      return 0;
    }

    return ((latest / window.innerWidth) - 0.5) * -40;
  });

  const parallaxTargetY = useTransform(mouseY, (latest) => {
    if (typeof window === "undefined" || window.innerHeight === 0) {
      return 0;
    }

    return ((latest / window.innerHeight) - 0.5) * -40;
  });

  const parallaxX = useSpring(parallaxTargetX, {
    stiffness: 110,
    damping: 18,
    mass: 0.35,
  });

  const parallaxY = useSpring(parallaxTargetY, {
    stiffness: 110,
    damping: 18,
    mass: 0.35,
  });

  useEffect(() => {
    const center = getViewportCenter();
    setMousePos(center);
    mouseX.set(center.x);
    mouseY.set(center.y);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const handleResize = () => {
      const center = getViewportCenter();
      setMousePos(center);
      mouseX.set(center.x);
      mouseY.set(center.y);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [mouseX, mouseY]);

  useEffect(() => {
    mouseX.set(mousePos.x);
    mouseY.set(mousePos.y);
  }, [mousePos, mouseX, mouseY]);

  useEffect(() => {
    return () => {
      if (linkTimeoutRef.current) {
        window.clearTimeout(linkTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const bootAmbient = () => {
      startAmbient();
    };

    window.addEventListener("pointerdown", bootAmbient, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", bootAmbient, {
      once: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("pointerdown", bootAmbient);
      window.removeEventListener("keydown", bootAmbient, true);
    };
  }, [startAmbient]);

  useEffect(() => {
    if (isAgentProcessing && !prevProcessingRef.current) {
      playScan();
    }

    prevProcessingRef.current = isAgentProcessing;
  }, [isAgentProcessing, playScan]);

  useEffect(() => {
    if (!isAgentProcessing) {
      const resetX = animate(jitterX, 0, {
        duration: 0.2,
        ease: "easeOut",
      });
      const resetY = animate(jitterY, 0, {
        duration: 0.2,
        ease: "easeOut",
      });

      return () => {
        resetX.stop();
        resetY.stop();
      };
    }

    const interval = window.setInterval(() => {
      animate(jitterX, Math.random() * 4 - 2, {
        duration: 0.04,
        ease: "linear",
      });
      animate(jitterY, Math.random() * 4 - 2, {
        duration: 0.04,
        ease: "linear",
      });
    }, 34);

    return () => {
      window.clearInterval(interval);
    };
  }, [isAgentProcessing, jitterX, jitterY]);

  const handleMouseMove = (event) => {
    setMousePos({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const resetParallax = () => {
    const center = getViewportCenter();
    setMousePos(center);
  };

  const handleLinkClick = () => {
    if (linkStatus !== "idle") {
      return;
    }

    playEnter();
    setLinkStatus("authenticating");

    linkTimeoutRef.current = window.setTimeout(() => {
      setLinkStatus("granted");
      linkTimeoutRef.current = null;
    }, 1500);
  };

  const linkButtonLabel =
    linkStatus === "granted"
      ? "[ \u6743\u9650\u5df2\u89e3\u9501 ]"
      : linkStatus === "authenticating"
        ? "[ \u6b63\u5728\u9a8c\u8bc1... ]"
        : "AI LINK \u6b66\u88c5";

  const linkButtonClassName =
    linkStatus === "granted"
      ? "relative inline-flex w-full cursor-not-allowed items-center justify-center overflow-hidden border border-green-400 bg-green-400/10 px-4 py-4 font-orbitron text-sm font-bold uppercase tracking-[0.22em] text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)] transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-400/50"
      : linkStatus === "authenticating"
        ? "relative inline-flex w-full animate-pulse items-center justify-center overflow-hidden border border-[#FFD700] bg-[#FFD700]/10 px-4 py-4 font-orbitron text-sm font-bold uppercase tracking-[0.22em] text-[#FFD700] drop-shadow-[0_0_5px_#FFD700] transition duration-300 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/60"
        : "group relative inline-flex w-full items-center justify-center overflow-hidden border border-[#8A6D3B] px-4 py-4 font-orbitron text-sm font-bold uppercase tracking-[0.22em] text-[#FFD700] transition duration-300 hover:bg-[#FFD700] hover:text-agent-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]/60";

  return (
    <motion.main
      className="relative min-h-screen w-screen overflow-hidden bg-agent-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={resetParallax}
    >
      <FloatingCubes />
      <GlobalScanner />

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
        <motion.div
          className="relative flex w-full max-w-4xl items-center justify-center"
          style={{ x: parallaxX, y: parallaxY }}
        >
          <motion.div
            className="relative h-[min(82vw,46rem)] w-[min(82vw,46rem)] max-h-[80vh] max-w-[84vw]"
            animate={isAgentProcessing ? processingShellAnimation : idleShellAnimation}
            transition={{
              duration: isAgentProcessing ? 0.28 : 8.4,
              repeat: Number.POSITIVE_INFINITY,
              ease: isAgentProcessing ? "linear" : "easeInOut",
            }}
            style={{
              x: jitterX,
              y: jitterY,
              willChange: "transform, filter",
            }}
          >
            <motion.div
              className="absolute inset-[-12%] rounded-full bg-[radial-gradient(circle,rgba(255,215,0,0.28)_0%,rgba(255,215,0,0.12)_26%,rgba(255,215,0,0.04)_50%,transparent_72%)] blur-3xl"
              animate={
                isAgentProcessing ? processingFieldAnimation : idleFieldAnimation
              }
              transition={{
                duration: isAgentProcessing ? 0.54 : 6.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />

            <motion.div
              className="joeagent-core relative h-full w-full"
              animate={{
                filter: isAgentProcessing ? processingGlow : idleGlow,
              }}
              transition={{
                filter: {
                  duration: isAgentProcessing ? 0.52 : 6.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                },
              }}
            >
              <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
                <PerspectiveCamera makeDefault fov={30.5} position={[0, 0.04, 7.6]} />
                <ambientLight intensity={0.78} color="#ffffff" />
                <hemisphereLight
                  skyColor="#f8fbff"
                  groundColor="#090909"
                  intensity={0.42}
                />
                <pointLight
                  ref={goldLightRef}
                  position={[3.1, 2.6, 5.8]}
                  intensity={1.05}
                  color="#FFD700"
                />
                <pointLight
                  ref={fillLightRef}
                  position={[-2.2, 2.3, 5.9]}
                  intensity={0.98}
                  color="#ffffff"
                />
                <directionalLight
                  position={[0.2, 1.5, 6.8]}
                  intensity={0.94}
                  color="#ffffff"
                />

                <Suspense fallback={null}>
                  <AgentCore3D
                    mousePos={mousePos}
                    isAgentProcessing={isAgentProcessing}
                    goldLightRef={goldLightRef}
                    fillLightRef={fillLightRef}
                  />
                </Suspense>
              </Canvas>
            </motion.div>

            <motion.div
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.12),transparent_58%)]"
              animate={{
                opacity: isAgentProcessing
                  ? [0.16, 0.48, 0.22, 0.58, 0.16]
                  : [0.04, 0.1, 0.04],
              }}
              transition={{
                duration: isAgentProcessing ? 0.54 : 7.6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
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
                  onClick={handleLinkClick}
                  onPointerEnter={() => {
                    if (linkStatus === "idle") {
                      playHover();
                    }
                  }}
                  onFocus={() => {
                    if (linkStatus === "idle") {
                      playHover();
                    }
                  }}
                  onPointerLeave={() => {
                    if (linkStatus === "idle") {
                      playHoverOut();
                    }
                  }}
                  onBlur={() => {
                    if (linkStatus === "idle") {
                      playHoverOut();
                    }
                  }}
                  disabled={linkStatus !== "idle"}
                  className={linkButtonClassName}
                >
                  <span
                    className={`absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,215,0,0.12)_50%,transparent_100%)] transition duration-300 ${
                      linkStatus === "idle"
                        ? "opacity-0 group-hover:opacity-100"
                        : "opacity-100"
                    }`}
                  />
                  <span className="relative">{linkButtonLabel}</span>
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
