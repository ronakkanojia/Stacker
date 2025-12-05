import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Types
type Axis = 'x' | 'z';

interface BoxState {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

interface DebrisState extends BoxState {
  id: string;
  velocity: [number, number, number];
  rotationSpeed: [number, number, number];
}

enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

// Constants
const BLOCK_HEIGHT = 1;
const INITIAL_SIZE = 3.5;
const MOVE_SPEED_BASE = 0.6;
const MOVE_SPEED_INCREMENT = 0.01;
const MOVE_RANGE = 5;
const CAMERA_START_POS = [10, 10, 10] as const;
const CAMERA_FOV = 35;
const BASE_HUE = 200;
const HUE_STEP = 6;

// Audio Manager
class AudioManager {
  private ctx: AudioContext | null = null;
  private notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];

  private init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Audio not supported');
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playPlace(score: number) {
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const noteIndex = score % 7;
    const octave = Math.floor(score / 7);
    const baseFreq = this.notes[noteIndex];
    const freq = baseFreq * Math.pow(2, octave);

    osc.frequency.setValueAtTime(Math.min(freq, 2093), t);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playFail() {
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.5);
    osc.type = 'sawtooth';

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.5);
  }
}

const audioManager = new AudioManager();

// Components
const Block: React.FC<BoxState> = ({ position, size, color }) => {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.1} metalness={0.1} />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[size[0] + 0.02, size[1] + 0.02, size[2] + 0.02]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.BackSide} />
      </mesh>
    </mesh>
  );
};

