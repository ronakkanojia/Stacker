import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarFieldProps {
  count?: number;
}

export const StarField: React.FC<StarFieldProps> = ({ count }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Detect device performance and adjust star count
  const [optimalCount, setOptimalCount] = useState(400);
  
  useEffect(() => {
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
    
    if (count) {
      setOptimalCount(count);
    } else if (isMobile && isLowEnd) {
      setOptimalCount(300); // Low-end mobile
    } else if (isMobile) {
      setOptimalCount(500); // Mid-range mobile
    } else {
      setOptimalCount(800); // Desktop
    }
  }, [count]);
  
  // Generate random stars with varied properties
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < optimalCount; i++) {
      // Create depth layers for more 3D effect
      const depth = Math.random();
      const x = (Math.random() - 0.5) * 120;
      const y = (Math.random() - 0.1) * 180; // Extended range
      const z = (Math.random() - 0.5) * 120;
      
      // Vary star properties based on depth
      const scale = (Math.random() * 0.5 + 0.2) * (depth * 0.5 + 0.5);
      const speed = Math.random() * 2 + 0.5;
      const brightness = Math.random() * 0.4 + 0.6;
      
      // Color variation - mix of white, blue-white, and warm stars
      const colorType = Math.random();
      let color;
      if (colorType < 0.6) {
        color = new THREE.Color('#ffffff'); // Pure white
      } else if (colorType < 0.85) {
        color = new THREE.Color('#cce7ff'); // Blue-white
      } else {
        color = new THREE.Color('#ffffcc'); // Warm yellow-white
      }
      
      temp.push({ 
        x, y, z, 
        baseScale: scale, 
        speed, 
        time: Math.random() * 100,
        brightness,
        color,
        depth
      });
    }
    return temp;
  }, [optimalCount]);

  // Create color array for instanced mesh
  const colors = useMemo(() => {
    const colorArray = new Float32Array(optimalCount * 3);
    particles.forEach((p, i) => {
      colorArray[i * 3] = p.color.r;
      colorArray[i * 3 + 1] = p.color.g;
      colorArray[i * 3 + 2] = p.color.b;
    });
    return colorArray;
  }, [particles, optimalCount]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Throttle updates slightly for better mobile performance
    const updateInterval = optimalCount > 600 ? 1 : 1;
    
    particles.forEach((p, i) => {
      p.time += delta * p.speed;
      
      // Enhanced twinkle with varied patterns
      const twinkle1 = Math.sin(p.time) * 0.3;
      const twinkle2 = Math.sin(p.time * 1.5 + 1) * 0.2;
      const s = p.baseScale * (1 + twinkle1 + twinkle2);
      
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, optimalCount]}>
      {/* Use lower poly count on mobile */}
      <sphereGeometry args={[0.25, optimalCount < 500 ? 6 : 8, optimalCount < 500 ? 6 : 8]} />
      <meshBasicMaterial 
        vertexColors
        transparent 
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
      <instancedBufferAttribute
        attach="geometry-attributes-color"
        args={[colors, 3]}
      />
    </instancedMesh>
  );
};