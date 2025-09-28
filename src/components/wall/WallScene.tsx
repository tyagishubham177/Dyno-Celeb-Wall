"use client";

import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Html,
  Image,
  OrbitControls,
  useCursor,
} from "@react-three/drei";
import { Suspense, useMemo, useState } from "react";
import type { WallInstance } from "@/lib/wall";

const WallFrame = ({ instance }: { instance: WallInstance }) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  return (
    <group
      position={instance.position}
      scale={[instance.scale, instance.scale, 1]}
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
        <planeGeometry args={[1.3, 1.3]} />
        <meshStandardMaterial color={hovered ? "#1e293b" : "#0f172a"} />
      </mesh>
      <mesh position={[0, 0, -0.04]} castShadow>
        <planeGeometry args={[1.12, 1.12]} />
        <meshStandardMaterial color="#1f2937" metalness={0.1} roughness={0.9} />
      </mesh>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image
        url={instance.imageUrl}
        scale={[1, 1, 1]}
        position={[0, 0, 0]}
        toneMapped={false}
      />
      <Html
        transform
        position={[0, -0.85, 0]}
        distanceFactor={6}
        occlude
        className="pointer-events-none select-none"
      >
        <div className="rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-100 shadow-lg shadow-black/40 backdrop-blur">
          {instance.order + 1}. {instance.name}
          <div className="mt-1 text-[10px] font-normal text-slate-300">
            Elo {instance.elo} | Matches {instance.matches}
          </div>
        </div>
      </Html>
    </group>
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
      return 7;
    }

    if (wall.length < 9) {
      return 8;
    }

    if (wall.length < 25) {
      return 9.5;
    }

    return 11;
  }, [hasActors, wall.length]);

  return (
    <Canvas camera={{ position: [0, 0, cameraZ], fov: 45 }} shadows>
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 6, 6]} intensity={1.1} castShadow />
      <directionalLight position={[-6, -4, -6]} intensity={0.35} />
      <Suspense fallback={null}>
        {hasActors ? <Frames wall={wall} /> : <EmptyState />}
        <Environment preset="city" />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={5.5}
        maxDistance={16}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
};

export default WallScene;

