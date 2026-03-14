﻿"use client";

import { Center, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const DESKTOP_MODEL_PATH = "/joeagent.glb";
const MOBILE_MODEL_CANDIDATES = [
  "/models/joeagent_mobile.glb",
  "/joeagent_mobile.glb",
];
const IDLE_GOLD = new THREE.Color("#FFD700");
const ACTIVE_GOLD = new THREE.Color("#FFF4B5");
const AUTH_GOLD = new THREE.Color("#FFFBE0");
const FILL_SILVER = new THREE.Color("#F7F9FF");
const EMISSIVE_GOLD = new THREE.Color("#4C3700");
const FRONT_ROTATION_X = 0.14;
const FRONT_ROTATION_Y = 0;
const MODEL_SCALE = 1.58;
const MOBILE_MODEL_SCALE = 1.72;
const BASE_POSITION_Y = 0.28;
const MOBILE_BASE_POSITION_Y = 0.22;

function applyColorTextureSettings(texture) {
  if (!texture) {
    return;
  }

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
}

function cloneMaterial(material) {
  if (!material) {
    return material;
  }

  return typeof material.clone === "function" ? material.clone() : material;
}

function tuneDesktopMaterial(material) {
  const nextMaterial = cloneMaterial(material);

  if (!nextMaterial) {
    return nextMaterial;
  }

  if (!material) {
    return nextMaterial;
  }

  if ("metalness" in nextMaterial) {
    nextMaterial.metalness = 0.62;
  }

  if ("roughness" in nextMaterial) {
    nextMaterial.roughness = 0.48;
  }

  if ("envMapIntensity" in nextMaterial) {
    nextMaterial.envMapIntensity = 0;
  }

  if ("clearcoat" in nextMaterial) {
    nextMaterial.clearcoat = 0;
  }

  if ("clearcoatRoughness" in nextMaterial) {
    nextMaterial.clearcoatRoughness = 1;
  }

  if ("emissive" in nextMaterial) {
    nextMaterial.emissive.copy(EMISSIVE_GOLD);
  }

  if ("emissiveIntensity" in nextMaterial) {
    nextMaterial.emissiveIntensity = Math.max(
      nextMaterial.emissiveIntensity ?? 0,
      0.22
    );
  }

  applyColorTextureSettings(nextMaterial.map);
  applyColorTextureSettings(nextMaterial.emissiveMap);

  nextMaterial.needsUpdate = true;
  return nextMaterial;
}

function createMobileMaterial(material) {
  if (!material) {
    return material;
  }

  const color =
    material.color instanceof THREE.Color
      ? material.color.clone().offsetHSL(0, 0.03, 0.08)
      : new THREE.Color("#f6d14b");

  const nextMaterial = new THREE.MeshBasicMaterial({
    name: material.name ? `${material.name}-mobile` : "joeagent-mobile-basic",
    color,
    map: material.map ?? null,
    transparent: Boolean(
      material.transparent || material.alphaMap || material.opacity < 1
    ),
    opacity: material.opacity ?? 1,
    alphaMap: material.alphaMap ?? null,
    side: material.side ?? THREE.FrontSide,
    fog: false,
    toneMapped: false,
  });

  if ("vertexColors" in nextMaterial && "vertexColors" in material) {
    nextMaterial.vertexColors = material.vertexColors;
  }

  applyColorTextureSettings(nextMaterial.map);
  nextMaterial.needsUpdate = true;

  return nextMaterial;
}

function configureMeshMaterial(material, useMobileTier) {
  if (Array.isArray(material)) {
    return material.map((entry) => configureMeshMaterial(entry, useMobileTier));
  }

  return useMobileTier
    ? createMobileMaterial(material)
    : tuneDesktopMaterial(material);
}

function cloneSceneGraph(scene) {
  const nextScene = scene.clone(true);

  nextScene.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    if (Array.isArray(child.material)) {
      child.material = child.material.map((entry) => cloneMaterial(entry));
      return;
    }

    child.material = cloneMaterial(child.material);
  });

  return nextScene;
}

async function resolveModelPath(useMobileTier, signal) {
  if (!useMobileTier || typeof window === "undefined") {
    return DESKTOP_MODEL_PATH;
  }

  for (const candidate of MOBILE_MODEL_CANDIDATES) {
    try {
      const response = await fetch(candidate, {
        method: "HEAD",
        cache: "no-store",
        signal,
      });

      if (response.ok) {
        return candidate;
      }
    } catch (error) {
      if (signal?.aborted) {
        return DESKTOP_MODEL_PATH;
      }
    }
  }

  return DESKTOP_MODEL_PATH;
}

