"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const INSTALL_TOAST_DELAY_MS = 700;
const CACHE_PREFIX = "joeagent-runtime";

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function shouldRegisterServiceWorker() {
  if (typeof window === "undefined") {
    return false;
  }

  const { hostname } = window.location;
  return !["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}

async function clearJoeAgentCaches() {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  const cacheKeys = await window.caches.keys();

  await Promise.all(
    cacheKeys.map((cacheKey) => {
      if (!cacheKey.startsWith(CACHE_PREFIX)) {
        return Promise.resolve(false);
      }

      return window.caches.delete(cacheKey);
    })
  );
}

export default function PwaRuntime() {
  const deferredPromptRef = useRef(null);
  const showTimerRef = useRef(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [canPromptInstall, setCanPromptInstall] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return undefined;
    }

    let didCancel = false;
    let loadHandler;

    const cleanupDevServiceWorkers = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();

        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );
        await clearJoeAgentCaches();
      } catch (error) {
        console.warn("JOEAGENT service worker cleanup failed:", error);
      }
    };

    const registerServiceWorker = async () => {
      if (!shouldRegisterServiceWorker()) {
        await cleanupDevServiceWorkers();
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js?v=2", {
          scope: "/",
        });

        if (!didCancel && registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      } catch (error) {
        console.warn("JOEAGENT service worker registration failed:", error);
      }
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      loadHandler = () => {
        registerServiceWorker();
      };

      window.addEventListener("load", loadHandler, { once: true });
    }

    return () => {
      didCancel = true;

      if (loadHandler) {
        window.removeEventListener("load", loadHandler);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isStandaloneMode()) {
      return undefined;
    }

    const queueToast = (delay = INSTALL_TOAST_DELAY_MS) => {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = window.setTimeout(() => {
        setIsToastVisible(true);
      }, delay);
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredPromptRef.current = event;
      setCanPromptInstall(true);
      setIsToastVisible(true);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanPromptInstall(false);
      setIsToastVisible(false);
    };

    queueToast();

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.clearTimeout(showTimerRef.current);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleToastClick = async () => {
    const deferredPrompt = deferredPromptRef.current;

    if (!deferredPrompt) {
      setIsToastVisible(false);
      return;
    }

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch (error) {
      console.warn("JOEAGENT install prompt failed:", error);
    } finally {
      deferredPromptRef.current = null;
      setCanPromptInstall(false);
      setIsToastVisible(false);
    }
  };

  if (!isToastVisible) {
    return null;
  }

  return (
    <motion.button
      type="button"
      onClick={handleToastClick}
      aria-live="polite"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed right-6 top-6 z-[100] w-[min(92vw,28rem)] border border-[#8A6D3B] bg-[#050505]/94 px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[#FFD700] shadow-[0_0_22px_rgba(255,215,0,0.24)] backdrop-blur-md transition duration-300 sm:right-8 sm:top-8 lg:right-10 lg:top-10 ${
        canPromptInstall
          ? "cursor-pointer hover:bg-[#111111] hover:shadow-[0_0_28px_rgba(255,215,0,0.32)]"
          : "cursor-default"
      }`}
    >
      <div className="mb-1 text-[9px] tracking-[0.26em] text-[#FFF1A6]/75">
        {canPromptInstall ? "DESKTOP PACKAGE READY" : "PWA HANDSHAKE DETECTED"}
      </div>
      <div className="leading-relaxed">
        &gt; SYSTEM_DETACHMENT_READY: INSTALL TO DESKTOP?
      </div>
    </motion.button>
  );
}
