import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarFieldProps {
  count?: number;
}

export const StarField: React.FC<StarFieldProps> = ({ count = 200 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Generate random stars
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      // Distribute stars in a column around the play area
      const x = (Math.random() - 0.5) * 80;
      const y = (Math.random() - 0.2) * 120; // Bias slightly up
      const z = (Math.random() - 0.5) * 80;
      const scale = Math.random() * 0.3 + 0.1;
      const speed = Math.random() * 3 + 1; // Twinkle speed
      temp.push({ x, y, z, baseScale: scale, speed, time: Math.random() * 100 });
    }
    return temp;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    particles.forEach((p, i) => {
      p.time += delta * p.speed;
      // Twinkle effect: Simple sine wave on scale
      const s = p.baseScale + Math.sin(p.time) * 0.1 * p.baseScale;
      
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.2, 6, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
    </instancedMesh>
  );
};