import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './components/GameScene';
import { GameStatus } from './types';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.MENU);
  const [score, setScore] = useState(0);
  const [triggerAction, setTriggerAction] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [showScorePulse, setShowScorePulse] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  // Check WebGL support on mobile
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebglSupported(false);
      alert('WebGL is not supported on your device. The game may not work properly.');
    }
  }, []);

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
    // Trigger pulse animation on score change
    if (score > 0) {
      setShowScorePulse(true);
      setTimeout(() => setShowScorePulse(false), 300);
    }
  }, [score, highScore]);

  if (!webglSupported) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white text-center p-4">
        <div>
          <h1 className="text-4xl font-bold mb-4">WebGL Not Supported</h1>
          <p>Your device doesn't support WebGL, which is required for this game.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full overflow-hidden cursor-pointer select-none"
      style={{ 
        height: '100vh',
        height: '100dvh', // Dynamic viewport height for mobile
        touchAction: 'none', // Prevent scrolling/zooming on mobile
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
      }}
      onPointerDown={(e) => {
        e.preventDefault(); 
        handleInput();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
      }}
    >
      {/* 3D Canvas - Mobile Optimized */}
      <Canvas 
        shadows 
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 0, 0], fov: 75 }}
      >
        <GameScene 
          gameStatus={gameStatus}
          setScore={setScore}
          setGameStatus={setGameStatus}
          triggerAction={triggerAction}
          setTriggerAction={setTriggerAction}
        />
      </Canvas>

      {/* --- ENHANCED UI LAYER --- */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10 font-sans">
          
          {/* HUD: Score during gameplay with enhanced styling */}
          <div className={`w-full flex flex-col items-center pt-12 transition-all duration-500 ease-out transform ${gameStatus === GameStatus.MENU ? 'opacity-0 -translate-y-10' : 'opacity-100 translate-y-0'}`}>
              {/* Score label */}
              <div className="text-sm font-bold text-white/40 tracking-[0.3em] uppercase mb-2">
                Score
              </div>
              
              {/* Main score with glow effect */}
              <div className={`relative transition-transform duration-200 ${showScorePulse ? 'scale-110' : 'scale-100'}`}>
                <div className="absolute inset-0 blur-2xl bg-white/20 rounded-full scale-150"></div>
                <div className="relative text-8xl md:text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] tabular-nums tracking-tighter">
                  {score}
                </div>
              </div>

              {/* High score indicator (small, top right) */}
              {highScore > 0 && gameStatus === GameStatus.PLAYING && (
                <div className="absolute top-6 right-6 flex flex-col items-end">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Best</div>
                  <div className="text-2xl font-bold text-white/60 tabular-nums">{highScore}</div>
                </div>
              )}
          </div>

          {/* ENHANCED MENU SCREEN */}
          {gameStatus === GameStatus.MENU && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/40 via-black/20 to-black/40 backdrop-blur-[3px] pointer-events-auto transition-opacity duration-500">
                  
                  {/* Animated background elements */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                  </div>

                  <div className="flex flex-col items-center mb-12 relative z-10">
                      {/* Enhanced Logo with glow */}
                      <div className="relative mb-6">
                        <div className="absolute inset-0 blur-3xl bg-white/20 scale-110"></div>
                        <h1 className="relative text-5xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-200 to-purple-300 drop-shadow-[0_10px_40px_rgba(255,255,255,0.3)] tracking-tighter italic transform -skew-x-6 mb-3 animate-pulse">
                          STACKER
                        </h1>
                      </div>
                      
                      {/* Subtitle badge */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl"></div>
                        <div className="relative px-4 md:px-6 py-2 bg-gradient-to-r from-white to-gray-200 text-black font-black tracking-[0.3em] md:tracking-[0.4em] text-xs md:text-base uppercase transform -skew-x-6 shadow-lg">
                          3D NEON EDITION
                        </div>
                      </div>
                  </div>
                  
                  {/* Enhanced Start Prompt with icon */}
                  <div className="animate-bounce flex flex-col items-center gap-6 mt-8 relative z-10">
                      <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center backdrop-blur-sm bg-white/5">
                        <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                      </div>
                      <p className="text-white text-xl md:text-2xl font-bold tracking-[0.3em] uppercase drop-shadow-lg">
                        Tap to Start
                      </p>
                      <p className="text-white/50 text-sm tracking-wider">
                        Press SPACE or TAP
                      </p>
                  </div>
                  
                  {/* High Score Display */}
                  {highScore > 0 && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md px-6 md:px-8 py-3 md:py-4 rounded-full border border-yellow-500/30 shadow-lg">
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="flex flex-col">
                          <span className="text-yellow-200/60 text-xs uppercase tracking-wider">High Score</span>
                          <span className="text-white font-black text-lg md:text-xl tabular-nums">{highScore}</span>
                        </div>
                    </div>
                  )}

                  {/* Decorative corner elements */}
                  <div className="absolute top-8 left-8 w-12 h-12 md:w-16 md:h-16 border-l-2 border-t-2 border-white/20"></div>
                  <div className="absolute top-8 right-8 w-12 h-12 md:w-16 md:h-16 border-r-2 border-t-2 border-white/20"></div>
                  <div className="absolute bottom-8 left-8 w-12 h-12 md:w-16 md:h-16 border-l-2 border-b-2 border-white/20"></div>
                  <div className="absolute bottom-8 right-8 w-12 h-12 md:w-16 md:h-16 border-r-2 border-b-2 border-white/20"></div>
              </div>
          )}

          {/* ENHANCED GAME OVER SCREEN */}
          {gameStatus === GameStatus.GAME_OVER && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md pointer-events-auto transition-opacity duration-300">
                  <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 border-2 border-white/20 p-8 md:p-12 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col items-center max-w-md w-full mx-4 transform transition-all animate-[slideUp_0.5s_ease-out]">
                      
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-purple-500/10 rounded-3xl blur-2xl"></div>

                      {/* Game Over Title */}
                      <div className="relative mb-6 md:mb-8">
                        <div className="absolute inset-0 blur-2xl bg-red-500/30"></div>
                        <h2 className="relative text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 tracking-tight drop-shadow-lg">
                          GAME OVER
                        </h2>
                      </div>
                      
                      {/* Score Display */}
                      <div className="flex flex-col items-center mb-6 md:mb-8 relative">
                        <span className="text-white/40 text-xs font-bold uppercase tracking-[0.3em] mb-3">Final Score</span>
                        <div className="relative">
                          <div className="absolute inset-0 blur-3xl bg-white/20 scale-150"></div>
                          <span className="relative text-7xl md:text-9xl font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.5)] leading-none tabular-nums">{score}</span>
                        </div>
                      </div>

                      {/* High Score Badge */}
                      <div className="flex items-center gap-3 mb-8 md:mb-10 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-6 md:px-8 py-3 rounded-full border border-yellow-500/30 backdrop-blur-sm relative">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="flex items-baseline gap-2">
                          <span className="text-yellow-200/70 text-sm font-semibold tracking-wider">BEST:</span>
                          <span className="text-white text-lg md:text-xl font-black tabular-nums">{highScore}</span>
                        </div>
                      </div>
                      
                      {/* Replay Button */}
                      <button 
                          onClick={(e) => { e.stopPropagation(); handleInput(); }}
                          className="group relative px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-white to-gray-100 text-black font-black text-lg md:text-xl tracking-[0.2em] rounded-2xl w-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] overflow-hidden"
                      >
                          <span className="relative z-10 flex items-center justify-center gap-3">
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            PLAY AGAIN
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                      </button>

                      {/* Tip */}
                      <p className="text-white/40 text-xs mt-4 md:mt-6 text-center">
                        Tip: Time your taps perfectly for a perfect stack!
                      </p>
                  </div>
              </div>
          )}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default App;
