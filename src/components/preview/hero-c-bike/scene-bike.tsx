"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";
import { HERO_C_MOODS, lerp, lerp3, moodForProgress } from "../hero-c/beats";

interface SceneProps {
  progress: number;
  reducedMotion: boolean;
  isMobile: boolean;
}

/* ────────────────────────────────────────────────────────────────────────────
   Scene rig — mood-driven lighting, fog, camera. Same approach as hero-c
   but camera sits lower with a slight 3/4 angle so the bike reads as 3D.
   ──────────────────────────────────────────────────────────────────────────── */
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

  useMemo(() => {
    scene.fog = new THREE.FogExp2(0x000000, 0.075);
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
      const proximity =
        Math.max(0, 1 - Math.abs(p - 0.05) * 5) +
        Math.max(0, 1 - Math.abs(p - 0.5) * 4) +
        Math.max(0, 1 - Math.abs(p - 0.92) * 5);
      spotRef.current.intensity = 5 + proximity * 14;
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = ambient;
    }

    // Camera: low-angle 3/4 view of the bike. Slight orbit during race beat.
    const raceOrbit =
      Math.sin(p * Math.PI * 2) *
      (p > 0.38 && p < 0.62 ? 1.1 : p > 0.18 && p < 0.4 ? 0.5 : 0.2);
    const targetX = raceOrbit;
    const targetY = lerp(-0.2, -0.8, p) + Math.sin(p * Math.PI) * 0.25;
    const targetZ = camZ;

    camera.position.x += (targetX - camera.position.x) * Math.min(1, delta * 4);
    camera.position.y += (targetY - camera.position.y) * Math.min(1, delta * 4);
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, delta * 4);
    camera.lookAt(0, -0.5, -3);

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
        intensity={2.4}
        color="#fff1d6"
      />
      <pointLight
        ref={rimLightRef}
        position={[-3, 1.5, -4]}
        intensity={5}
        distance={20}
        color="#ff2040"
      />
      <spotLight
        ref={spotRef}
        position={[0, 7, 5]}
        angle={0.5}
        penumbra={0.8}
        distance={32}
        intensity={10}
        color="#fff1d6"
        castShadow={false}
      />
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Race track — asphalt plane + receding lane markings + striped curbs.
   No textures; everything is geometry so the payload stays tiny.
   ──────────────────────────────────────────────────────────────────────────── */
