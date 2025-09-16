// src/components/PomodoroTimer.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import './PomodoroTimer.css';
import { Play, Pause, RotateCcw, Coffee, Sun, Brain } from 'lucide-react';

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

const videoUrls = {
  pomodoro: '/public/estudiar.mp4',
  shortBreak: '/public/descansar.mp4',
  longBreak: '/public/dormir.mp4',
};

const PomodoroTimer = () => {
  const [mode, setMode] = useState<'pomodoro' | 'short-break' | 'long-break'>(
    'pomodoro',
  );
  const [time, setTime] = useState(POMODORO_TIME);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleModeChange = useCallback(() => {
    setIsActive(false); // Pausa el temporizador al cambiar de modo
    // Lógica para registrar el tiempo en Firestore (ejemplo)
    // if (mode === 'pomodoro') {
    //   db.collection('studySessions').add({
    //     userId: '...',
    //     duration: POMODORO_TIME / 60,
    //     timestamp: new Date()
    //   });
    // }

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
      if (videoRef.current) {
        videoRef.current.play();
      }
    } else {
      if (interval) clearInterval(interval);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (time === 0 && isActive) {
        new Audio('/path/to/notification_sound.mp3').play();
        handleModeChange();
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time, handleModeChange]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setCycles(0);
    setMode('pomodoro');
    setTime(POMODORO_TIME);
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
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const getVideoSource = () => {
    if (mode === 'pomodoro') return videoUrls.pomodoro;
    if (mode === 'short-break') return videoUrls.shortBreak;
    return videoUrls.longBreak;
  };

  return (
    <div className="pomodoro-focus-mode">
      <video
        ref={videoRef}
        className="pomodoro-video-background"
        src={getVideoSource()}
        autoPlay
        loop
        muted
      />
      <div className="pomodoro-overlay">
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
            <button
              className="control-btn play-pause glass-effect"
              onClick={handleStartPause}
            >
              {isActive ? <Pause size={28} /> : <Play size={28} />}
            </button>
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
  );
};

export default PomodoroTimer;
