"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";
import { HERO_C_MOODS, lerp, lerp3, moodForProgress } from "./beats";

interface SceneProps {
  progress: number;
  reducedMotion: boolean;
  isMobile: boolean;
}

/**
 * Animates fog, lights, and camera in response to scroll progress.
 * Reads progress from a ref so we don't trigger React re-renders
 * inside useFrame.
 */
function SceneRig({
  progressRef,
  reducedMotion,
}: {
  progressRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
}) {
  const { scene, camera } = useThree();
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const fogColor = useMemo(() => new THREE.Color(), []);
  const keyColor = useMemo(() => new THREE.Color(), []);
  const rimColor = useMemo(() => new THREE.Color(), []);

  // Set initial fog so first render is correct.
  useMemo(() => {
    scene.fog = new THREE.FogExp2(0x000000, 0.085);
    scene.background = new THREE.Color(0x000000);
  }, [scene]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    const p = progressRef.current;
    const { index, next, t } = moodForProgress(p);
    const a = HERO_C_MOODS[index];
    const b = HERO_C_MOODS[next];

    const fog = lerp3(a.fog, b.fog, t);
    const key = lerp3(a.key, b.key, t);
    const rim = lerp3(a.rim, b.rim, t);
    const ambient = lerp(a.ambient, b.ambient, t);
    const fov = lerp(a.fov, b.fov, t);
    const camZ = lerp(a.cameraZ, b.cameraZ, t);

    fogColor.setRGB(fog[0], fog[1], fog[2]);
    if (scene.fog && "color" in scene.fog) {
      (scene.fog as THREE.FogExp2).color.copy(fogColor);
    }
    scene.background = fogColor;

    keyColor.setRGB(key[0], key[1], key[2]);
    rimColor.setRGB(rim[0], rim[1], rim[2]);

    if (keyLightRef.current) {
      keyLightRef.current.color.copy(keyColor);
      // Sweep key light direction across the scroll
      const sweep = lerp(-0.9, 0.9, p);
      keyLightRef.current.position.set(
        sweep * 6,
        4 + Math.sin(p * Math.PI) * 2,
        6,
      );
    }
    if (rimLightRef.current) {
      rimLightRef.current.color.copy(rimColor);
      rimLightRef.current.intensity = 5 + Math.sin(p * Math.PI * 2) * 1.5;
    }
    if (spotRef.current) {
      spotRef.current.color.copy(keyColor);
      // Spot intensity rises in intro and crafted (beats 0 and 4)
      const proximity =
        Math.max(0, 1 - Math.abs(p - 0.05) * 5) +
        Math.max(0, 1 - Math.abs(p - 0.92) * 5);
      spotRef.current.intensity = 6 + proximity * 12;
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = ambient;
    }

    // Camera push: z eases between cameraZ values; small orbit in beats 1 & 3
    const orbit =
      Math.sin(p * Math.PI * 2) *
      (p > 0.18 && p < 0.42 ? 0.6 : p > 0.58 && p < 0.82 ? 0.4 : 0.15);
    const targetX = orbit;
    const targetY = lerp(0.4, -0.4, p) + Math.sin(p * Math.PI) * 0.3;
    const targetZ = camZ;

    camera.position.x += (targetX - camera.position.x) * Math.min(1, delta * 4);
    camera.position.y += (targetY - camera.position.y) * Math.min(1, delta * 4);
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, delta * 4);
    camera.lookAt(0, 0, -4);

    if ("fov" in camera) {
      const perspective = camera as THREE.PerspectiveCamera;
      if (Math.abs(perspective.fov - fov) > 0.01) {
        perspective.fov += (fov - perspective.fov) * Math.min(1, delta * 3);
        perspective.updateProjectionMatrix();
      }
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.05} />
      <directionalLight
        ref={keyLightRef}
        position={[3, 5, 6]}
        intensity={2.2}
        color="#fff1d6"
      />
      <pointLight
        ref={rimLightRef}
        position={[-3, 1.5, -4]}
        intensity={5}
        distance={18}
        color="#ff2040"
      />
      <spotLight
        ref={spotRef}
        position={[0, 6, 4]}
        angle={0.45}
        penumbra={0.85}
        distance={28}
        intensity={10}
        color="#fff1d6"
        castShadow={false}
      />
    </>
  );
}