function RaceTrack() {
  const dashGroupRef = useRef<THREE.Group>(null);
  const TRACK_LENGTH = 60;
  const DASH_SPACING = 3;
  const DASH_COUNT = Math.floor(TRACK_LENGTH / DASH_SPACING);

  const dashes = useMemo(() => {
    return Array.from({ length: DASH_COUNT }, (_, i) => ({
      z: -i * DASH_SPACING,
      key: i,
    }));
  }, [DASH_COUNT]);

  // Slow forward scroll of dashes/curbs to suggest the bike is in motion
  useFrame((state) => {
    if (!dashGroupRef.current) return;
    const t = state.clock.elapsedTime;
    dashGroupRef.current.position.z = (t * 2.5) % DASH_SPACING;
  });

  return (
    <group position={[0, -1.5, 0]}>
      {/* Asphalt floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
        <planeGeometry args={[36, TRACK_LENGTH]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.2}
          roughness={0.95}
        />
      </mesh>

      {/* Scrolling lane dashes (centerline) */}
      <group ref={dashGroupRef}>
        {dashes.map((d) => (
          <mesh
            key={d.key}
            position={[0, 0.005, d.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.18, 1.4]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.4}
              roughness={0.6}
              metalness={0.1}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Left curbing — red/white striped via alternating tiles */}
      <CurbStrip side={-1} length={TRACK_LENGTH} />
      <CurbStrip side={1} length={TRACK_LENGTH} />

      {/* Edge highlight rails — thin emissive lines at the curb's outer edge */}
      <mesh position={[-6.05, 0.04, -20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, TRACK_LENGTH]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#ff2424"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[6.05, 0.04, -20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, TRACK_LENGTH]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#ff2424"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function CurbStrip({ side, length }: { side: -1 | 1; length: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const tileWidth = 1.4;
  const tileCount = Math.floor(length / tileWidth);
  const tiles = useMemo(
    () =>
      Array.from({ length: tileCount }, (_, i) => ({
        z: -i * tileWidth,
        red: i % 2 === 0,
        key: i,
      })),
    [tileCount],
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.z = (state.clock.elapsedTime * 2.5) % tileWidth;
  });

  return (
    <group ref={groupRef} position={[side * 5.5, 0, 0]}>
      {tiles.map((tile) => (
        <mesh
          key={tile.key}
          position={[0, 0.02, tile.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1.0, tileWidth - 0.04]} />
          <meshStandardMaterial
            color={tile.red ? "#dc2626" : "#f4f4f4"}
            emissive={tile.red ? "#dc2626" : "#ffffff"}
            emissiveIntensity={tile.red ? 0.45 : 0.15}
            roughness={0.7}
            metalness={0.1}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Stylized sport motorcycle — built from primitives. Side-3/4 view in
   the camera. Headlight emissive, body brand-red with clearcoat. Wheels
   spin during race beat (#2).
   ──────────────────────────────────────────────────────────────────────────── */
const BIKE_Y = -1.5;
const WHEEL_RADIUS = 0.4;
const WHEELBASE = 1.55;

function Motorcycle({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const frontWheelRef = useRef<THREE.Group>(null);
  const rearWheelRef = useRef<THREE.Group>(null);
  const headlightRef = useRef<THREE.Mesh>(null);
  const exhaustGlowRef = useRef<THREE.Mesh>(null);
  const brakeRef = useRef<THREE.Mesh>(null);
  const brakeLightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const p = progressRef.current;
    const t = state.clock.elapsedTime;

    const intro = Math.max(0, 1 - Math.abs(p - 0.06) * 5);
    const race = Math.max(0, 1 - Math.abs(p - 0.5) * 3);
    const crafted = Math.max(0, 1 - Math.abs(p - 0.9) * 5);
    const visibility = Math.min(1, intro * 0.85 + race + crafted * 0.85);

    // Scale grows with visibility — no breathing/floating
    groupRef.current.scale.setScalar(0.75 + visibility * 0.35);

    // FIXED 3/4 view — no Y showcase rotation. Lean ONLY during race beat
    // (around the bike's forward axis = local X after Y rotation).
    groupRef.current.rotation.y = -Math.PI * 0.32;
    const targetLean = -race * 0.18;
    groupRef.current.rotation.x +=
      (targetLean - groupRef.current.rotation.x) * 0.08;

    // Grounded with subtle suspension bob (tiny, not floating)
    const bobAmount = race > 0.3 ? 0.012 : 0.004;
    groupRef.current.position.y = BIKE_Y + Math.sin(t * 4) * bobAmount;

    // Wheels roll around their Z axle (correct rolling axis)
    const wheelSpin = -(0.5 + race * 14) * t;
    if (frontWheelRef.current) frontWheelRef.current.rotation.z = wheelSpin;
    if (rearWheelRef.current) rearWheelRef.current.rotation.z = wheelSpin;

    if (headlightRef.current) {
      const mat = headlightRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 2.2 + Math.sin(t * 2.4) * 0.4;
    }
    if (exhaustGlowRef.current) {
      const mat = exhaustGlowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + race * (2.4 + Math.sin(t * 7) * 0.6);
    }
    if (brakeRef.current) {
      const mat = brakeRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = race * 0.9;
    }
    if (brakeLightRef.current) {
      const mat = brakeLightRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.2 + race * (1.4 + Math.sin(t * 8) * 0.3);
    }
  });

  return (
    <group ref={groupRef} position={[0, BIKE_Y, -3]}>
      {/* === WHEELS — wheels touch asphalt exactly at y=0 internal === */}
      <group ref={rearWheelRef} position={[-WHEELBASE / 2, WHEEL_RADIUS, 0]}>
        <Wheel />
      </group>
      <group ref={frontWheelRef} position={[WHEELBASE / 2, WHEEL_RADIUS, 0]}>
        <Wheel />
      </group>

      {/* === FRONT FORK (2 tubes per side: lower black + chrome inner) === */}
      {[-0.1, 0.1].map((z) => (
        <group key={z}>
          <mesh
            position={[WHEELBASE / 2 + 0.04, WHEEL_RADIUS + 0.4, z]}
            rotation={[0, 0, 0.18]}
          >
            <cylinderGeometry args={[0.04, 0.04, 0.7, 16]} />
            <meshStandardMaterial
              color="#0a0a0a"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          <mesh
            position={[WHEELBASE / 2 + 0.12, WHEEL_RADIUS + 0.85, z]}
            rotation={[0, 0, 0.18]}
          >
            <cylinderGeometry args={[0.045, 0.045, 0.45, 16]} />
            <meshStandardMaterial
              color="#cccccc"
              metalness={1}
              roughness={0.15}
            />
          </mesh>
        </group>
      ))}

      {/* Triple clamp (yoke) at top of forks */}
      <mesh
        position={[WHEELBASE / 2 + 0.18, WHEEL_RADIUS + 1.05, 0]}
        rotation={[0, 0, 0.18]}
        scale={[0.18, 0.05, 0.4]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* === ENGINE BLOCK — squashed sphere for curved sides === */}
      <group position={[0, WHEEL_RADIUS + 0.12, 0]}>
        <mesh scale={[1.1, 0.28, 0.5]}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshPhysicalMaterial
            color="#0a0a0a"
            metalness={0.8}
            roughness={0.4}
            clearcoat={0.4}
          />
        </mesh>
        {/* Cylinder head fins both sides */}
        {[0.51, -0.51].map((zSide) =>
          [-0.25, -0.12, 0.01, 0.14, 0.27].map((x) => (
            <mesh key={`${zSide}-${x}`} position={[x, 0.08, zSide]}>
              <boxGeometry args={[0.04, 0.2, 0.04]} />
              <meshStandardMaterial
                color="#666"
                metalness={0.85}
                roughness={0.4}
              />
            </mesh>
          )),
        )}
      </group>

      {/* === FUEL TANK (curved sphere) === */}
      <mesh
        position={[0.15, WHEEL_RADIUS + 0.6, 0]}
        rotation={[0, 0, -0.08]}
        scale={[0.55, 0.28, 0.3]}
      >
        <sphereGeometry args={[1, 32, 24]} />
        <meshPhysicalMaterial
          color="#dc2626"
          metalness={0.55}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Tank cap */}
      <mesh position={[0.15, WHEEL_RADIUS + 0.88, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 16]} />
        <meshStandardMaterial color="#aaa" metalness={1} roughness={0.2} />
      </mesh>

      {/* === SEAT (curved leather) === */}
      <mesh
        position={[-0.35, WHEEL_RADIUS + 0.6, 0]}
        rotation={[0, 0, -0.06]}
        scale={[0.4, 0.07, 0.22]}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial
          color="#080808"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* === REAR TAIL COWL === */}
      <mesh
        position={[-0.72, WHEEL_RADIUS + 0.5, 0]}
        rotation={[0, 0, -0.45]}
        scale={[0.32, 0.18, 0.17]}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshPhysicalMaterial
          color="#dc2626"
          metalness={0.5}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* Brake light */}
      <mesh ref={brakeLightRef} position={[-0.9, WHEEL_RADIUS + 0.46, 0]}>
        <boxGeometry args={[0.04, 0.06, 0.2]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#ff2020"
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
      {/* License plate */}
      <mesh position={[-0.92, WHEEL_RADIUS + 0.32, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.025, 0.09, 0.18]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
      </mesh>

      {/* === FRONT FAIRING === */}
      <mesh
        position={[0.7, WHEEL_RADIUS + 0.65, 0]}
        rotation={[0, 0, 0.22]}
        scale={[0.32, 0.32, 0.3]}
      >
        <sphereGeometry args={[1, 32, 24]} />
        <meshPhysicalMaterial
          color="#dc2626"
          metalness={0.55}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Fairing nose */}
      <mesh
        position={[0.92, WHEEL_RADIUS + 0.52, 0]}
        rotation={[0, 0, -0.4]}
        scale={[0.18, 0.18, 0.22]}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshPhysicalMaterial
          color="#dc2626"
          metalness={0.55}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* Headlight */}
      <mesh ref={headlightRef} position={[1.04, WHEEL_RADIUS + 0.5, 0]}>
        <sphereGeometry args={[0.1, 24, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fff8e8"
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>
      {/* Headlight chrome bezel ring */}
      <mesh position={[1.04, WHEEL_RADIUS + 0.5, 0]}>
        <torusGeometry args={[0.11, 0.012, 8, 24]} />
        <meshStandardMaterial color="#888" metalness={1} roughness={0.2} />
      </mesh>

      {/* Windscreen — tinted glass */}
      <mesh
        position={[0.78, WHEEL_RADIUS + 0.92, 0]}
        rotation={[0, 0, 0.5]}
        scale={[0.03, 0.25, 0.2]}
      >
        <sphereGeometry args={[1, 16, 12]} />
        <meshPhysicalMaterial
          color="#020202"
          metalness={1}
          roughness={0.05}
          clearcoat={1}
          envMapIntensity={2}
        />
      </mesh>

      {/* === HANDLEBARS === */}
      <mesh
        position={[0.64, WHEEL_RADIUS + 0.82, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.023, 0.023, 0.55, 12]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Grips */}
      {[-0.27, 0.27].map((z) => (
        <mesh
          key={z}
          position={[0.64, WHEEL_RADIUS + 0.82, z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.033, 0.033, 0.1, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
        </mesh>
      ))}

      {/* === MIRRORS (stem + head) === */}
      {[-0.32, 0.32].map((z) => (
        <group key={z}>
          <mesh
            position={[0.68, WHEEL_RADIUS + 0.92, z]}
            rotation={[0, 0, 0.4]}
          >
            <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.7} />
          </mesh>
          <mesh
            position={[0.73, WHEEL_RADIUS + 1.01, z]}
            scale={[0.05, 0.07, 0.02]}
          >
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial
              color="#0a0a0a"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* === SWINGARM === */}
      {[-0.16, 0.16].map((z) => (
        <mesh
          key={z}
          position={[-0.45, WHEEL_RADIUS + 0.02, z]}
          rotation={[0, 0, -0.06]}
          scale={[0.5, 0.04, 0.045]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.7}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* === REAR SUSPENSION SHOCK (visible cylinder + red spring) === */}
      <mesh
        position={[-0.35, WHEEL_RADIUS + 0.3, 0.05]}
        rotation={[0, 0, -0.55]}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.42, 12]} />
        <meshStandardMaterial color="#666" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh
        position={[-0.35, WHEEL_RADIUS + 0.3, 0.05]}
        rotation={[0, 0, -0.55]}
      >
        <cylinderGeometry args={[0.07, 0.07, 0.36, 8]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#dc2626"
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>

      {/* === EXHAUST (chrome muffler) === */}
      <mesh
        position={[-0.6, WHEEL_RADIUS + 0.08, 0.22]}
        rotation={[0, 0, Math.PI / 2 + 0.1]}
      >
        <cylinderGeometry args={[0.06, 0.08, 0.5, 16]} />
        <meshStandardMaterial color="#bbbbbb" metalness={1} roughness={0.18} />
      </mesh>
      {/* Exhaust glow tip */}
      <mesh
        ref={exhaustGlowRef}
        position={[-0.88, WHEEL_RADIUS + 0.05, 0.24]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <circleGeometry args={[0.07, 24]} />
        <meshStandardMaterial
          color="#ff4020"
          emissive="#ff4020"
          emissiveIntensity={0.4}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === CHAIN (small cylinders between sprockets) === */}
      <group position={[-0.42, WHEEL_RADIUS - 0.06, 0.21]}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh
            key={i}
            position={[-0.5 + (i / 11) * 1.0, 0, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.012, 0.012, 0.04, 6]} />
            <meshStandardMaterial
              color="#888"
              metalness={0.9}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>

      {/* === REAR SPROCKET (torus ring + teeth) === */}
      <mesh position={[-WHEELBASE / 2, WHEEL_RADIUS, 0.22]}>
        <torusGeometry args={[0.13, 0.013, 8, 32]} />
        <meshStandardMaterial color="#777" metalness={1} roughness={0.3} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2).map(
        (a, i) => (
          <mesh
            key={i}
            position={[
              -WHEELBASE / 2 + Math.cos(a) * 0.14,
              WHEEL_RADIUS + Math.sin(a) * 0.14,
              0.22,
            ]}
          >
            <boxGeometry args={[0.022, 0.022, 0.01]} />
            <meshStandardMaterial
              color="#888"
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
        ),
      )}

      {/* === BRAKE CALIPER (red, glows under braking) === */}
      <mesh
        ref={brakeRef}
        position={[WHEELBASE / 2 + 0.04, WHEEL_RADIUS + 0.14, 0.16]}
      >
        <boxGeometry args={[0.1, 0.08, 0.06]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#dc2626"
          emissiveIntensity={0}
          metalness={0.6}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>

      {/* === FOOTPEGS (left + right) === */}
      {[-0.32, 0.32].map((z) => (
        <mesh
          key={z}
          position={[-0.05, WHEEL_RADIUS - 0.18, z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.022, 0.022, 0.1, 8]} />
          <meshStandardMaterial color="#666" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}

      {/* === RACE NUMBER PLATE === */}
      <mesh
        position={[0.88, WHEEL_RADIUS + 0.72, 0.22]}
        rotation={[0, 0.6, 0.05]}
      >
        <boxGeometry args={[0.17, 0.2, 0.005]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.5} />
      </mesh>
      <Text
        position={[0.91, WHEEL_RADIUS + 0.72, 0.225]}
        rotation={[0, 0.6, 0.05]}
        fontSize={0.15}
        color="#0a0a0a"
        anchorX="center"
        anchorY="middle"
      >
        7
      </Text>

      {/* === SIDE STRIPES === */}
      {[-0.3, 0.3].map((z) => (
        <mesh
          key={z}
          position={[0.2, WHEEL_RADIUS + 0.22, z]}
          rotation={[0, 0, 0.1]}
          scale={[0.42, 0.05, 0.001]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.35}
            metalness={0.5}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* === GROUND SHADOW (oval at asphalt level) === */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 32]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Wheel() {
  return (
    <>
      {/* Tire — torus default normal = Z (axle along Z, perfect for side view) */}
      <mesh>
        <torusGeometry args={[0.4, 0.11, 24, 64]} />
        <meshStandardMaterial
          color="#080808"
          metalness={0.08}
          roughness={0.92}
        />
      </mesh>
      {/* Rim disc — short cylinder rotated to have axis on Z */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.07, 36]} />
        <meshPhysicalMaterial
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.22}
          clearcoat={0.6}
          clearcoatRoughness={0.1}
        />
      </mesh>
      {/* Inner chrome bezel ring */}
      <mesh position={[0, 0, 0.04]}>
        <torusGeometry args={[0.27, 0.012, 8, 40]} />
        <meshStandardMaterial color="#aaaaaa" metalness={1} roughness={0.2} />
      </mesh>
      {/* 5 red emissive spokes radiating in the wheel's plane (XY) */}
      {Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2).map(
        (a, i) => (
          <mesh key={i} rotation={[0, 0, a]} scale={[0.04, 0.26, 0.04]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#dc2626"
              emissive="#dc2626"
              emissiveIntensity={0.7}
              metalness={0.5}
              roughness={0.3}
              toneMapped={false}
            />
          </mesh>
        ),
      )}
      {/* Center hub (chrome cylinder along Z axle) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.13, 16]} />
        <meshStandardMaterial color="#777" metalness={1} roughness={0.2} />
      </mesh>
      {/* Brake disc (torus on right side of wheel) */}
      <mesh position={[0, 0, 0.085]}>
        <torusGeometry args={[0.22, 0.014, 8, 48]} />
        <meshStandardMaterial color="#888" metalness={1} roughness={0.25} />
      </mesh>
      {/* Brake disc cooling holes */}
      {Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2).map(
        (a, i) => (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.085]}
          >
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshBasicMaterial color="#000" />
          </mesh>
        ),
      )}
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Speed streaks — same idea as hero-c but tuned for track motion.
   ──────────────────────────────────────────────────────────────────────────── */
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
        x: (Math.random() - 0.5) * 24,
        y: -0.5 + Math.random() * 6,
        z: (Math.random() - 0.5) * 60,
        speed: 0.6 + Math.random() * 1.4,
        len: 0.5 + Math.random() * 2.5,
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
      d.z += d.speed * speedMul * delta * 16;
      if (d.z > 12) {
        d.z = -55 - Math.random() * 10;
        d.x = (Math.random() - 0.5) * 24;
        d.y = -0.5 + Math.random() * 6;
      }
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.set(0.012, 0.012, d.len * (0.6 + speedMul * 0.7));
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
        color="#ffd6a0"
        transparent
        opacity={0.6}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Brand showcase — MOTOMARKET wordmark + tagline above the bike.
   ──────────────────────────────────────────────────────────────────────────── */
function BrandShowcase({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const mainTextRef = useRef<THREE.Mesh | null>(null);
  const subTextRef = useRef<THREE.Mesh | null>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const p = progressRef.current;
    const t = state.clock.elapsedTime;

    const intro = Math.max(0, 1 - Math.abs(p - 0.06) * 6);
    const race = Math.max(0, 1 - Math.abs(p - 0.5) * 3);
    const crafted = Math.max(0, 1 - Math.abs(p - 0.9) * 6);
    const visibility = Math.min(1, intro + race * 0.7 + crafted);

    const breath = 1 + Math.sin(t * 0.7) * 0.012;
    groupRef.current.scale.setScalar(visibility * breath);

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
    <group ref={groupRef} position={[0, 1.7, -2]}>
      <Text
        ref={mainTextRef}
        position={[0, 0.25, 0]}
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
      <Text
        ref={subTextRef}
        position={[0, -0.12, 0]}
        fontSize={0.085}
        color="#dc2626"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.42}
        material-toneMapped={false}
      >
        TRACK-READY · DAY ONE
      </Text>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Distant haze disc — same as hero-c, sun for open-road beat.
   ──────────────────────────────────────────────────────────────────────────── */
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
    <mesh ref={ref} position={[0, 0.5, -22]}>
      <circleGeometry args={[7, 48]} />
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

/* ──────────────────────────────────────────────────────────────────────────── */
export function HeroCBikeScene({
  progress,
  reducedMotion,
  isMobile,
}: SceneProps) {
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const particleCount = isMobile ? 700 : 1400;
  const sparkleCount = isMobile ? 25 : 50;

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{
        antialias: !isMobile,
        powerPreference: "high-performance",
        alpha: false,
      }}
      camera={{ position: [0.5, -0.2, 6], fov: 46, near: 0.1, far: 100 }}
      frameloop={reducedMotion ? "demand" : "always"}
    >
      <SceneRig progressRef={progressRef} reducedMotion={reducedMotion} />
      <RaceTrack />
      <SpeedStreaks progressRef={progressRef} count={particleCount} />
      <HorizonDisc progressRef={progressRef} />
      <Motorcycle progressRef={progressRef} />
      <BrandShowcase progressRef={progressRef} />
      <Environment
        preset="night"
        background={false}
        environmentIntensity={0.7}
      />
      <Sparkles
        count={sparkleCount}
        scale={[18, 4, 18]}
        position={[0, 0, -4]}
        size={2.2}
        speed={0.4}
        color="#ffd6a0"
        opacity={0.5}
      />
    </Canvas>
  );
}
