import React, { useRef } from 'react';
import { BoxState } from '../types';
import { Mesh } from 'three';

interface BlockProps extends BoxState {
  isMoving?: boolean;
}

export const Block: React.FC<BlockProps> = ({ position, size, color }) => {
  const meshRef = useRef<Mesh>(null);

  return (
    <group>
      {/* Main neon block with emission */}
      <mesh ref={meshRef} position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.2} 
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Outer glow layer 1 - closest */}
      <mesh position={position}>
        <boxGeometry args={[size[0] + 0.05, size[1] + 0.05, size[2] + 0.05]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.3} 
          depthWrite={false}
        />
      </mesh>
      
      {/* Outer glow layer 2 - middle */}
      <mesh position={position}>
        <boxGeometry args={[size[0] + 0.15, size[1] + 0.15, size[2] + 0.15]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.15} 
          depthWrite={false}
        />
      </mesh>
      
      {/* Outer glow layer 3 - farthest */}
      <mesh position={position}>
        <boxGeometry args={[size[0] + 0.3, size[1] + 0.3, size[2] + 0.3]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.05} 
          depthWrite={false}
        />
      </mesh>
      
      {/* Edge highlight */}
      <mesh position={position}>
        <boxGeometry args={[size[0] + 0.02, size[1] + 0.02, size[2] + 0.02]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.4} 
          side={1}
          depthWrite={false}
        /> 
      </mesh>
    </group>
  );
};
