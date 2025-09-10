// src/components/PomodoroTimer.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import './PomodoroTimer.css';
import { Play, Pause, RotateCcw, Coffee, Sun, Brain } from 'lucide-react';

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

const PomodoroTimer = () => {
  const [mode, setMode] = useState<'pomodoro' | 'short-break' | 'long-break'>(
    'pomodoro',
  );
  const [time, setTime] = useState(POMODORO_TIME);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);

  // Referencias para cada video
  const pomodoroVideoRef = useRef<HTMLVideoElement>(null);
  const shortBreakVideoRef = useRef<HTMLVideoElement>(null);
  const longBreakVideoRef = useRef<HTMLVideoElement>(null);

  const handleModeChange = useCallback(() => {
    setIsActive(false);
    // Pausar todos los videos al cambiar de modo
    pomodoroVideoRef.current?.pause();
    shortBreakVideoRef.current?.pause();
    longBreakVideoRef.current?.pause();

    if (mode === 'pomodoro') {
      const newCycles = cycles + 1;
      setCycles(newCycles);
      if (newCycles % 4 === 0) {
        setMode('long-break');
        setTime(LONG_BREAK);
      } else {
        setMode('short-break');
        setTime(SHORT_BREAK);
      }
    } else {
      setMode('pomodoro');
      setTime(POMODORO_TIME);
    }
  }, [mode, cycles]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      handleModeChange();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time, handleModeChange]);

  const handleStartPause = () => {
    // Lógica para reproducir el video según el modo actual
    if (!isActive) {
      if (mode === 'pomodoro') {
        pomodoroVideoRef.current?.play();
      } else if (mode === 'short-break') {
        shortBreakVideoRef.current?.play();
      } else if (mode === 'long-break') {
        longBreakVideoRef.current?.play();
      }
    } else {
      pomodoroVideoRef.current?.pause();
      shortBreakVideoRef.current?.pause();
      longBreakVideoRef.current?.pause();
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setCycles(0);
    setMode('pomodoro');
    setTime(POMODORO_TIME);
    // Reiniciar y pausar todos los videos
    pomodoroVideoRef.current?.pause();
    pomodoroVideoRef.current?.load();
    shortBreakVideoRef.current?.pause();
    shortBreakVideoRef.current?.load();
    longBreakVideoRef.current?.pause();
    longBreakVideoRef.current?.load();
  };

  const handleManualModeChange = (
    newMode: 'pomodoro' | 'short-break' | 'long-break',
  ) => {
    setIsActive(false);
    setMode(newMode);
    if (newMode === 'pomodoro') {
      setTime(POMODORO_TIME);
    } else if (newMode === 'short-break') {
      setTime(SHORT_BREAK);
    } else {
      setTime(LONG_BREAK);
    }
    // Reiniciar y pausar todos los videos al cambiar manualmente
    pomodoroVideoRef.current?.pause();
    pomodoroVideoRef.current?.load();
    shortBreakVideoRef.current?.pause();
    shortBreakVideoRef.current?.load();
    longBreakVideoRef.current?.pause();
    longBreakVideoRef.current?.load();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const calculateProgress = () => {
    let totalTime;
    if (mode === 'pomodoro') totalTime = POMODORO_TIME;
    else if (mode === 'short-break') totalTime = SHORT_BREAK;
    else totalTime = LONG_BREAK;
    return 100 - (time / totalTime) * 100;
  };

  return (
    <div className="pomodoro-container">
      <header className="pomodoro-header">
        <h1 className="pomodoro-title">Temporizador Pomodoro</h1>
        <p className="pomodoro-subtitle">
          Divide tus tareas en intervalos para mejorar tu concentración y
          productividad.
        </p>
      </header>

      <div className="pomodoro-main-content">
        {/* Contenedor principal para los videos */}
        <div className={`video-container-wrapper ${isActive ? 'visible' : ''}`}>
          {/* Videos de Pomodoro, Descanso Corto y Descanso Largo */}
          <video
            ref={pomodoroVideoRef}
            src="/video.mp4"
            autoPlay={false}
            loop
            className={`video-aesthetics ${mode === 'pomodoro' ? '' : 'hidden'}`}
          />
          <video
            ref={shortBreakVideoRef}
            src="/tiktok.mp4"
            autoPlay={false}
            loop
            className={`video-aesthetics ${mode === 'short-break' ? '' : 'hidden'}`}
          />
          <video
            ref={longBreakVideoRef}
            src="/descanso.mp4"
            autoPlay={false}
            loop
            className={`video-aesthetics ${mode === 'long-break' ? '' : 'hidden'}`}
          />
        </div>

        <div className="timer-panel">
          <div className="mode-selection">
            <button
              className={`mode-btn ${mode === 'pomodoro' ? 'active' : ''}`}
              onClick={() => handleManualModeChange('pomodoro')}
            >
              <Brain size={20} /> Pomodoro
            </button>
            <button
              className={`mode-btn ${mode === 'short-break' ? 'active' : ''}`}
              onClick={() => handleManualModeChange('short-break')}
            >
              <Coffee size={20} /> Descanso Corto
            </button>
            <button
              className={`mode-btn ${mode === 'long-break' ? 'active' : ''}`}
              onClick={() => handleManualModeChange('long-break')}
            >
              <Sun size={20} /> Descanso Largo
            </button>
          </div>

          <div className="timer-display">
            <svg className="progress-ring" width="300" height="300">
              <circle
                className="progress-ring-background"
                strokeWidth="10"
                fill="transparent"
                r="140"
                cx="150"
                cy="150"
              />
              <circle
                className={`progress-ring-foreground mode-${mode}`}
                strokeWidth="10"
                fill="transparent"
                r="140"
                cx="150"
                cy="150"
                style={{
                  strokeDashoffset: `calc(880 - (880 * ${calculateProgress()}) / 100)`,
                }}
              />
            </svg>
            <span className="timer-countdown">{formatTime(time)}</span>
          </div>

          <div className="timer-controls">
            <button
              className="control-btn play-pause"
              onClick={handleStartPause}
            >
              {isActive ? <Pause size={28} /> : <Play size={28} />}
              {isActive ? 'Pausar' : 'Empezar'}
            </button>
            <button className="control-btn reset" onClick={handleReset}>
              <RotateCcw size={28} />
              Reiniciar
            </button>
          </div>

          <div className="cycle-info">Ciclos completados: **{cycles}**</div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
