"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 300;

const Particles = () => {
  const meshRef = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const { positions, speeds, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const spd = new Float32Array(PARTICLE_COUNT);
    const col = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
      spd[i] = 0.02 + Math.random() * 0.06;

      const isRed = Math.random() < 0.2;
      col[i * 3] = isRed ? 0.86 : 0.7 + Math.random() * 0.3;
      col[i * 3 + 1] = isRed ? 0.15 : 0.7 + Math.random() * 0.3;
      col[i * 3 + 2] = isRed ? 0.15 : 0.7 + Math.random() * 0.3;
    }
    return { positions: pos, speeds: spd, colors: col };
  }, []);

  useFrame(({ pointer }) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position;

    mouseRef.current.x += (pointer.x * 2 - mouseRef.current.x) * 0.05;
    mouseRef.current.y += (pointer.y * 2 - mouseRef.current.y) * 0.05;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = posAttr.getX(i) + speeds[i];
      const newX = x > 10 ? -10 : x;
      const yDrift = mouseRef.current.y * 0.02;
      posAttr.setX(i, newX);
      posAttr.setY(i, posAttr.getY(i) + yDrift * 0.01);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

export const ParticleCanvas = () => (
  <div className="absolute inset-0 -z-10">
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Particles />
    </Canvas>
  </div>
);