const Debris: React.FC<{ data: DebrisState; onRemove: (id: string) => void }> = ({ data, onRemove }) => {
  const meshRef = useRef<THREE.Mesh>(null);
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

const StarField: React.FC<{ count?: number }> = ({ count = 200 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 80;
      const y = (Math.random() - 0.2) * 120;
      const z = (Math.random() - 0.5) * 80;
      const scale = Math.random() * 0.3 + 0.1;
      const speed = Math.random() * 3 + 1;
      temp.push({ x, y, z, baseScale: scale, speed, time: Math.random() * 100 });
    }
    return temp;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    particles.forEach((p, i) => {
      p.time += delta * p.speed;
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

const GameScene: React.FC<{
  gameStatus: GameStatus;
  setScore: (score: number) => void;
  setGameStatus: (status: GameStatus) => void;
  triggerAction: boolean;
  setTriggerAction: (val: boolean) => void;
}> = ({ gameStatus, setScore, setGameStatus, triggerAction, setTriggerAction }) => {
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
    return `hsl(${hue}, 80%, 60%)`;
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
      size: [...prevBlock.size] as [number, number, number],
      color: getGradientColor(level),
    };
    
    movementTime.current = 0;
  };

  const placeBlock = () => {
    if (!activeBlockState.current || !activeBlockRef.current || stack.length === 0) return;

    const current = activeBlockState.current;
    const prev = stack[stack.length - 1];
    const currentAxis = axis.current;
    const idx = currentAxis === 'x' ? 0 : 2;

    const realPosition = activeBlockRef.current.position.toArray() as [number, number, number];
    
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
        near={0.1}
        far={500}
      />

      <StarField count={200} />

      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={0.8} 
        castShadow 
      />
      <pointLight position={[-10, 10, -10]} intensity={0.4} color="#00ffff" />

      <group>
        {stack.map((box, i) => (
          <Block key={i} {...box} />
        ))}

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
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[
                  activeBlockState.current.size[0] + 0.02, 
                  activeBlockState.current.size[1] + 0.02, 
                  activeBlockState.current.size[2] + 0.02
                ]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.2} side={THREE.BackSide} />
              </mesh>
           </mesh>
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

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.MENU);
  const [score, setScore] = useState(0);
  const [triggerAction, setTriggerAction] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [showScorePulse, setShowScorePulse] = useState(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);

  const handleInput = useCallback(() => {
    if (gameStatus === GameStatus.MENU || gameStatus === GameStatus.GAME_OVER) {
      setGameStatus(GameStatus.PLAYING);
      setScore(0);
    } else if (gameStatus === GameStatus.PLAYING) {
      setTriggerAction(true);
    }
  }, [gameStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
    if (score > 0) {
      setShowScorePulse(true);
      setTimeout(() => setShowScorePulse(false), 300);
    }
  }, [score, highScore]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden cursor-pointer select-none bg-gray-900"
      onPointerDown={(e) => {
        e.preventDefault(); 
        handleInput();
      }}
    >
      {canvasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">WebGL Error</h2>
            <p className="mb-4">{canvasError}</p>
            <p className="text-sm text-gray-400">Your browser may not support WebGL</p>
          </div>
        </div>
      ) : (
        <Canvas 
          shadows 
          dpr={[1, 2]}
          onCreated={({ gl }) => {
            gl.setClearColor('#1a1a1a');
          }}
          onError={(error) => setCanvasError(error.message)}
        >
          <GameScene 
            gameStatus={gameStatus}
            setScore={setScore}
            setGameStatus={setGameStatus}
            triggerAction={triggerAction}
            setTriggerAction={setTriggerAction}
          />
        </Canvas>
      )}

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10">
          <div className={`w-full flex flex-col items-center pt-12 transition-all duration-500 ${gameStatus === GameStatus.MENU ? 'opacity-0' : 'opacity-100'}`}>
              <div className="text-sm font-bold text-white/40 tracking-widest uppercase mb-2">
                Score
              </div>
              
              <div className={`relative transition-transform duration-200 ${showScorePulse ? 'scale-110' : 'scale-100'}`}>
                <div className="text-8xl font-black text-white drop-shadow-lg">
                  {score}
                </div>
              </div>

              {highScore > 0 && gameStatus === GameStatus.PLAYING && (
                <div className="absolute top-6 right-6 flex flex-col items-end">
                  <div className="text-xs text-white/40 uppercase">Best</div>
                  <div className="text-2xl font-bold text-white/60">{highScore}</div>
                </div>
              )}
          </div>

          {gameStatus === GameStatus.MENU && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
                  <div className="flex flex-col items-center mb-12">
                      <h1 className="text-7xl md:text-9xl font-black text-white drop-shadow-lg mb-3">
                        STACKER
                      </h1>
                      
                      <div className="px-6 py-2 bg-white/10 backdrop-blur text-white font-bold tracking-widest text-sm uppercase">
                        3D NEON EDITION
                      </div>
                  </div>
                  
                  <div className="animate-bounce flex flex-col items-center gap-6">
                      <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                      </div>
                      <p className="text-white text-xl font-bold tracking-widest uppercase">
                        Tap to Start
                      </p>
                      <p className="text-white/50 text-sm">
                        Press SPACE or TAP
                      </p>
                  </div>
                  
                  {highScore > 0 && (
                    <div className="absolute bottom-16 flex items-center gap-3 bg-yellow-500/20 backdrop-blur-md px-8 py-4 rounded-full">
                        <span className="text-yellow-200/60 text-sm">High Score:</span>
                        <span className="text-white font-black text-xl">{highScore}</span>
                    </div>
                  )}
              </div>
          )}

          {gameStatus === GameStatus.GAME_OVER && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md pointer-events-auto">
                  <div className="bg-gray-900/90 border-2 border-white/20 p-12 rounded-3xl flex flex-col items-center max-w-md w-full mx-4">
                      <h2 className="text-5xl font-black text-red-400 mb-8">
                        GAME OVER
                      </h2>
                      
                      <div className="flex flex-col items-center mb-8">
                        <span className="text-white/40 text-xs font-bold uppercase mb-3">Final Score</span>
                        <span className="text-9xl font-black text-white">{score}</span>
                      </div>

                      <div className="flex items-center gap-3 mb-10 bg-yellow-500/20 px-8 py-3 rounded-full">
                        <span className="text-yellow-200/70 text-sm font-semibold">BEST:</span>
                        <span className="text-white text-xl font-black">{highScore}</span>
                      </div>
                      
                      <button 
                          onClick={(e) => { e.stopPropagation(); handleInput(); }}
                          className="px-10 py-5 bg-white text-black font-black text-xl tracking-widest rounded-2xl w-full hover:scale-105 active:scale-95 transition-all"
                      >
                        PLAY AGAIN
                      </button>

                      <p className="text-white/40 text-xs mt-6 text-center">
                        Tip: Time your taps perfectly for a perfect stack!
                      </p>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default App;
