import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
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
  triggerAction: boolean; // Signal from UI to place block
  setTriggerAction: (val: boolean) => void;
}

export const GameScene: React.FC<GameSceneProps> = ({
  gameStatus,
  setScore,
  setGameStatus,
  triggerAction,
  setTriggerAction
}) => {
  // --- State ---
  const [stack, setStack] = useState<BoxState[]>([]);
  const [debris, setDebris] = useState<DebrisState[]>([]);
  
  // Current moving block properties (managed via refs for performance)
  const activeBlockRef = useRef<THREE.Mesh>(null);
  const activeBlockState = useRef<BoxState | null>(null);
  const movementTime = useRef(0);
  const speed = useRef(MOVE_SPEED_BASE);
  const axis = useRef<Axis>('x');
  
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  // --- Helpers ---
  const getGradientColor = (index: number) => {
    const hue = (BASE_HUE + index * HUE_STEP) % 360;
    return `hsl(${hue}, 80%, 60%)`;
  };


export const GameScene: React.FC<GameSceneProps> = ({
  gameStatus,
  setScore,
  setGameStatus,
  triggerAction,
  setTriggerAction
}) => {
  // --- State ---
  const [stack, setStack] = useState<BoxState[]>([]);
  const [debris, setDebris] = useState<DebrisState[]>([]);
  
  // Current moving block properties (managed via refs for performance)
  const activeBlockRef = useRef<THREE.Mesh>(null);
  const activeBlockState = useRef<BoxState | null>(null);
  const movementTime = useRef(0);
  const speed = useRef(MOVE_SPEED_BASE);
  const axis = useRef<Axis>('x');
  
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);




  const resetGame = () => {
    const baseBlock: BoxState = {
      position: [0, 0, 0],
      size: [INITIAL_SIZE, BLOCK_HEIGHT, INITIAL_SIZE],
      color: getGradientColor(0),
    };
    setStack([baseBlock]);
    setDebris([]);
    setScore(0);
    
    // Setup first moving block
    spawnNextBlock(baseBlock, 1);
    
    speed.current = MOVE_SPEED_BASE;

    // Reset Camera Position immediately
    if (cameraRef.current) {
        cameraRef.current.position.set(...CAMERA_START_POS);
        cameraRef.current.lookAt(0, 0, 0);
    }

    // Reset background color
    document.body.style.background = getGradientColor(0);
  };

  const spawnNextBlock = (prevBlock: BoxState, level: number) => {
    axis.current = level % 2 === 0 ? 'x' : 'z';
    
    const newPos: [number, number, number] = [
      prevBlock.position[0],
      prevBlock.position[1] + BLOCK_HEIGHT,
      prevBlock.position[2]
    ];

    // Start position (offset by range)
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

  // --- Game Logic ---

  const placeBlock = () => {
    if (!activeBlockState.current || stack.length === 0) return;

    const current = activeBlockState.current;
    const prev = stack[stack.length - 1];
    const currentAxis = axis.current;
    const idx = currentAxis === 'x' ? 0 : 2;

    // Calculate delta and overlap
    // current.position is managed by the ref in useFrame, we need to sync it
    const realPosition = activeBlockRef.current!.position.toArray() as [number, number, number];
    
    const delta = realPosition[idx] - prev.position[idx];
    const overlap = prev.size[idx] - Math.abs(delta);

    if (overlap <= 0) {
      // Game Over
      setGameStatus(GameStatus.GAME_OVER);
      audioManager.playFail();
      return;
    }

    // Success - trim block
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
    setScore(stack.length); // Current score is stack length (minus base)
    audioManager.playPlace(stack.length);

    // Create debris
    const debrisSize = [...prev.size] as [number, number, number];
    debrisSize[idx] -= overlap;

    const debrisPos = [...newPos] as [number, number, number];
    // Position debris on the side that was cut off
    const sign = delta > 0 ? 1 : -1;
    debrisPos[idx] = newPos[idx] + (overlap / 2 + debrisSize[idx] / 2) * sign;

    const newDebris: DebrisState = {
      id: Math.random().toString(36),
      position: debrisPos,
      size: debrisSize,
      color: current.color,
      velocity: [
        currentAxis === 'x' ? sign * Math.random() : 0,
        Math.random() * 2, // Slight pop up
        currentAxis === 'z' ? sign * Math.random() : 0,
      ],
      rotationSpeed: [Math.random(), Math.random(), Math.random()]
    };
    setDebris((prev) => [...prev, newDebris]);
    
    // Increase speed slightly
    speed.current += MOVE_SPEED_INCREMENT;

    // Prepare next
    spawnNextBlock(placedBlock, stack.length + 1);

    // Confetti every 10 blocks
    if (stack.length % 10 === 0) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
  };

  // --- Effects ---

  // Initialize game on load or restart
  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING) {
      // Always reset the game when status switches to PLAYING
      resetGame();
    }
  }, [gameStatus]);

  // Handle external trigger (mouse click / spacebar)
  useEffect(() => {
    if (triggerAction && gameStatus === GameStatus.PLAYING) {
      placeBlock();
      setTriggerAction(false);
    }
  }, [triggerAction]);

  // Update background color based on stack height
  useEffect(() => {
    if (stack.length > 0) {
      // Get the color of the top block
      const topColor = stack[stack.length - 1].color;
      // Animate body background
      document.body.style.transition = 'background 0.5s ease';
      
      // We want a nice gradient based on the current hue
      const hue = (BASE_HUE + (stack.length - 1) * HUE_STEP) % 360;
      
      const bgTop = `hsl(${hue}, 40%, 20%)`;
      const bgBottom = `hsl(${(hue + 40) % 360}, 40%, 10%)`;
      
      document.body.style.background = `radial-gradient(circle at 50% 10%, ${bgTop}, ${bgBottom})`;
    }
  }, [stack.length]);


  // --- Render Loop ---
  useFrame((state, delta) => {
    if (gameStatus !== GameStatus.PLAYING) return;

    // Move Active Block
    if (activeBlockRef.current && activeBlockState.current) {
      movementTime.current += delta * speed.current;
      const moveValue = Math.sin(movementTime.current * 3) * MOVE_RANGE;
      
      const pos = [...activeBlockState.current.position];
      if (axis.current === 'x') pos[0] = moveValue;
      else pos[2] = moveValue;

      // Manually updating ref mesh to avoid react re-renders
      activeBlockRef.current.position.set(pos[0], pos[1], pos[2]);
    }

    // --- Camera Follow Logic ---
    if (cameraRef.current) {
        // Calculate the current height of the stack top
        const stackHeight = Math.max(0, (stack.length - 1) * BLOCK_HEIGHT);
        
        // Target Camera Y: Start Y position + the height the tower has grown
        const targetCamY = CAMERA_START_POS[1] + stackHeight;

        // Smoothly move current Y to target Y
        cameraRef.current.position.y = THREE.MathUtils.lerp(
            cameraRef.current.position.y,
            targetCamY,
            delta * 2.5 
        );

        // Keep X and Z locked to their initial offsets relative to the center
        cameraRef.current.position.x = CAMERA_START_POS[0];
        cameraRef.current.position.z = CAMERA_START_POS[2];

        // LOOK AT LOGIC:
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

      {/* Dynamic Starfield Background */}
      <StarField count={200} />

      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
      />
      <pointLight position={[-10, 10, -10]} intensity={0.4} color="#00ffff" />

      <group>
        {/* Stacked Blocks */}
        {stack.map((box, i) => (
          <Block key={i} {...box} />
        ))}

        {/* Current Moving Block */}
        {gameStatus === GameStatus.PLAYING && activeBlockState.current && (
           <mesh 
             ref={activeBlockRef} 
             position={activeBlockState.current.position} 
             castShadow 
             receiveShadow
           >
             <boxGeometry args={activeBlockState.current.size} />
             <meshStandardMaterial 
                color={activeBlockState.current.color} 
                roughness={0.1}
                emissive={activeBlockState.current.color}
                emissiveIntensity={0.2}
             />
             {/* Highlight edges */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[activeBlockState.current.size[0] + 0.02, activeBlockState.current.size[1] + 0.02, activeBlockState.current.size[2] + 0.02]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.2} side={1} /> 
              </mesh>
           </mesh>
        )}

        {/* Debris */}
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
