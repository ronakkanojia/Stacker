import React, { useRef } from 'react';
import { BoxState } from '../types';
import { Mesh } from 'three';

interface BlockProps extends BoxState {
  isMoving?: boolean;
}

export const Block: React.FC<BlockProps> = ({ position, size, color }) => {
  const meshRef = useRef<Mesh>(null);

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.1} metalness={0.1} />
      {/* Add a subtle edge highlight for better visibility */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[size[0] + 0.02, size[1] + 0.02, size[2] + 0.02]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={1} /> 
      </mesh>
    </mesh>
  );
};
