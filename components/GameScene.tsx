import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, EffectComposer, Bloom } from '@react-three/drei';
import * as THREE from 'three';
import { Block } from './Block';
import { Debris } from './Debris';
import { StarField } from './StarField';
import { BoxState, GameStatus, Axis, DebrisState } from '../types';
import { audioManager } from '../utils/AudioManager';
import {
  BLOCK_HEIGHT,
  INITIAL_SIZE,
  MOVE_SPEED_BASE,
  MOVE_SPEED_INCREMENT,
  MOVE_RANGE,
  CAMERA_START_POS,
  CAMERA_FOV,
  BASE_HUE,
  HUE_STEP,
} from '../constants';
import confetti from 'canvas-confetti';

interface GameSceneProps {
  gameStatus: GameStatus;
  setScore: (score: number) => void;
  setGameStatus: (status: GameStatus) => void;
  triggerAction: boolean;
  setTriggerAction: (val: boolean) => void;
}

export const GameScene: React.FC<GameSceneProps> = ({
  gameStatus,
  setScore,
  setGameStatus,
  triggerAction,
  setTriggerAction
}) => {
  const [stack, setStack] = useState<BoxState[]>([]);
  const [debris, setDebris] = useState<DebrisState[]>([]);
  
  const activeBlockRef = useRef<THREE.Mesh>(null);
  const activeBlockState = useRef<BoxState | null>(null);
  const movementTime = useRef(0);
  const speed = useRef(MOVE_SPEED_BASE);
  const axis = useRef<Axis>('x');
  
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  const getGradientColor = (index: number) => {
    const hue = (BASE_HUE + index * HUE_STEP) % 360;
    return `hsl(${hue}, 100%, 60%)`;
  };

  const resetGame = () => {
    const baseBlock: BoxState = {
      position: [0, 0, 0],
      size: [INITIAL_SIZE, BLOCK_HEIGHT, INITIAL_SIZE],
      color: getGradientColor(0),
    };
    setStack([baseBlock]);
    setDebris([]);
    setScore(0);
    
    spawnNextBlock(baseBlock, 1);
    speed.current = MOVE_SPEED_BASE;

    if (cameraRef.current) {
        cameraRef.current.position.set(...CAMERA_START_POS);
        cameraRef.current.lookAt(0, 0, 0);
    }

    document.body.style.background = '#000000';
  };

  const spawnNextBlock = (prevBlock: BoxState, level: number) => {
    axis.current = level % 2 === 0 ? 'x' : 'z';
    
    const newPos: [number, number, number] = [
      prevBlock.position[0],
      prevBlock.position[1] + BLOCK_HEIGHT,
      prevBlock.position[2]
    ];

    if (axis.current === 'x') {
      newPos[0] -= MOVE_RANGE;
    } else {
      newPos[2] -= MOVE_RANGE;
    }

    activeBlockState.current = {
      position: newPos,
      size: [...prevBlock.size],
      color: getGradientColor(level),
    };
    
    movementTime.current = 0;
  };

  const placeBlock = () => {
    if (!activeBlockState.current || stack.length === 0) return;

    const current = activeBlockState.current;
    const prev = stack[stack.length - 1];
    const currentAxis = axis.current;
    const idx = currentAxis === 'x' ? 0 : 2;

    const realPosition = activeBlockRef.current!.position.toArray() as [number, number, number];
    
    const delta = realPosition[idx] - prev.position[idx];
    const overlap = prev.size[idx] - Math.abs(delta);

    if (overlap <= 0) {
      setGameStatus(GameStatus.GAME_OVER);
      audioManager.playFail();
      return;
    }

    const newSize = [...prev.size] as [number, number, number];
    newSize[idx] = overlap;

    const newPos = [...prev.position] as [number, number, number];
    newPos[1] += BLOCK_HEIGHT;
    newPos[idx] += delta / 2;

    const placedBlock: BoxState = {
      position: newPos,
      size: newSize,
      color: current.color
    };

    setStack((prevStack) => [...prevStack, placedBlock]);
    setScore(stack.length);
    audioManager.playPlace(stack.length);

    const debrisSize = [...prev.size] as [number, number, number];
    debrisSize[idx] -= overlap;

    const debrisPos = [...newPos] as [number, number, number];
    const sign = delta > 0 ? 1 : -1;
    debrisPos[idx] = newPos[idx] + (overlap / 2 + debrisSize[idx] / 2) * sign;

    const newDebris: DebrisState = {
      id: Math.random().toString(36),
      position: debrisPos,
      size: debrisSize,
      color: current.color,
      velocity: [
        currentAxis === 'x' ? sign * Math.random() : 0,
        Math.random() * 2,
        currentAxis === 'z' ? sign * Math.random() : 0,
      ],
      rotationSpeed: [Math.random(), Math.random(), Math.random()]
    };
    setDebris((prev) => [...prev, newDebris]);
    
    speed.current += MOVE_SPEED_INCREMENT;
    spawnNextBlock(placedBlock, stack.length + 1);

    if (stack.length % 10 === 0) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
  };

  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING) {
      resetGame();
    }
  }, [gameStatus]);

  useEffect(() => {
    if (triggerAction && gameStatus === GameStatus.PLAYING) {
      placeBlock();
      setTriggerAction(false);
    }
  }, [triggerAction]);

  useEffect(() => {
    if (stack.length > 0) {
      const hue = (BASE_HUE + (stack.length - 1) * HUE_STEP) % 360;
      document.body.style.transition = 'background 0.5s ease';
      document.body.style.background = `radial-gradient(circle at 50% 10%, hsl(${hue}, 80%, 10%), #000000)`;
    }
  }, [stack.length]);

  useFrame((state, delta) => {
    if (gameStatus !== GameStatus.PLAYING) return;

    if (activeBlockRef.current && activeBlockState.current) {
      movementTime.current += delta * speed.current;
      const moveValue = Math.sin(movementTime.current * 3) * MOVE_RANGE;
      
      const pos = [...activeBlockState.current.position];
      if (axis.current === 'x') pos[0] = moveValue;
      else pos[2] = moveValue;

      activeBlockRef.current.position.set(pos[0], pos[1], pos[2]);
    }

    if (cameraRef.current) {
        const stackHeight = Math.max(0, (stack.length - 1) * BLOCK_HEIGHT);
        const targetCamY = CAMERA_START_POS[1] + stackHeight;

        cameraRef.current.position.y = THREE.MathUtils.lerp(
            cameraRef.current.position.y,
            targetCamY,
            delta * 2.5 
        );

        cameraRef.current.position.x = CAMERA_START_POS[0];
        cameraRef.current.position.z = CAMERA_START_POS[2];
        cameraRef.current.lookAt(0, stackHeight, 0);
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[...CAMERA_START_POS]}
        fov={CAMERA_FOV}
        near={1}
        far={500}
      />

      <StarField count={200} />

      {/* Darker ambient light for neon effect */}
      <ambientLight intensity={0.2} />
      
      {/* Colored point lights for neon atmosphere */}
      <pointLight position={[10, 20, 10]} intensity={1.5} color="#ff00ff" distance={30} />
      <pointLight position={[-10, 15, -10]} intensity={1.5} color="#00ffff" distance={30} />
      <pointLight position={[0, 10, 15]} intensity={1.2} color="#ffff00" distance={25} />

      {/* Bloom post-processing for glow effect */}
      <EffectComposer>
        <Bloom 
          intensity={1.5} 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>

      <group>
        {stack.map((box, i) => (
          <Block key={i} {...box} />
        ))}

        {gameStatus === GameStatus.PLAYING && activeBlockState.current && (
          <group>
            {/* Main moving block with enhanced glow */}
            <mesh 
              ref={activeBlockRef} 
              position={activeBlockState.current.position} 
              castShadow 
              receiveShadow
            >
              <boxGeometry args={activeBlockState.current.size} />
              <meshStandardMaterial 
                color={activeBlockState.current.color} 
                roughness={0.2}
                metalness={0.8}
                emissive={activeBlockState.current.color}
                emissiveIntensity={0.8}
              />
            </mesh>
            
            {/* Glow layers for moving block */}
            <mesh position={activeBlockState.current.position}>
              <boxGeometry args={[
                activeBlockState.current.size[0] + 0.1, 
                activeBlockState.current.size[1] + 0.1, 
                activeBlockState.current.size[2] + 0.1
              ]} />
              <meshBasicMaterial 
                color={activeBlockState.current.color} 
                transparent 
                opacity={0.4} 
                depthWrite={false}
              />
            </mesh>
            
            <mesh position={activeBlockState.current.position}>
              <boxGeometry args={[
                activeBlockState.current.size[0] + 0.25, 
                activeBlockState.current.size[1] + 0.25, 
                activeBlockState.current.size[2] + 0.25
              ]} />
              <meshBasicMaterial 
                color={activeBlockState.current.color} 
                transparent 
                opacity={0.2} 
                depthWrite={false}
              />
            </mesh>
          </group>
        )}

        {debris.map((d) => (
          <Debris 
            key={d.id} 
            data={d} 
            onRemove={(id) => setDebris(prev => prev.filter(x => x.id !== id))} 
          />
        ))}
      </group>
    </>
  );
};