/**
 * Receding perspective grid suggesting a vanishing-point road.
 * Built from line segments — no textures.
 */
function PerspectiveGrid() {
  const ref = useRef<THREE.LineSegments>(null);
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const rows = 30;
    const cols = 14;
    const spacing = 2.2;

    // Longitudinal lines
    for (let c = -cols; c <= cols; c++) {
      positions.push(c * spacing * 0.6, 0, -rows * spacing);
      positions.push(c * spacing * 0.6, 0, rows * spacing);
      for (let k = 0; k < 2; k++) {
        colors.push(0.85, 0.15, 0.18);
      }
    }
    // Lateral lines
    for (let r = -rows; r <= rows; r++) {
      positions.push(-cols * spacing, 0, r * spacing);
      positions.push(cols * spacing, 0, r * spacing);
      for (let k = 0; k < 2; k++) {
        colors.push(0.4, 0.05, 0.08);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    // Slow scroll of the grid forward to suggest motion
    const t = state.clock.elapsedTime;
    ref.current.position.z = (t * 0.6) % 2.2;
  });

  return (
    <lineSegments ref={ref} position={[0, -1.6, 0]}>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.55}
        toneMapped={false}
      />
    </lineSegments>
  );
}

/**
 * Long thin streaks suggesting motion-blur speed.
 * Implemented with InstancedMesh of stretched boxes.
 */
function SpeedStreaks({
  progressRef,
  count,
}: {
  progressRef: React.MutableRefObject<number>;
  count: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => {
    const arr: Array<{
      x: number;
      y: number;
      z: number;
      speed: number;
      len: number;
    }> = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 28,
        y: (Math.random() - 0.5) * 14,
        z: (Math.random() - 0.5) * 60,
        speed: 0.6 + Math.random() * 1.4,
        len: 0.6 + Math.random() * 2.2,
      });
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const p = progressRef.current;
    const { index, next, t } = moodForProgress(p);
    const speedMul = lerp(
      HERO_C_MOODS[index].particleSpeed,
      HERO_C_MOODS[next].particleSpeed,
      t,
    );

    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      d.z += d.speed * speedMul * delta * 14;
      if (d.z > 12) {
        d.z = -55 - Math.random() * 10;
        d.x = (Math.random() - 0.5) * 28;
        d.y = (Math.random() - 0.5) * 14;
      }
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.set(0.015, 0.015, d.len * (0.6 + speedMul * 0.6));
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        color="#ffdca8"
        transparent
        opacity={0.55}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/**
 * Volumetric god-ray approximation: large transparent cones positioned to
 * sweep diagonally. Cheaper than true volumetric.
 */
function GodRays({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const p = progressRef.current;
    const sweep = Math.sin(state.clock.elapsedTime * 0.25 + p * Math.PI) * 0.35;
    groupRef.current.rotation.z = sweep;
    // City-lights beat (1) — bright vertical beams
    const cityBeam = Math.max(0, 1 - Math.abs(p - 0.29) * 5);
    groupRef.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (!mat) return;
      const base = 0.08 + (i % 2 === 0 ? 0.04 : 0);
      mat.opacity = base + cityBeam * 0.25;
    });
  });

  return (
    <group ref={groupRef} position={[0, 2, -8]}>
      <mesh position={[-3.2, 0, 0]} rotation={[0, 0, 0.15]}>
        <coneGeometry args={[1.4, 14, 16, 1, true]} />
        <meshBasicMaterial
          color="#7ec0ff"
          transparent
          opacity={0.1}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[3.2, 0, 0]} rotation={[0, 0, -0.15]}>
        <coneGeometry args={[1.4, 14, 16, 1, true]} />
        <meshBasicMaterial
          color="#ffb070"
          transparent
          opacity={0.1}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, -2]} rotation={[0, 0, 0]}>
        <coneGeometry args={[2.2, 18, 24, 1, true]} />
        <meshBasicMaterial
          color="#ff4060"
          transparent
          opacity={0.06}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Abstract centerpiece — a low-poly "helmet/bike" silhouette built from
 * an icosahedron, a flattened sphere visor, and a couple of cylinder rims.
 * Uses MeshStandardMaterial so it picks up the mood lighting.
 */
