// src/components/PomodoroTimer.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import './PomodoroTimer.css';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Sun,
  Brain,
  ShoppingCart,
  Gem,
  Check,
  X,
  Plus,
  Award,
  Gift,
} from 'lucide-react';
import Store from './Store';
import StudyArea from './StudyArea';
import { useDatabase } from '../hooks/useDatabase';

// Define the interfaces for store items, achievements, and rewards
interface StoreItem {
  id: string;
  name: string;
  price: number;
  type: 'garden' | 'avatar';
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: number; // e.g., number of cycles
  icon: string;
  unlocked: boolean;
}

interface CustomReward {
  id: string;
  name: string;
  cost: number;
}

// Timer constants
const POMODORO_TIME = 1 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

const videoUrls = {
  pomodoro: '/estudiar.mp4',
  shortBreak: '/descansar.mp4',
  longBreak: '/dormir.mp4',
};

const initialAchievements: Achievement[] = [
  {
    id: 'ach_01',
    name: 'Primer Foco',
    description: 'Completa 1 ciclo Pomodoro.',
    condition: 1,
    icon: '🏆',
    unlocked: false,
  },
  {
    id: 'ach_02',
    name: '5 al hilo',
    description: 'Completa 5 ciclos seguidos.',
    condition: 5,
    icon: '🏅',
    unlocked: false,
  },
  {
    id: 'ach_03',
    name: 'Foco Profesional',
    description: 'Completa 25 ciclos.',
    condition: 25,
    icon: '🌟',
    unlocked: false,
  },
  {
    id: 'ach_04',
    name: 'El coleccionista',
    description: 'Compra 3 artículos en la tienda.',
    condition: 3,
    icon: '✨',
    unlocked: false,
  },
];

