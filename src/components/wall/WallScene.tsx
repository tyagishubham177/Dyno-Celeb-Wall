"use client";

import { Canvas, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  Html,
  OrbitControls,
  useCursor,
  useTexture,
} from "@react-three/drei";
import { Suspense, useMemo, useState } from "react";
import type { WallInstance } from "@/lib/wall";
import * as THREE from "three";

const IMAGE_SCALE: [number, number] = [1.06, 1.2];
const IMAGE_OFFSET: [number, number, number] = [0, 0.02, 0];

const WallFrame = ({
  instance,
  hoveredId,
  setHoveredId,
}: {
  instance: WallInstance;
  hoveredId: number | null;
  setHoveredId: (id: number | null) => void;
}) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const isLeader = instance.order === 0;
  const isTopFive = instance.order < 5;
  const labelClasses = [
    "min-w-[180px] rounded-2xl border px-4 py-2 text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all duration-300",
    hovered ? "scale-105" : "",
    isLeader
      ? "border-amber-400/80 bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-orange-500/20 text-amber-50 shadow-amber-500/30"
      : isTopFive
        ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-indigo-500/15 text-cyan-50 shadow-cyan-500/20"
        : "border-slate-600/40 bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 text-slate-100",
  ]
    .filter(Boolean)
    .join(" ");

  const isDimmed = hoveredId !== null && hoveredId !== instance.id;
  const baseScale = hovered
    ? instance.scale * 1.15
    : isDimmed
      ? instance.scale * 0.85
      : instance.scale;
  const distanceFactor = Math.max(5.4, 6.4 - (instance.scale - 1) * 2.2);
  const labelOffset = -0.95 - (instance.scale - 1) * 0.35;

  // Load texture and render it double-sided so it looks correct from behind
  const texture = useTexture(instance.imageUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Glow color for top performers
  const glowColor = isLeader ? "#fbbf24" : isTopFive ? "#22d3ee" : "#475569";
  const glowIntensity = hovered ? (isLeader ? 2.5 : isTopFive ? 1.8 : 0.8) : (isLeader ? 1.5 : isTopFive ? 1.0 : 0);

  return (
    <Float
      speed={hovered ? 1.5 : 1.0}
      rotationIntensity={hovered ? 0.5 : 0.2}
      floatIntensity={hovered ? 1.4 : 0.7}
    >
      <group
        position={instance.position}
        scale={[baseScale, baseScale, 1]}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          setHoveredId(instance.id);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHovered(false);
          setHoveredId(null);
        }}
      >
        {/* Glow effect for top performers */}
        {glowIntensity > 0 && (
          <mesh position={[0, 0, -0.12]} scale={1.15}>
            <planeGeometry args={[1.4, 1.4]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={glowIntensity * 0.15}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}

        {/* Outer frame with metallic finish */}
        <mesh position={[0, 0, -0.08]}>
          <planeGeometry args={[1.32, 1.32]} />
          <meshStandardMaterial
            color={hovered ? (isLeader ? "#78350f" : isTopFive ? "#164e63" : "#1e293b") : "#0f172a"}
            metalness={0.7}
            roughness={0.3}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Inner frame shadow */}
        <mesh position={[0, 0, -0.04]} castShadow>
          <planeGeometry args={[1.16, 1.16]} />
          <meshStandardMaterial
            color="#0a0a0f"
            metalness={0.4}
            roughness={0.5}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Image */}
        <mesh position={IMAGE_OFFSET}>
          <planeGeometry args={IMAGE_SCALE} />
          <meshBasicMaterial
            map={texture}
            toneMapped={false}
            side={THREE.DoubleSide}
            opacity={isDimmed ? 0.9 : 1}
            transparent={isDimmed}
          />
        </mesh>

        {/* Spotlight effect for leader/top 5 when hovered */}
        {hovered && (isLeader || isTopFive) && (
          <pointLight
            position={[0, 0, 1.5]}
            intensity={isLeader ? 2 : 1.2}
            distance={3}
            color={glowColor}
            decay={2}
          />
        )}

        {hovered ? (
          <Html
            transform
            position={[0, labelOffset, 0]}
            distanceFactor={distanceFactor}
            occlude
            className="pointer-events-none select-none"
          >
            <div className={labelClasses}>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                    isLeader
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950"
                      : isTopFive
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-cyan-950"
                        : "bg-white/15 text-white/90"
                  }`}
                >
                  #{instance.order + 1}
                </span>
                <span className="font-bold">{instance.name}</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs">
                <span className={isLeader || isTopFive ? "font-semibold" : "font-normal"}>
                  ⚡ {instance.elo}
                </span>
                <span className="text-white/70">•</span>
                <span className="text-white/80">{instance.matches} matches</span>
              </div>
            </div>
          </Html>
        ) : null}
      </group>
    </Float>
  );
};

const Frames = ({ wall }: { wall: WallInstance[] }) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Compute viewport in world units
  const viewport = useThree((state) => state.viewport.getCurrentViewport(state.camera, [0, 0, 0]));
  const viewWidth = viewport.width;
  const viewHeight = viewport.height;

  // Estimate content bounds using positions and nominal frame size
  const bounds = useMemo(() => {
    if (wall.length === 0) {
      return { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const it of wall) {
      const halfW = it.scale * (IMAGE_SCALE[0] / 2 + 0.15);
      const halfH = it.scale * (IMAGE_SCALE[1] / 2 + 0.15);
      const x = it.position[0];
      const y = it.position[1];
      minX = Math.min(minX, x - halfW);
      maxX = Math.max(maxX, x + halfW);
      minY = Math.min(minY, y - halfH);
      maxY = Math.max(maxY, y + halfH);
    }
    return { minX, maxX, minY, maxY };
  }, [wall]);

  const margin = 0.05; // 5% from each edge
  const usableW = viewWidth * (1 - margin * 2);
  const usableH = viewHeight * (1 - margin * 2);
  const contentW = Math.max(0.001, bounds.maxX - bounds.minX);
  const contentH = Math.max(0.001, bounds.maxY - bounds.minY);
  const scale = Math.min(usableW / contentW, usableH / contentH);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return (
    <group scale={[scale, scale, 1]} position={[-centerX * scale, -centerY * scale, 0]}>
      {wall.map((instance) => (
        <WallFrame
          key={instance.id}
          instance={instance}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />
      ))}
    </group>
  );
};

const EmptyState = () => {
  return (
    <Html center>
      <div className="group flex flex-col items-center gap-3 rounded-3xl border border-white/15 bg-white/5 px-8 py-6 text-center text-sm text-white/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400/30" />
          <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 text-lg text-white shadow-lg shadow-cyan-500/40">
            🎪
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-white">The gallery awaits its stars</p>
          <p className="text-xs text-white/70">Seed a few celebs to bring the wall to life.</p>
        </div>
      </div>
    </Html>
  );
};

type WallSceneProps = {
  wall: WallInstance[];
};

export const WallScene = ({ wall }: WallSceneProps) => {
  const hasActors = wall.length > 0;
  const cameraZ = useMemo(() => {
    if (!hasActors) {
      return 8;
    }

    if (wall.length <= 4) {
      return 7.5;
    }

    if (wall.length <= 9) {
      return 8.6;
    }

    if (wall.length <= 25) {
      return 10.2;
    }

    return 12.5;
  }, [hasActors, wall.length]);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.4, cameraZ], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.enabled = true;
        gl.shadowMap.autoUpdate = true;
      }}
    >
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 6, 22]} />
      <ambientLight intensity={0.45} color="#fef3c7" />
      <spotLight
        position={[0, 6, 2]}
        angle={Math.PI / 5}
        penumbra={0.6}
        intensity={2}
        color="#fbbf24"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
      />
      <directionalLight
        position={[4, 2, 6]}
        intensity={0.7}
        color="#e0f2fe"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-6, 1, -4]} intensity={0.6} color="#38bdf8" />
      <directionalLight position={[0, -4, -6]} intensity={0.35} color="#0ea5e9" />
      <Suspense fallback={null}>
        {hasActors ? <Frames wall={wall} /> : <EmptyState />}
        <Environment preset="city" background={false} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        minDistance={6.4}
        maxDistance={14}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 1.9}
        minAzimuthAngle={-Math.PI / 9}
        maxAzimuthAngle={Math.PI / 9}
        target={[0, -0.2, 0]}
      />
    </Canvas>
  );
};

export default WallScene;

