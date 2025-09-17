// src/components/Garden.tsx

import React, { useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Sun,
  Brain,
  Check,
  ShoppingCart,
} from 'lucide-react';
import './Garden.css';

// Define the interface for the user's data
interface UserData {
  focusPoints: number;
  gardenItems: string[];
  avatarItems: string[];
}

interface GardenProps {
  mode: 'pomodoro' | 'short-break' | 'long-break';
  time: number;
  isActive: boolean;
  isCycleComplete: boolean;
  cycles: number;
  videoUrls: { pomodoro: string; shortBreak: string; longBreak: string };
  formatTime: (seconds: number) => string;
  handleStartPause: () => void;
  handleReset: () => void;
  handleManualModeChange: (
    newMode: 'pomodoro' | 'short-break' | 'long-break',
  ) => void;
  startNextCycle: () => void;
  userItems: UserData; // <-- The type has been corrected here
  openStore: () => void;
}

const Garden: React.FC<GardenProps> = ({
  mode,
  time,
  isActive,
  isCycleComplete,
  cycles,
  videoUrls,
  formatTime,
  handleStartPause,
  handleReset,
  handleManualModeChange,
  startNextCycle,
  userItems,
  openStore,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const getVideoSource = () => {
    if (mode === 'pomodoro') return videoUrls.pomodoro;
    if (mode === 'short-break') return videoUrls.shortBreak;
    return videoUrls.longBreak;
  };

  return (
    <div className="garden-container">
      <video
        ref={videoRef}
        className="garden-video-background"
        src={getVideoSource()}
        autoPlay
        loop
        muted
      />
      <div className="garden-overlay">
        {/* Sección de la tienda y puntos */}
        <div className="top-controls">
          <div className="focus-points glass-effect">
            <span className="points-value">{userItems.focusPoints}</span>
            <span className="points-label">PF</span>
          </div>
          <button className="store-btn glass-effect" onClick={openStore}>
            <ShoppingCart size={24} /> Tienda
          </button>
        </div>

        {/* El avatar y los elementos del jardín van aquí, renderizados dinámicamente */}
        <div className="garden-elements-area">
          {/* Ejemplo de cómo renderizar items comprados */}
          {userItems.gardenItems.map((item: string) => (
            <img
              key={item}
              src={`/assets/items/${item}.png`}
              alt="Garden Item"
              className="garden-item"
            />
          ))}
          <div className="avatar-container">
            <img
              src="/assets/avatars/avatar_base.png"
              alt="Avatar"
              className="avatar-image"
            />
            {userItems.avatarItems.map((item: string) => (
              <img
                key={item}
                src={`/assets/items/${item}.png`}
                alt="Avatar Item"
                className="avatar-item"
              />
            ))}
          </div>
        </div>

        {/* Controles del temporizador */}
        <div className="bottom-controls">
          <div className="mode-selection glass-effect">
            <button
              className={`mode-btn ${mode === 'pomodoro' ? 'active' : ''}`}
              onClick={() => handleManualModeChange('pomodoro')}
            >
              <Brain size={20} /> Foco
            </button>
            <button
              className={`mode-btn ${mode === 'short-break' ? 'active' : ''}`}
              onClick={() => handleManualModeChange('short-break')}
            >
              <Coffee size={20} /> Corto
            </button>
            <button
              className={`mode-btn ${mode === 'long-break' ? 'active' : ''}`}
              onClick={() => handleManualModeChange('long-break')}
            >
              <Sun size={20} /> Largo
            </button>
          </div>

          <div className="timer-controls-container">
            <span className="timer-countdown-video">{formatTime(time)}</span>
            <div className="timer-controls">
              {isCycleComplete ? (
                <button
                  className="control-btn play-pause glass-effect"
                  onClick={startNextCycle}
                >
                  <Check size={28} /> Siguiente
                </button>
              ) : (
                <button
                  className="control-btn play-pause glass-effect"
                  onClick={handleStartPause}
                >
                  {isActive ? <Pause size={28} /> : <Play size={28} />}
                  {isActive ? 'Pausar' : 'Empezar'}
                </button>
              )}
              <button
                className="control-btn reset glass-effect"
                onClick={handleReset}
              >
                <RotateCcw size={28} />
              </button>
            </div>
          </div>

          <div className="cycle-info">Ciclos completados: **{cycles}**</div>
        </div>
      </div>
    </div>
  );
};

export default Garden;
