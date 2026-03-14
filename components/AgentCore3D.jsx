"use client";

import { Center, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const MODEL_PATH = "/Meshy_AI_Golden_Circuit_0314100435_texture.glb";
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

function tuneMaterial(material) {
  if (!material) {
    return;
  }

  if ("metalness" in material) {
    material.metalness = 0.62;
  }

  if ("roughness" in material) {
    material.roughness = 0.48;
  }

  if ("envMapIntensity" in material) {
    material.envMapIntensity = 0;
  }

  if ("clearcoat" in material) {
    material.clearcoat = 0;
  }

  if ("clearcoatRoughness" in material) {
    material.clearcoatRoughness = 1;
  }

  if ("emissive" in material) {
    material.emissive.copy(EMISSIVE_GOLD);
  }

  if ("emissiveIntensity" in material) {
    material.emissiveIntensity = Math.max(material.emissiveIntensity ?? 0, 0.22);
  }

  material.needsUpdate = true;
}

function tuneMobileMaterial(material) {
  if (!material) {
    return;
  }

  if ("metalness" in material) {
    material.metalness = 0.56;
  }

  if ("roughness" in material) {
    material.roughness = 0.34;
  }

  if ("emissiveIntensity" in material) {
    material.emissiveIntensity = Math.max(material.emissiveIntensity ?? 0, 0.34);
  }

  material.needsUpdate = true;
}

export default function AgentCore3D({
  mousePos,
  visualState = "idle",
  goldLightRef,
  fillLightRef,
  isMobile = false,
}) {
  const modelRef = useRef(null);
  const auraColorRef = useRef(new THREE.Color("#FFD700"));
  const { scene } = useGLTF(MODEL_PATH);

  useEffect(() => {
    scene.rotation.set(0, 0, 0);
    scene.position.set(0, 0, 0);

    scene.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.castShadow = true;
      child.receiveShadow = true;

      if (Array.isArray(child.material)) {
        child.material.forEach(tuneMaterial);
        return;
      }

      tuneMaterial(child.material);
    });
  }, [scene]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    scene.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      if (Array.isArray(child.material)) {
        child.material.forEach(tuneMobileMaterial);
        return;
      }

      tuneMobileMaterial(child.material);
    });
  }, [isMobile, scene]);

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

useGLTF.preload(MODEL_PATH);