const PomodoroTimer = () => {
  const [mode, setMode] = useState<'pomodoro' | 'short-break' | 'long-break'>(
    'pomodoro',
  );
  const [time, setTime] = useState(POMODORO_TIME);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [consecutiveCycles, setConsecutiveCycles] = useState(0); // New state for tracking consecutive cycles
  const [isCycleComplete, setIsCycleComplete] = useState(false);
  const [focusPoints, setFocusPoints] = useState(0);
  const [gardenItems, setGardenItems] = useState<string[]>([]);
  const [avatarItems, setAvatarItems] = useState<string[]>([]);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [customRewards, setCustomRewards] = useState<CustomReward[]>([]);
  const [achievements, setAchievements] =
    useState<Achievement[]>(initialAchievements);
  const [currentStudyTopic, setCurrentStudyTopic] = useState<{
    id: string;
    name: string;
    estimatedTime: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  const { savePomodoroCycle } = useDatabase();

  // Load state from local storage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('pomodoroState');
    if (savedState) {
      const state = JSON.parse(savedState);
      setFocusPoints(state.focusPoints);
      setGardenItems(state.gardenItems);
      setAvatarItems(state.avatarItems);
      setCustomRewards(state.customRewards);
      setAchievements(state.achievements);
    }
    if (!notificationSound.current) {
      notificationSound.current = new Audio('/audio/notification_sound.mp3');
    }
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    const state = {
      focusPoints,
      gardenItems,
      avatarItems,
      customRewards,
      achievements,
    };
    localStorage.setItem('pomodoroState', JSON.stringify(state));
  }, [focusPoints, gardenItems, avatarItems, customRewards, achievements]);

  const checkAchievements = useCallback(() => {
    setAchievements((prev) =>
      prev.map((ach) => {
        if (!ach.unlocked) {
          if (ach.id === 'ach_01' && cycles >= ach.condition) {
            alert(`¡Logro desbloqueado: ${ach.name}!`);
            return { ...ach, unlocked: true };
          }
          if (ach.id === 'ach_02' && consecutiveCycles >= ach.condition) {
            alert(`¡Logro desbloqueado: ${ach.name}!`);
            return { ...ach, unlocked: true };
          }
          if (ach.id === 'ach_03' && cycles >= ach.condition) {
            alert(`¡Logro desbloqueado: ${ach.name}!`);
            return { ...ach, unlocked: true };
          }
          if (
            ach.id === 'ach_04' &&
            gardenItems.length + avatarItems.length >= ach.condition
          ) {
            alert(`¡Logro desbloqueado: ${ach.name}!`);
            return { ...ach, unlocked: true };
          }
        }
        return ach;
      }),
    );
  }, [cycles, consecutiveCycles, gardenItems, avatarItems]);

  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  const handleModeChange = useCallback(() => {
    setIsActive(false);
    setIsCycleComplete(true);
    notificationSound.current?.play();

    if (mode === 'pomodoro') {
      const pointsEarned = 25 + consecutiveCycles * 10; // Bonus points for consecutive cycles
      setFocusPoints((prev) => prev + pointsEarned);
      setConsecutiveCycles((prev) => prev + 1); // Increment consecutive cycles
      setCycles((prev) => prev + 1); // Increment total cycles
      // Registrar ciclo en la base de datos
      // Guardar ciclo en la base de datos y emitir evento para que otras vistas (ej. Profile) puedan refrescarse
      if (savePomodoroCycle) {
        savePomodoroCycle(true, 'pomodoro')
          .then((id) => {
            try {
              window.dispatchEvent(
                new CustomEvent('pomodoro:recorded', { detail: { id } }),
              );
            } catch (err) {
              // En entornos donde CustomEvent no esté disponible, ignorar
              console.debug('No se pudo emitir evento pomodoro:recorded', err);
            }
          })
          .catch((e) => console.warn('No se pudo guardar ciclo Pomodoro:', e));
      }
    } else {
      setConsecutiveCycles(0); // Reset consecutive cycles on break
    }
  }, [mode, consecutiveCycles, savePomodoroCycle]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
      if (videoRef.current) videoRef.current.play();
    } else {
      if (interval) clearInterval(interval);
      if (videoRef.current) videoRef.current.pause();
      if (time === 0 && isActive) handleModeChange();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time, handleModeChange]);

  const startNextCycle = () => {
    setIsCycleComplete(false);
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
    setIsActive(true);
  };

  const handleStartPause = () => setIsActive(!isActive);

  const handleReset = () => {
    setIsActive(false);
    setIsCycleComplete(false);
    setCycles(0);
    setConsecutiveCycles(0); // Reset consecutive cycles on manual reset
    setMode('pomodoro');
    setTime(POMODORO_TIME);
  };

  const handleManualModeChange = (
    newMode: 'pomodoro' | 'short-break' | 'long-break',
  ) => {
    setIsActive(false);
    setIsCycleComplete(false);
    setConsecutiveCycles(0); // Reset consecutive cycles on manual mode change
    setMode(newMode);
    if (newMode === 'pomodoro') setTime(POMODORO_TIME);
    else if (newMode === 'short-break') setTime(SHORT_BREAK);
    else setTime(LONG_BREAK);
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

  const getItemImagePath = (itemId: string) => {
    if (itemId === 'hat_01') {
      return '/vip.png';
    }
    return `/assets/items/${itemId}.png`;
  };

  const handlePurchase = (item: StoreItem) => {
    if (focusPoints >= item.price) {
      setFocusPoints((prev) => prev - item.price);
      if (item.type === 'garden') {
        setGardenItems((prev) => [...prev, item.id]);
      } else if (item.type === 'avatar') {
        setAvatarItems((prev) => [...prev, item.id]);
      }
      alert(`¡Has comprado ${item.name}!`);
      checkAchievements(); // Re-check achievements after a purchase
    } else {
      alert('Puntos de foco insuficientes.');
    }
  };

  const addTestPoints = () => {
    setFocusPoints((prev) => prev + 100);
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

  // Custom Rewards Logic
  const addReward = (name: string, cost: number) => {
    setCustomRewards((prev) => [
      ...prev,
      { id: `reward_${Date.now()}`, name, cost },
    ]);
  };

  const redeemReward = (rewardId: string) => {
    const reward = customRewards.find((r) => r.id === rewardId);
    if (reward && focusPoints >= reward.cost) {
      setFocusPoints((prev) => prev - reward.cost);
      alert(`¡Recompensa "${reward.name}" canjeada!`);
    } else if (reward) {
      alert('Puntos de foco insuficientes para esta recompensa.');
    }
  };

  const renderRewardsModal = () => (
    <div className="store-overlay">
      <div className="store-modal">
        <button className="close-btn" onClick={() => setIsRewardsOpen(false)}>
          <X size={24} />
        </button>
        <h2 className="store-title">Recompensas Personalizadas</h2>
        <p className="user-points">Tus Puntos de Foco: **{focusPoints}**</p>
        <div className="custom-rewards-list">
          <h3>Mis Recompensas</h3>
          {customRewards.length === 0 ? (
            <p>Aún no has añadido recompensas.</p>
          ) : (
            customRewards.map((reward) => (
              <div key={reward.id} className="reward-card">
                <span>
                  {reward.name} - {reward.cost} PF
                </span>
                <button
                  onClick={() => redeemReward(reward.id)}
                  disabled={focusPoints < reward.cost}
                >
                  Canjear
                </button>
              </div>
            ))
          )}
        </div>
        <div className="add-reward-form">
          <h3>Añadir Nueva Recompensa</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const rewardName = (
                form.elements.namedItem('rewardName') as HTMLInputElement
              ).value;
              const rewardCost = parseInt(
                (form.elements.namedItem('rewardCost') as HTMLInputElement)
                  .value,
              );
              if (rewardName && !isNaN(rewardCost)) {
                addReward(rewardName, rewardCost);
                form.reset();
              }
            }}
          >
            <input
              type="text"
              name="rewardName"
              placeholder="Nombre de la recompensa"
              required
            />
            <input
              type="number"
              name="rewardCost"
              placeholder="Costo en PF"
              required
              min="1"
            />
            <button type="submit">Añadir</button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderAchievementsModal = () => (
    <div className="store-overlay">
      <div className="store-modal">
        <button
          className="close-btn"
          onClick={() => setIsAchievementsOpen(false)}
        >
          <X size={24} />
        </button>
        <h2 className="store-title">Logros y Medallas</h2>
        <div className="achievements-list">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
            >
              <span className="achievement-icon">{ach.icon}</span>
              <div className="achievement-info">
                <span className="achievement-name">{ach.name}</span>
                <span className="achievement-desc">{ach.description}</span>
              </div>
              {ach.unlocked ? (
                <span className="achievement-status">Desbloqueado</span>
              ) : (
                <span className="achievement-status">
                  Progreso:{' '}
                  {ach.id === 'ach_02'
                    ? `${consecutiveCycles}/${ach.condition}`
                    : `${cycles}/${ach.condition}`}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="cottagecore-container">
      {isStoreOpen && (
        <Store
          onClose={() => setIsStoreOpen(false)}
          onPurchase={handlePurchase}
          userPoints={focusPoints}
          avatarItems={avatarItems}
          gardenItems={gardenItems}
        />
      )}
      {isRewardsOpen && renderRewardsModal()}
      {isAchievementsOpen && renderAchievementsModal()}

      <header className="cottagecore-header">
        <h1 className="cottagecore-title">
          {currentStudyTopic
            ? `Estudiando: ${currentStudyTopic.name}`
            : 'Área de Estudio'}
        </h1>
        <div className="user-info">
          <button className="store-btn" onClick={() => setIsRewardsOpen(true)}>
            <Gift size={20} /> Recompensas
          </button>
          <button
            className="store-btn"
            onClick={() => setIsAchievementsOpen(true)}
          >
            <Award size={20} /> Logros
          </button>
          <div className="focus-points">
            <Gem size={20} />
            <span className="points-value">{focusPoints}</span>
            <button className="add-points-btn" onClick={addTestPoints}>
              <Plus size={16} />
            </button>
          </div>
          <button className="store-btn" onClick={() => setIsStoreOpen(true)}>
            <ShoppingCart size={20} /> Tienda
          </button>
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
                  onClick={startNextCycle}
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

            <div className="cycle-info">
              <div>
                Ciclos: <strong>{cycles}</strong>
              </div>
              <div>
                Racha: <strong>{consecutiveCycles}</strong>
              </div>
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

            <div className="avatar-section-compact">
              <img
                src={'/public/base1.png'}
                alt="Avatar"
                className="avatar-image"
              />
              {avatarItems.map((item, index) => (
                <img
                  key={index}
                  src={getItemImagePath(item)}
                  alt="Avatar Item"
                  className="avatar-item"
                />
              ))}
              <div className="garden-items-compact">
                {gardenItems.slice(0, 3).map((item, index) => (
                  <img
                    key={index}
                    src={`/assets/items/${item}.png`}
                    alt="Garden Item"
                    className="garden-item-small"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
