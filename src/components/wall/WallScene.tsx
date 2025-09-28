"use client";

import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Float,
  Html,
  Image,
  OrbitControls,
  useCursor,
} from "@react-three/drei";
import { Suspense, useMemo, useState } from "react";
import type { WallInstance } from "@/lib/wall";

const IMAGE_SCALE: [number, number, number] = [1.06, 1.2, 1];
const IMAGE_OFFSET: [number, number, number] = [0, 0.02, 0];

const WallFrame = ({ instance }: { instance: WallInstance }) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const isLeader = instance.order === 0;
  const isTopFive = instance.order < 5;
  const labelClasses = [
    "min-w-[160px] rounded-full border px-3 py-1 text-xs font-semibold shadow-lg shadow-black/40 backdrop-blur transition-all",
    hovered ? "scale-[1.03]" : "",
    isLeader
      ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-100"
      : isTopFive
        ? "border-sky-400/50 bg-sky-500/10 text-sky-100"
        : "border-slate-700/60 bg-slate-900/80 text-slate-200",
  ]
    .filter(Boolean)
    .join(" ");

  const baseScale = hovered ? instance.scale * 1.08 : instance.scale;
  const distanceFactor = Math.max(5.4, 6.4 - (instance.scale - 1) * 2.2);
  const labelOffset = -0.9 - (instance.scale - 1) * 0.35;

  return (
    <Float
      speed={hovered ? 1.35 : 0.9}
      rotationIntensity={hovered ? 0.45 : 0.18}
      floatIntensity={hovered ? 1.2 : 0.6}
    >
      <group
        position={instance.position}
        scale={[baseScale, baseScale, 1]}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHovered(false);
        }}
      >
        <mesh position={[0, 0, -0.08]}>
          <planeGeometry args={[1.32, 1.32]} />
          <meshStandardMaterial
            color={hovered ? "#1e293b" : "#0f172a"}
            metalness={0.15}
            roughness={0.8}
          />
        </mesh>
        <mesh position={[0, 0, -0.04]} castShadow>
          <planeGeometry args={[1.16, 1.16]} />
          <meshStandardMaterial color="#111827" metalness={0.18} roughness={0.65} />
        </mesh>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image url={instance.imageUrl} scale={IMAGE_SCALE} position={IMAGE_OFFSET} toneMapped={false} />
        <Html
          transform
          position={[0, labelOffset, 0]}
          distanceFactor={distanceFactor}
          occlude
          className="pointer-events-none select-none"
        >
          <div className={labelClasses}>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/10 px-2 py-px text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                #{instance.order + 1}
              </span>
              <span>{instance.name}</span>
            </div>
            <div className="mt-1 text-[10px] font-normal text-slate-300">
              Elo {instance.elo} | Matches {instance.matches}
            </div>
          </div>
        </Html>
      </group>
    </Float>
  );
};

const Frames = ({ wall }: { wall: WallInstance[] }) => {
  return (
    <group>
      {wall.map((instance) => (
        <WallFrame key={instance.id} instance={instance} />
      ))}
    </group>
  );
};

const EmptyState = () => {
  return (
    <Html center>
      <div className="rounded-full border border-white/20 bg-slate-900/80 px-4 py-2 text-sm text-slate-200">
        Seed a few celebs to bring the wall to life.
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
    >
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 8, 6]} intensity={1.2} castShadow />
      <directionalLight position={[-6, -3, -6]} intensity={0.4} />
      <Suspense fallback={null}>
        {hasActors ? <Frames wall={wall} /> : <EmptyState />}
        <Environment preset="city" background={false} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={6.4}
        maxDistance={16}
        target={[0, -0.2, 0]}
      />
    </Canvas>
  );
};

export default WallScene;