function CenterpieceObject({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const p = progressRef.current;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.18 + p * 1.4;
    // Visible primarily in beats 0 and 4
    const intro = Math.max(0, 1 - Math.abs(p - 0.06) * 6);
    const crafted = Math.max(0, 1 - Math.abs(p - 0.9) * 6);
    const scale = 0.55 + intro * 0.35 + crafted * 0.45;
    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.y =
      -0.4 + Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.35}>
      <group ref={groupRef} position={[0, -0.4, -2]}>
        {/* MAIN SHELL — slightly oblong sphere with automotive clearcoat */}
        <mesh scale={[1.05, 1.0, 1.18]}>
          <sphereGeometry args={[1, 96, 96]} />
          <meshPhysicalMaterial
            color="#070707"
            metalness={0.4}
            roughness={0.38}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.4}
          />
        </mesh>

        {/* FRONT SHELL EXTENSION — adds a forward brow so the shell flows
            continuously into the chin bar (no visible seam) */}
        <mesh position={[0, -0.12, 0.16]} scale={[1.0, 0.92, 1.22]}>
          <sphereGeometry args={[1, 80, 80]} />
          <meshPhysicalMaterial
            color="#070707"
            metalness={0.4}
            roughness={0.38}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.4}
          />
        </mesh>

        {/* CHIN BAR — horizontal capsule that visually continues the shell */}
        <mesh
          position={[0, -0.6, 0.55]}
          rotation={[0, 0, Math.PI / 2]}
          scale={[1, 1.05, 0.95]}
        >
          <capsuleGeometry args={[0.3, 0.9, 16, 32]} />
          <meshPhysicalMaterial
            color="#070707"
            metalness={0.4}
            roughness={0.38}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.4}
          />
        </mesh>

        {/* VISOR FRAME — recessed black band that visually carves the eye port */}
        <mesh position={[0, 0.04, 0.72]} scale={[1.04, 0.36, 0.46]}>
          <sphereGeometry
            args={[
              1,
              80,
              32,
              Math.PI * 1.15,
              Math.PI * 0.7,
              Math.PI * 0.32,
              Math.PI * 0.42,
            ]}
          />
          <meshStandardMaterial
            color="#000000"
            metalness={0.1}
            roughness={0.95}
          />
        </mesh>

        {/* VISOR — tinted glass sitting inside the frame */}
        <mesh position={[0, 0.04, 0.74]} scale={[0.99, 0.31, 0.45]}>
          <sphereGeometry
            args={[
              1,
              80,
              32,
              Math.PI * 1.18,
              Math.PI * 0.64,
              Math.PI * 0.33,
              Math.PI * 0.4,
            ]}
          />
          <meshPhysicalMaterial
            color="#010101"
            metalness={1}
            roughness={0.04}
            clearcoat={1}
            clearcoatRoughness={0.02}
            envMapIntensity={2.2}
            emissive="#9a0d0d"
            emissiveIntensity={0.18}
          />
        </mesh>

        {/* TOP VENT INTAKE — flat slot on the crown */}
        <mesh position={[0, 0.92, 0.18]} rotation={[0.45, 0, 0]}>
          <boxGeometry args={[0.42, 0.05, 0.2]} />
          <meshStandardMaterial
            color="#000000"
            metalness={0.5}
            roughness={0.55}
          />
        </mesh>

        {/* TOP VENT GRILLE — 4 thin red emissive strips inside */}
        {[-0.15, -0.05, 0.05, 0.15].map((x) => (
          <mesh key={x} position={[x, 0.94, 0.18]} rotation={[0.45, 0, 0]}>
            <boxGeometry args={[0.025, 0.018, 0.18]} />
            <meshStandardMaterial
              color="#dc2626"
              emissive="#ff1f1f"
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* CHIN VENT GRILLE — slot at the front of the chin bar */}
        <mesh position={[0, -0.66, 1.15]}>
          <boxGeometry args={[0.55, 0.12, 0.05]} />
          <meshStandardMaterial
            color="#000000"
            metalness={0.5}
            roughness={0.55}
          />
        </mesh>
        {[-0.18, -0.06, 0.06, 0.18].map((x) => (
          <mesh key={x} position={[x, -0.66, 1.165]}>
            <boxGeometry args={[0.03, 0.08, 0.02]} />
            <meshStandardMaterial
              color="#dc2626"
              emissive="#ff1f1f"
              emissiveIntensity={1.4}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* SIDE BRAND STRIPES — angular red emissive accent on each side */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.97, -0.12, 0.4]}
            rotation={[0, side * -0.5, -0.15]}
            scale={[0.045, 0.55, 0.025]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#dc2626"
              emissive="#ff2424"
              emissiveIntensity={2.4}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* SIDE TRIM HIGHLIGHT — short white-hot streak adjacent to stripe */}
        {[-1, 1].map((side) => (
          <mesh
            key={`hl-${side}`}
            position={[side * 1.0, -0.08, 0.55]}
            rotation={[0, side * -0.5, -0.15]}
            scale={[0.014, 0.38, 0.015]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffd9d9"
              emissiveIntensity={1.8}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* VISOR BOTTOM SEAL — bright red emissive line under the visor */}
        <mesh position={[0, -0.16, 0.78]} scale={[0.95, 0.5, 0.84]}>
          <torusGeometry args={[1, 0.012, 12, 80, Math.PI * 0.95]} />
          <meshStandardMaterial
            color="#dc2626"
            emissive="#ff2020"
            emissiveIntensity={2.8}
            toneMapped={false}
          />
        </mesh>

        {/* NECK OPENING TRIM — subtle red ring at the base */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.98, 0.05]}>
          <torusGeometry args={[0.82, 0.018, 12, 80]} />
          <meshStandardMaterial
            color="#dc2626"
            emissive="#ff2020"
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>

        {/* BRAND DOT — small emissive mark on the back */}
        <mesh position={[0, 0.25, -1.0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color="#dc2626"
            emissive="#ff3030"
            emissiveIntensity={2.0}
            toneMapped={false}
          />
        </mesh>
      </group>
    </Float>
  );
}

/**
 * Brand showcase — big "MOTOMARKET" 3D text + tagline + glowing pedestal disc.
 * Visible alongside the helmet during intro (beat 0) and crafted (beat 4).
 * Text faces camera (does NOT rotate with helmet) so it's always readable.
 */
function BrandShowcase({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const mainTextRef = useRef<THREE.Mesh | null>(null);
  const subTextRef = useRef<THREE.Mesh | null>(null);
  const pedestalRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const p = progressRef.current;
    const t = state.clock.elapsedTime;

    // Visible during intro (beat 0) and crafted (beat 4) — same windows as helmet
    const intro = Math.max(0, 1 - Math.abs(p - 0.06) * 6);
    const crafted = Math.max(0, 1 - Math.abs(p - 0.9) * 6);
    const visibility = Math.min(1, intro + crafted);

    // Subtle breathing scale so the brand block feels alive
    const breath = 1 + Math.sin(t * 0.7) * 0.015;
    groupRef.current.scale.setScalar(visibility * breath);

    // Pulse the pedestal glow
    if (pedestalRef.current) {
      const mat = pedestalRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.6 + Math.sin(t * 1.4) * 0.4;
      mat.opacity = visibility;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = visibility * (0.18 + Math.sin(t * 1.4) * 0.05);
    }

    // Fade the text by setting fillOpacity on the troika material
    [mainTextRef, subTextRef].forEach((ref) => {
      const mesh = ref.current as
        | (THREE.Mesh & {
            material: THREE.Material & {
              opacity?: number;
              transparent?: boolean;
            };
          })
        | null;
      if (mesh && mesh.material) {
        mesh.material.transparent = true;
        if ("opacity" in mesh.material) {
          mesh.material.opacity = visibility;
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, -2]}>
      {/* Big brand wordmark — white core with red outline glow */}
      <Text
        ref={mainTextRef}
        position={[0, 1.55, 0]}
        fontSize={0.42}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.06}
        outlineColor="#dc2626"
        outlineWidth={0.012}
        outlineBlur={0.06}
        outlineOpacity={1}
        material-toneMapped={false}
      >
        MOTOMARKET
      </Text>

      {/* Subtitle tagline */}
      <Text
        ref={subTextRef}
        position={[0, 1.18, 0]}
        fontSize={0.085}
        color="#dc2626"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.42}
        material-toneMapped={false}
      >
        RACE-GRADE EQUIPMENT
      </Text>

      {/* Pedestal — emissive red ring beneath the helmet */}
      <mesh
        ref={pedestalRef}
        position={[0, -1.62, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.22, 1.36, 96]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#ff1f1f"
          emissiveIntensity={1.8}
          metalness={0.4}
          roughness={0.3}
          toneMapped={false}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      {/* Soft glow disc fading outward from the pedestal */}
      <mesh
        ref={glowRef}
        position={[0, -1.625, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[1.7, 64]} />
        <meshBasicMaterial
          color="#ff1f1f"
          transparent
          opacity={0.18}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Distant horizon emissive disc — gradient sun for the "open road" beat.
 */
function HorizonDisc({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const p = progressRef.current;
    const visible = Math.max(0, 1 - Math.abs(p - 0.69) * 4);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.05 + visible * 0.75;
  });
  return (
    <mesh ref={ref} position={[0, -0.5, -22]}>
      <circleGeometry args={[6, 48]} />
      <meshBasicMaterial
        color="#ff7a2a"
        transparent
        opacity={0.05}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export function HeroCScene({ progress, reducedMotion, isMobile }: SceneProps) {
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const particleCount = isMobile ? 900 : 1800;
  const sparkleCount = isMobile ? 30 : 60;

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{
        antialias: !isMobile,
        powerPreference: "high-performance",
        alpha: false,
      }}
      camera={{ position: [0, 0.4, 8], fov: 42, near: 0.1, far: 100 }}
      frameloop={reducedMotion ? "demand" : "always"}
    >
      <SceneRig progressRef={progressRef} reducedMotion={reducedMotion} />
      <PerspectiveGrid />
      <SpeedStreaks progressRef={progressRef} count={particleCount} />
      <GodRays progressRef={progressRef} />
      <HorizonDisc progressRef={progressRef} />
      <CenterpieceObject progressRef={progressRef} />
      <BrandShowcase progressRef={progressRef} />
      {/* HDR environment for clearcoat reflections on the helmet — adds depth
          without changing the fog/background driven by SceneRig. */}
      <Environment
        preset="night"
        background={false}
        environmentIntensity={0.6}
      />
      <Sparkles
        count={sparkleCount}
        scale={[18, 8, 18]}
        position={[0, 1, -4]}
        size={2.4}
        speed={0.3}
        color="#ffd6a0"
        opacity={0.55}
      />
    </Canvas>
  );
}
