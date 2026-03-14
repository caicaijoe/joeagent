"use client";

import { motion } from "framer-motion";

const cubeCount = 6;
const round = (value, precision = 3) =>
  Number(value.toFixed(precision));

const rand = (seed) => {
  const x = Math.sin(seed * 43758.5453123) * 10000;
  return x - Math.floor(x);
};

const cubes = Array.from({ length: cubeCount }, (_, index) => {
  const size = round(72 + rand(index + 1) * 88);
  const left = round(8 + rand(index + 11) * 84);
  const top = round(10 + rand(index + 21) * 78);
  const depth = round(-320 + rand(index + 31) * 640);
  const rotateX = round(rand(index + 41) * 360);
  const rotateY = round(rand(index + 51) * 360);
  const rotateZ = round(rand(index + 61) * 120 - 60);
  const duration = round(15 + rand(index + 71) * 5);
  const delay = round(rand(index + 81) * -8);
  const floatOffset = round(14 + rand(index + 91) * 22);

  return {
    id: index,
    size,
    left,
    top,
    depth,
    rotateX,
    rotateY,
    rotateZ,
    duration,
    delay,
    floatOffset,
  };
});

const faceBase =
  "absolute inset-0 border border-agent-gold/40 bg-agent-gold/5 backdrop-blur-[2px] shadow-[0_0_18px_rgba(255,215,0,0.08)]";

export default function FloatingCubes() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none [perspective:1800px]"
      style={{ perspectiveOrigin: "50% 50%" }}
    >
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {cubes.map((cube) => {
          const half = round(cube.size / 2);

          return (
            <div
              key={cube.id}
              className="absolute"
              style={{
                left: `${cube.left}%`,
                top: `${cube.top}%`,
                width: cube.size,
                height: cube.size,
                transformStyle: "preserve-3d",
                transform: `translate3d(-50%, -50%, ${cube.depth}px) rotateZ(${cube.rotateZ}deg)`,
              }}
            >
              <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{
                  rotateX: [cube.rotateX, cube.rotateX + 360],
                  rotateY: [cube.rotateY, cube.rotateY + 360],
                  y: [0, -cube.floatOffset, 0, cube.floatOffset * 0.45, 0],
                }}
                transition={{
                  duration: cube.duration,
                  delay: cube.delay,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                <div
                  className={faceBase}
                  style={{ transform: `rotateY(0deg) translateZ(${half}px)` }}
                />
                <div
                  className={faceBase}
                  style={{ transform: `rotateY(180deg) translateZ(${half}px)` }}
                />
                <div
                  className={faceBase}
                  style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}
                />
                <div
                  className={faceBase}
                  style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }}
                />
                <div
                  className={faceBase}
                  style={{ transform: `rotateX(90deg) translateZ(${half}px)` }}
                />
                <div
                  className={faceBase}
                  style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }}
                />
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
