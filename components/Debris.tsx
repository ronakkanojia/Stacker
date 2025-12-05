
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { DebrisState } from '../types';

interface DebrisProps {
  data: DebrisState;
  onRemove: (id: string) => void;
}

export const Debris: React.FC<DebrisProps> = ({ data, onRemove }) => {
  const meshRef = useRef<Mesh>(null);
  const [vel, setVel] = useState(data.velocity);
  
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Apply gravity
    const newVel = [...vel] as [number, number, number];
    newVel[1] -= 9.8 * delta; // Gravity
    setVel(newVel);

    // Apply position
    meshRef.current.position.x += newVel[0] * delta * 5; // Speed multiplier for visual flair
    meshRef.current.position.y += newVel[1] * delta;
    meshRef.current.position.z += newVel[2] * delta * 5;

    // Rotate
    meshRef.current.rotation.x += data.rotationSpeed[0] * delta;
    meshRef.current.rotation.y += data.rotationSpeed[1] * delta;
    meshRef.current.rotation.z += data.rotationSpeed[2] * delta;

    // Remove if too low
    if (meshRef.current.position.y < -10) {
      onRemove(data.id);
    }
  });

  return (
    <mesh ref={meshRef} position={data.position} castShadow receiveShadow>
      <boxGeometry args={data.size} />
      <meshStandardMaterial color={data.color} transparent opacity={0.8} />
    </mesh>
  );
};
