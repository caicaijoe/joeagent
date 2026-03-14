"use client";

import { useCallback, useEffect, useRef } from "react";

const AUDIO_CONFIG = {
  enter: {
    src: "/sounds/enter.mp3",
    volume: 0.4,
  },
  hover: {
    src: "/sounds/hover.mp3",
    volume: 0.18,
  },
  activate: {
    src: "/sounds/activate.mp3",
    volume: 0.34,
  },
  scan: {
    src: "/sounds/scan.mp3",
    volume: 0.24,
  },
  hoverOut: {
    src: "/sounds/hover-out.mp3",
    volume: 0.14,
  },
  confirm: {
    src: "/sounds/confirm.mp3",
    volume: 0.26,
  },
  ambient: {
    src: "/sounds/ambient.mp3",
    volume: 0.08,
    loop: true,
  },
  typing: {
    src: "/sounds/typing.mp3",
    volume: 0.1,
  },
  error: {
    src: "/sounds/error.mp3",
    volume: 0.5,
  },
};

const sharedAudio = {
  enter: null,
  hover: null,
  activate: null,
  scan: null,
  hoverOut: null,
  confirm: null,
  ambient: null,
  typing: null,
  error: null,
};
let isAudioUnlocked = false;

function createAudio({ src, volume, loop = false }) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = volume;
  audio.loop = loop;
  return audio;
}

export default function useAgentSound() {
  const enterAudioRef = useRef(null);
  const hoverAudioRef = useRef(null);
  const activateAudioRef = useRef(null);
  const scanAudioRef = useRef(null);
  const hoverOutAudioRef = useRef(null);
  const confirmAudioRef = useRef(null);
  const ambientAudioRef = useRef(null);
  const typingAudioRef = useRef(null);
  const errorAudioRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const unlockAudio = () => {
      isAudioUnlocked = true;
    };

    if (!sharedAudio.enter) {
      sharedAudio.enter = createAudio(AUDIO_CONFIG.enter);
    }

    if (!sharedAudio.hover) {
      sharedAudio.hover = createAudio(AUDIO_CONFIG.hover);
    }

    if (!sharedAudio.activate) {
      sharedAudio.activate = createAudio(AUDIO_CONFIG.activate);
    }

    if (!sharedAudio.scan) {
      sharedAudio.scan = createAudio(AUDIO_CONFIG.scan);
    }

    if (!sharedAudio.hoverOut) {
      sharedAudio.hoverOut = createAudio(AUDIO_CONFIG.hoverOut);
    }

    if (!sharedAudio.confirm) {
      sharedAudio.confirm = createAudio(AUDIO_CONFIG.confirm);
    }

    if (!sharedAudio.ambient) {
      sharedAudio.ambient = createAudio(AUDIO_CONFIG.ambient);
    }

    if (!sharedAudio.typing) {
      sharedAudio.typing = createAudio(AUDIO_CONFIG.typing);
    }

    if (!sharedAudio.error) {
      sharedAudio.error = createAudio(AUDIO_CONFIG.error);
    }

    enterAudioRef.current = sharedAudio.enter;
    hoverAudioRef.current = sharedAudio.hover;
    activateAudioRef.current = sharedAudio.activate;
    scanAudioRef.current = sharedAudio.scan;
    hoverOutAudioRef.current = sharedAudio.hoverOut;
    confirmAudioRef.current = sharedAudio.confirm;
    ambientAudioRef.current = sharedAudio.ambient;
    typingAudioRef.current = sharedAudio.typing;
    errorAudioRef.current = sharedAudio.error;

    window.addEventListener("pointerdown", unlockAudio, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", unlockAudio, {
      once: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio, true);
    };
  }, []);

  const playEnter = useCallback(() => {
    const enterAudio = enterAudioRef.current;

    if (!enterAudio) {
      return;
    }

    isAudioUnlocked = true;
    enterAudio.currentTime = 0;
    enterAudio.play().catch((error) => {
      console.warn("Audio play blocked:", error);
    });
  }, []);

  const playHover = useCallback(() => {
    const hoverAudio = hoverAudioRef.current;

    if (!hoverAudio || !isAudioUnlocked) {
      return;
    }

    hoverAudio.currentTime = 0;
    hoverAudio.play().catch((error) => {
      console.warn("Audio play blocked:", error);
    });
  }, []);

  const playActivate = useCallback(() => {
    const activateAudio = activateAudioRef.current;

    if (!activateAudio) {
      return;
    }

    isAudioUnlocked = true;
    activateAudio.currentTime = 0;
    activateAudio.play().catch((error) => {
      console.warn("Audio play blocked:", error);
    });
  }, []);

  const playScan = useCallback(() => {
    const scanAudio = scanAudioRef.current;

    if (!scanAudio || !isAudioUnlocked) {
      return;
    }

    scanAudio.currentTime = 0;
    scanAudio.play().catch((error) => {
      console.warn("Audio play blocked:", error);
    });
  }, []);

  const playHoverOut = useCallback(() => {
    const hoverOutAudio = hoverOutAudioRef.current;

    if (!hoverOutAudio || !isAudioUnlocked) {
      return;
    }

    hoverOutAudio.currentTime = 0;
    hoverOutAudio.play().catch((error) => {
      console.warn("Audio play blocked:", error);
    });
  }, []);

  const playConfirm = useCallback(() => {
    const confirmAudio = confirmAudioRef.current;

    if (!confirmAudio || !isAudioUnlocked) {
      return;
    }

    confirmAudio.currentTime = 0;
    confirmAudio.play().catch((error) => {
      console.warn("Audio play blocked:", error);
    });
  }, []);

  const startAmbient = useCallback(() => {
    const ambientAudio = ambientAudioRef.current;

    if (!ambientAudio) {
      return;
    }

    isAudioUnlocked = true;

    if (!ambientAudio.paused) {
      return;
    }

    ambientAudio.currentTime = 0;
    ambientAudio.play().catch((error) => {
      console.warn("Audio play blocked:", error);
    });
  }, []);

  const stopAmbient = useCallback(() => {
    const ambientAudio = ambientAudioRef.current;

    if (!ambientAudio) {
      return;
    }

    ambientAudio.pause();
    ambientAudio.currentTime = 0;
  }, []);

  const playTyping = useCallback(() => {
    const typingAudio = typingAudioRef.current;

    if (!typingAudio || !isAudioUnlocked) {
      return;
    }

    typingAudio.currentTime = 0;
    typingAudio.play().catch((error) => {
      console.warn("Audio play blocked:", error);
    });
  }, []);

  const playError = useCallback(() => {
    const errorAudio = errorAudioRef.current;

    if (!errorAudio) {
      return;
    }

    errorAudio.currentTime = 0;
    errorAudio.play().catch((error) => {
      console.warn("Audio play blocked:", error);
    });
  }, []);

  return {
    playEnter,
    playHover,
    playActivate,
    playScan,
    playHoverOut,
    playConfirm,
    startAmbient,
    stopAmbient,
    playTyping,
    playError,
  };
}
