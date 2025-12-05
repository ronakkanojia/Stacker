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
  const glowRef = useRef<Mesh>(null);
  const [vel, setVel] = useState(data.velocity);
  
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const newVel = [...vel] as [number, number, number];
    newVel[1] -= 9.8 * delta;
    setVel(newVel);

    meshRef.current.position.x += newVel[0] * delta * 5;
    meshRef.current.position.y += newVel[1] * delta;
    meshRef.current.position.z += newVel[2] * delta * 5;

    meshRef.current.rotation.x += data.rotationSpeed[0] * delta;
    meshRef.current.rotation.y += data.rotationSpeed[1] * delta;
    meshRef.current.rotation.z += data.rotationSpeed[2] * delta;

    // Sync glow with main mesh
    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current.position);
      glowRef.current.rotation.copy(meshRef.current.rotation);
    }

    if (meshRef.current.position.y < -10) {
      onRemove(data.id);
    }
  });

  return (
    <group>
      {/* Main debris piece */}
      <mesh ref={meshRef} position={data.position} castShadow receiveShadow>
        <boxGeometry args={data.size} />
        <meshStandardMaterial 
          color={data.color} 
          transparent 
          opacity={0.9}
          emissive={data.color}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Glow layer */}
      <mesh ref={glowRef} position={data.position}>
        <boxGeometry args={[
          data.size[0] + 0.1, 
          data.size[1] + 0.1, 
          data.size[2] + 0.1
        ]} />
        <meshBasicMaterial 
          color={data.color} 
          transparent 
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
