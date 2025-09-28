"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";

const PlaceholderFrames = () => {
  return (
    <group>
      <mesh position={[-1.2, 0.6, 0]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
      <mesh position={[0.4, 0.2, 0]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[1.2, -0.5, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshStandardMaterial color="#f472b6" />
      </mesh>
    </group>
  );
};

export const WallScene = () => {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <Suspense fallback={null}>
        <PlaceholderFrames />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} />
    </Canvas>
  );
};

export default WallScene;
