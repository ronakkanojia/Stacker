import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './components/GameScene';
import { GameStatus } from './types';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.MENU);
  const [score, setScore] = useState(0);
  const [triggerAction, setTriggerAction] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Input handling
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
  }, [score, highScore]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden cursor-pointer select-none"
      onPointerDown={(e) => {
        e.preventDefault(); 
        handleInput();
      }}
    >
      {/* 3D Canvas */}
      <Canvas shadows dpr={[1, 2]}>
        <GameScene 
          gameStatus={gameStatus}
          setScore={setScore}
          setGameStatus={setGameStatus}
          triggerAction={triggerAction}
          setTriggerAction={setTriggerAction}
        />
      </Canvas>

      {/* --- UI LAYER --- */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10 font-sans">
          
          {/* HUD: Score during gameplay */}
          <div className={`w-full flex justify-center pt-16 transition-all duration-500 ease-out transform ${gameStatus === GameStatus.MENU ? 'opacity-0 -translate-y-10' : 'opacity-100 translate-y-0'}`}>
              <div className="text-8xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)] tabular-nums tracking-tighter">
                  {score}
              </div>
          </div>

          {/* MENU SCREEN */}
          {gameStatus === GameStatus.MENU && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-500">
                  <div className="flex flex-col items-center mb-16">
                      {/* Logo / Title */}
                      <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] tracking-tighter italic transform -skew-x-6 mb-2">
                          STACKER
                      </h1>
                      <div className="px-3 py-1 bg-white text-black font-black tracking-[0.3em] text-sm md:text-base uppercase transform -skew-x-6">
                          3D Edition
                      </div>
                  </div>
                  
                  {/* Pulse Prompt */}
                  <div className="animate-pulse flex flex-col items-center gap-4 mt-8">
                      <p className="text-white text-xl md:text-2xl font-bold tracking-widest uppercase drop-shadow-md">
                          Tap to Start
                      </p>
                  </div>
                  
                  <div className="absolute bottom-12 text-white/50 text-sm font-bold tracking-widest bg-black/20 px-4 py-2 rounded-full">
                      HIGH SCORE: {highScore}
                  </div>
              </div>
          )}

          {/* GAME OVER SCREEN */}
          {gameStatus === GameStatus.GAME_OVER && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300">
                  <div className="bg-white/10 border border-white/20 p-10 rounded-[2rem] backdrop-blur-xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 transform transition-all animate-[bounce_0.5s_ease-out]">
                      
                      <h2 className="text-4xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
                          GAME OVER
                      </h2>
                      
                      <div className="flex flex-col items-center mb-10">
                          <span className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-2">Final Score</span>
                          <span className="text-8xl font-black text-white drop-shadow-2xl leading-none">{score}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-10 bg-black/30 px-6 py-2 rounded-full border border-white/10">
                          <span className="text-yellow-400 text-lg">★</span>
                          <span className="text-white/90 text-sm font-bold tracking-wider">BEST: {highScore}</span>
                      </div>
                      
                      <button 
                          onClick={(e) => { e.stopPropagation(); handleInput(); }}
                          className="group relative px-8 py-4 bg-white text-black font-black text-lg tracking-widest rounded-2xl w-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(255,255,255,0.5)] overflow-hidden"
                      >
                          <span className="relative z-10">REPLAY</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                      </button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default App;
