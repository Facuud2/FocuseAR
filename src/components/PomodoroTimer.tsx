// src/components/PomodoroTimer.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import './PomodoroTimer.css';
import { useDatabase } from '../hooks/useDatabase';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Sun,
  Brain,
  // Gem, // Comentado temporalmente
  Check,
} from 'lucide-react';
import StudyArea from './StudyArea';

// Define the interfaces for store items, achievements, and rewards
// Tipos de tienda/logros/recompensas eliminados para simplificar el componente

// Timer constants
const POMODORO_TIME = 0.5 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

const videoUrls = {
  // Los assets en la carpeta `public` se sirven desde la raíz, por eso no incluimos '/public' en la ruta
  pomodoro: '/estudiar.mp4',
  shortBreak: '/descansar.mp4',
  longBreak: '/dormir.mp4',
};

// Achievements removed

const PomodoroTimer = () => {
  const [mode, setMode] = useState<'pomodoro' | 'short-break' | 'long-break'>(
    'pomodoro',
  );
  const [time, setTime] = useState(POMODORO_TIME);
  const [isActive, setIsActive] = useState(false);
  // Variables de gamificación - mantener funcionalidad pero ocultar UI
  const [cycles, setCycles] = useState(0);
  const [consecutiveCycles, setConsecutiveCycles] = useState(0);
  const [isCycleComplete, setIsCycleComplete] = useState(false);
  const [focusPoints, setFocusPoints] = useState(0);

  // Variable para evitar múltiples ejecuciones del guardado
  const isProcessingCompletion = useRef(false);
  const handleModeChangeRef = useRef<(() => void) | null>(null);

  void cycles; // Suprime warning de variable no usada
  const [currentStudyTopic, setCurrentStudyTopic] = useState<{
    id: string;
    name: string;
    estimatedTime: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(
    null,
  );

  const { saveUserStudySession } = useDatabase();

  // Load state from local storage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('pomodoroState');
    if (savedState) {
      const state = JSON.parse(savedState);
      setFocusPoints(state.focusPoints);
    }
    if (!notificationSound.current) {
      try {
        notificationSound.current = new Audio('/audio/notification_sound.mp3');
      } catch {
        // ignore audio init errors
        // console.warn('Audio init failed');
        notificationSound.current = null;
      }
    }
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    const state = { focusPoints };
    localStorage.setItem('pomodoroState', JSON.stringify(state));
  }, [focusPoints]);

  // handleModeChange -> called cuando un timer llega a 0
  const handleModeChange = useCallback(async () => {
    // Evitar múltiples ejecuciones
    if (isProcessingCompletion.current) {
      return;
    }

    isProcessingCompletion.current = true;

    try {
      setIsActive(false);
      setIsCycleComplete(true);

      // play notification sound if available, handle promise errors
      if (notificationSound.current) {
        try {
          const sp = notificationSound.current.play();
          if (sp && typeof sp.catch === 'function') sp.catch(() => {});
        } catch {
          // ignore play errors
        }
      }

      if (mode === 'pomodoro') {
        const pointsEarned = 25 + consecutiveCycles * 10;
        setFocusPoints((prev) => prev + pointsEarned);
        setConsecutiveCycles((prev) => prev + 1);
        setCycles((prev) => prev + 1);

        // Guardar la sesión de estudio en Firestore
        try {
          const actualDurationMinutes = Math.round(POMODORO_TIME / 60);

          await saveUserStudySession({
            type: 'pomodoro',
            duration: actualDurationMinutes,
            meta: {
              topic: currentStudyTopic?.name || null,
              topicId: currentStudyTopic?.id || null,
              pointsEarned,
              consecutiveCycles: consecutiveCycles + 1,
            },
          });
        } catch (error) {
          console.error('Error al guardar sesión de pomodoro:', error);
        }

        // Show in-app toast notification
        setToast({
          title: 'Felicidades',
          message:
            '¡Has completado un Pomodoro! El temporizador está listo para iniciar de nuevo.',
        });
        setTimeout(() => setToast(null), 4000);

        // Reset timer to Pomodoro time and keep it paused so user can start manually
        setMode('pomodoro');
        setTime(POMODORO_TIME);
      } else {
        setConsecutiveCycles(0);
      }
    } finally {
      // Permitir nueva ejecución después de un pequeño delay
      setTimeout(() => {
        isProcessingCompletion.current = false;
      }, 1000);
    }
  }, [mode, consecutiveCycles, saveUserStudySession, currentStudyTopic]);

  // Actualizar el ref cada vez que cambie handleModeChange
  useEffect(() => {
    handleModeChangeRef.current = handleModeChange;
  }, [handleModeChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      // start interval and handle reaching 0 inside it to avoid race conditions
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            // reached zero (or below) - clear interval and call handler
            if (interval) clearInterval(interval);
            setTimeout(() => {
              handleModeChangeRef.current?.();
            }, 0);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      if (videoRef.current) {
        try {
          const p = videoRef.current.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch {
          // Some browsers throw synchronously if no source; ignore
        }
      }
    } else {
      if (interval) clearInterval(interval);
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch {
          // ignore
        }
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]); // Solo dependencia necesaria

  // startNextCycle removed: next Pomodoro is prepared automatically on cycle end

  const handleStartPause = () => setIsActive(!isActive);

  const handleReset = () => {
    setIsActive(false);
    setIsCycleComplete(false);
    setCycles(0);
    setConsecutiveCycles(0);
    setMode('pomodoro');
    setTime(POMODORO_TIME);
    isProcessingCompletion.current = false;
  };

  const handleManualModeChange = (
    newMode: 'pomodoro' | 'short-break' | 'long-break',
  ) => {
    setIsActive(false);
    setIsCycleComplete(false);
    setConsecutiveCycles(0);
    setMode(newMode);
    if (newMode === 'pomodoro') setTime(POMODORO_TIME);
    else if (newMode === 'short-break') setTime(SHORT_BREAK);
    else setTime(LONG_BREAK);
    isProcessingCompletion.current = false;
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

  // Función para iniciar sesión de estudio con un tema específico
  const handleStartStudySession = (topic: {
    id: string;
    name: string;
    estimatedTime: string;
  }) => {
    setCurrentStudyTopic(topic);
    if (!isActive) {
      setMode('pomodoro');
      setTime(POMODORO_TIME);
      setIsActive(true);
    }
  };

  return (
    <div className="cottagecore-container">
      {/* Shop, rewards and achievements removed */}

      <header className="cottagecore-header">
        <h1 className="cottagecore-title">
          {currentStudyTopic
            ? `Estudiando: ${currentStudyTopic.name}`
            : 'Área de Estudio'}
        </h1>
        <div className="user-info">
          {/* Sistema de focus points temporalmente oculto */}
          {/* 
          <div className="focus-points">
            <Gem size={20} />
            <span className="points-value">{focusPoints}</span>
          </div>
          */}
        </div>
      </header>

      <div className="main-content-wrapper">
        {/* Área de Estudio - Panel Principal */}
        <div className="study-content-area">
          <StudyArea
            isTimerActive={isActive}
            currentMode={mode}
            onStartStudySession={handleStartStudySession}
          />
        </div>

        {/* Panel de Timer - Más Compacto */}
        <div className="timer-sidebar">
          <div className="timer-panel">
            <div className="mode-selection">
              <button
                className={`mode-btn ${mode === 'pomodoro' ? 'active' : ''}`}
                onClick={() => handleManualModeChange('pomodoro')}
              >
                <Brain size={18} /> Foco
              </button>
              <button
                className={`mode-btn ${mode === 'short-break' ? 'active' : ''}`}
                onClick={() => handleManualModeChange('short-break')}
              >
                <Coffee size={18} /> Corto
              </button>
              <button
                className={`mode-btn ${mode === 'long-break' ? 'active' : ''}`}
                onClick={() => handleManualModeChange('long-break')}
              >
                <Sun size={18} /> Largo
              </button>
            </div>

            <div className="timer-display">
              <span className="timer-countdown">{formatTime(time)}</span>
            </div>

            <div className="timer-controls">
              {isCycleComplete ? (
                <button
                  className="control-btn play-pause"
                  onClick={() => setIsCycleComplete(false)}
                >
                  <Check size={24} /> Siguiente
                </button>
              ) : (
                <button
                  className="control-btn play-pause"
                  onClick={handleStartPause}
                >
                  {isActive ? <Pause size={24} /> : <Play size={24} />}
                  {isActive ? 'Pausar' : 'Empezar'}
                </button>
              )}
              <button className="control-btn reset" onClick={handleReset}>
                <RotateCcw size={24} /> Reiniciar
              </button>
            </div>
          </div>

          {/* Video y Avatar - Sección Compacta */}
          <div className="ambient-section">
            <div className="video-window-compact">
              <video
                ref={videoRef}
                className="study-video"
                src={getVideoSource()}
                autoPlay
                loop
                muted
              />
            </div>

            {/* Avatar removido */}
          </div>
        </div>
      </div>
      {/* In-app toast notification */}
      {toast && (
        <div
          className="pomodoro-toast"
          role="alert"
          aria-live="assertive"
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(32, 129, 226, 0.99)',
            color: 'white',
            padding: '20px 26px',
            borderRadius: 12,
            boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
            zIndex: 2147483647,
            maxWidth: '96%',
            width: 'min(900px, 96%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: 18 }}>
                {toast.title}
              </strong>
              <div style={{ fontSize: 16, marginTop: 8 }}>{toast.message}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: 26,
                cursor: 'pointer',
                lineHeight: 1,
                padding: 6,
              }}
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