export default function AgentCore3D({
  mousePos,
  visualState = "idle",
  goldLightRef,
  fillLightRef,
  isMobile = false,
  useMobileTier = false,
}) {
  const modelRef = useRef(null);
  const auraColorRef = useRef(new THREE.Color("#FFD700"));
  const warnedMissingMobileAssetRef = useRef(false);
  const [modelPath, setModelPath] = useState(DESKTOP_MODEL_PATH);
  const { scene: loadedScene } = useGLTF(modelPath);
  const scene = useMemo(() => cloneSceneGraph(loadedScene), [loadedScene]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    resolveModelPath(useMobileTier, controller.signal)
      .then((resolvedPath) => {
        if (!isMounted) {
          return;
        }

        setModelPath(resolvedPath);

        if (
          useMobileTier &&
          resolvedPath === DESKTOP_MODEL_PATH &&
          !warnedMissingMobileAssetRef.current
        ) {
          warnedMissingMobileAssetRef.current = true;
          console.warn(
            "JOEAGENT mobile model not found. Add /public/models/joeagent_mobile.glb to enable the mobile render tier."
          );
        }
      })
      .catch(() => {
        if (isMounted) {
          setModelPath(DESKTOP_MODEL_PATH);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [useMobileTier]);

  useEffect(() => {
    scene.rotation.set(0, 0, 0);
    scene.position.set(0, 0, 0);

    scene.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.castShadow = !useMobileTier;
      child.receiveShadow = !useMobileTier;
      child.material = configureMeshMaterial(child.material, useMobileTier);
    });
  }, [scene, useMobileTier]);

  useFrame((state) => {
    const model = modelRef.current;
    const isAuthenticating = visualState === "authenticating";
    const isAgentProcessing = visualState === "processing";
    const isActive = visualState !== "idle";
    const basePositionY = isMobile ? MOBILE_BASE_POSITION_Y : BASE_POSITION_Y;

    if (!model) {
      return;
    }

    const normalizedX = state.size.width ? mousePos.x / state.size.width - 0.5 : 0;
    const normalizedY = state.size.height ? mousePos.y / state.size.height - 0.5 : 0;

    const targetRotationY = THREE.MathUtils.clamp(normalizedX * 0.26, -0.1, 0.1);
    const targetRotationX = THREE.MathUtils.clamp(normalizedY * 0.08, -0.04, 0.04);

    model.rotation.y = THREE.MathUtils.lerp(
      model.rotation.y,
      FRONT_ROTATION_Y + targetRotationY,
      0.08
    );
    model.rotation.x = THREE.MathUtils.lerp(
      model.rotation.x,
      FRONT_ROTATION_X + targetRotationX,
      0.08
    );

    if (isAuthenticating) {
      model.position.x = (Math.random() - 0.5) * 0.08;
      model.position.y = basePositionY + (Math.random() - 0.5) * 0.08;
      model.position.z = -0.08 + (Math.random() - 0.5) * 0.06;
    } else if (isAgentProcessing) {
      model.position.x = (Math.random() - 0.5) * 0.05;
      model.position.y = basePositionY + (Math.random() - 0.5) * 0.05;
      model.position.z = -0.08 + (Math.random() - 0.5) * 0.04;
    } else {
      model.position.x = THREE.MathUtils.lerp(model.position.x, 0, 0.08);
      model.position.y = THREE.MathUtils.lerp(
        model.position.y,
        basePositionY + Math.sin(state.clock.elapsedTime) * 0.11,
        0.08
      );
      model.position.z = THREE.MathUtils.lerp(model.position.z, -0.08, 0.08);
    }

    const goldLight = goldLightRef?.current;

    if (goldLight) {
      if (isAuthenticating) {
        const pulse = (Math.sin(state.clock.elapsedTime * 14) + 1) / 2;

        goldLight.intensity = THREE.MathUtils.lerp(
          goldLight.intensity,
          1.8 + pulse * 0.72,
          0.24
        );

        auraColorRef.current.copy(IDLE_GOLD).lerp(AUTH_GOLD, pulse);
        goldLight.color.lerp(auraColorRef.current, 0.24);
      } else if (isAgentProcessing) {
        const pulse = (Math.sin(state.clock.elapsedTime * 8) + 1) / 2;

        goldLight.intensity = THREE.MathUtils.lerp(
          goldLight.intensity,
          1.35 + pulse * 0.45,
          0.18
        );

        auraColorRef.current.copy(IDLE_GOLD).lerp(ACTIVE_GOLD, pulse);
        goldLight.color.lerp(auraColorRef.current, 0.18);
      } else {
        goldLight.intensity = THREE.MathUtils.lerp(goldLight.intensity, 0.95, 0.08);
        goldLight.color.lerp(IDLE_GOLD, 0.08);
      }
    }

    const fillLight = fillLightRef?.current;

    if (fillLight) {
      const targetFillIntensity = isAuthenticating
        ? 1.34
        : isAgentProcessing
          ? 1.12
          : 0.96;

      fillLight.intensity = THREE.MathUtils.lerp(
        fillLight.intensity,
        targetFillIntensity,
        isActive ? 0.16 : 0.08
      );
      fillLight.color.lerp(FILL_SILVER, 0.08);
    }
  });

  return (
    <group ref={modelRef} scale={isMobile ? MOBILE_MODEL_SCALE : MODEL_SCALE}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

useGLTF.preload(DESKTOP_MODEL_PATH);
useGLTF.preload("/models/joeagent_mobile.glb");


