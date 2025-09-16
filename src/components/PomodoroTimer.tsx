// src/components/PomodoroTimer.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import './../styles/PomodoroTimer.css';
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
} from 'lucide-react';

// Define a type for store items to avoid 'any'
interface StoreItem {
  id: string;
  name: string;
  price: number;
  type: 'garden' | 'avatar';
}

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

const videoUrls = {
  // Correct paths for videos in the public folder
  pomodoro: '/videos/estudiar.mp4',
  shortBreak: '/videos/descansar.mp4',
  longBreak: '/videos/dormir.mp4',
};

// Use the new StoreItem interface
const storeItems: StoreItem[] = [
  { id: 'plant_01', name: 'Planta Creciente', price: 50, type: 'garden' },
  { id: 'hat_01', name: 'Sombrero de Brujo', price: 75, type: 'avatar' },
  { id: 'plant_02', name: 'Flor Exótica', price: 60, type: 'garden' },
  { id: 'glasses_01', name: 'Lentes de Sol', price: 40, type: 'avatar' },
];

const PomodoroTimer = () => {
  const [mode, setMode] = useState<'pomodoro' | 'short-break' | 'long-break'>(
    'pomodoro',
  );
  const [time, setTime] = useState(POMODORO_TIME);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [isCycleComplete, setIsCycleComplete] = useState(false);
  const [focusPoints, setFocusPoints] = useState(0);
  const [gardenItems, setGardenItems] = useState<string[]>([]);
  const [avatarItems, setAvatarItems] = useState<string[]>([]);
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!notificationSound.current) {
      notificationSound.current = new Audio('/audio/notification_sound.mp3');
    }
  }, []);

  const handleModeChange = useCallback(() => {
    setIsActive(false);
    setIsCycleComplete(true);
    notificationSound.current?.play();

    if (mode === 'pomodoro') {
      const pointsEarned = 25;
      setFocusPoints((prev) => prev + pointsEarned);
    }
  }, [mode]);

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
    setMode('pomodoro');
    setTime(POMODORO_TIME);
  };

  const handleManualModeChange = (
    newMode: 'pomodoro' | 'short-break' | 'long-break',
  ) => {
    setIsActive(false);
    setIsCycleComplete(false);
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
    // Conditional logic to handle the specific 'hat_01' image
    if (itemId === 'hat_01') {
      return '/vip.png';
    }
    return `/assets/items/${itemId}.png`;
  };

  // The 'item' parameter is now strictly typed
  const handlePurchase = (item: StoreItem) => {
    if (focusPoints >= item.price) {
      setFocusPoints((prev) => prev - item.price);
      if (item.type === 'garden') {
        setGardenItems((prev) => [...prev, item.id]);
      } else if (item.type === 'avatar') {
        setAvatarItems((prev) => [...prev, item.id]);
      }
      alert(`¡Has comprado ${item.name}!`);
    } else {
      alert('Puntos de foco insuficientes.');
    }
  };

  const addTestPoints = () => {
    setFocusPoints((prev) => prev + 100);
  };

  const isItemPurchased = (item: StoreItem) => {
    if (item.type === 'avatar') {
      return avatarItems.includes(item.id);
    }
    if (item.type === 'garden') {
      return gardenItems.includes(item.id);
    }
    return false;
  };

  return (
    <div className="cottagecore-container">
      {isStoreOpen && (
        <div className="store-overlay">
          <div className="store-modal">
            <button className="close-btn" onClick={() => setIsStoreOpen(false)}>
              <X size={24} />
            </button>
            <h2 className="store-title">Tienda del Jardín</h2>
            <p className="user-points">Tus Puntos de Foco: **{focusPoints}**</p>

            <div className="items-list">
              {storeItems.map((item) => (
                <div key={item.id} className="item-card">
                  <img
                    src={getItemImagePath(item.id)}
                    alt={item.name}
                    className="item-image"
                  />
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">{item.price} PF</span>
                  </div>
                  <button
                    className="buy-btn"
                    onClick={() => handlePurchase(item)}
                    disabled={focusPoints < item.price || isItemPurchased(item)}
                  >
                    {isItemPurchased(item) ? 'Comprado' : 'Comprar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="cottagecore-header">
        <h1 className="cottagecore-title">Pomodoro</h1>
        <div className="user-info">
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
        <div className="study-area-left">
          <div className="video-window">
            <video
              ref={videoRef}
              className="study-video"
              src={getVideoSource()}
              autoPlay
              loop
              muted
            />
          </div>
          <div className="avatar-section">
            {/* Correct path for the base avatar */}
            <img
              src={'/avatars/base1.png'}
              alt="Avatar"
              className="avatar-image"
            />
            {avatarItems.map((item, index) => (
              <img
                key={index}
                src={`/assets/items/${item}.png`}
                alt="Avatar Item"
                className="avatar-item"
              />
            ))}
          </div>
          <div className="garden-area">
            {gardenItems.map((item, index) => (
              <img
                key={index}
                src={`/assets/items/${item}.png`}
                alt="Garden Item"
                className="garden-item"
              />
            ))}
          </div>
        </div>

        <div className="study-area-right">
          <div className="timer-panel">
            <div className="mode-selection">
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

            <div className="timer-display">
              <span className="timer-countdown">{formatTime(time)}</span>
            </div>

            <div className="timer-controls">
              {isCycleComplete ? (
                <button
                  className="control-btn play-pause"
                  onClick={startNextCycle}
                >
                  <Check size={28} /> Siguiente
                </button>
              ) : (
                <button
                  className="control-btn play-pause"
                  onClick={handleStartPause}
                >
                  {isActive ? <Pause size={28} /> : <Play size={28} />}
                  {isActive ? 'Pausar' : 'Empezar'}
                </button>
              )}
              <button className="control-btn reset" onClick={handleReset}>
                <RotateCcw size={28} /> Reiniciar
              </button>
            </div>

            <div className="cycle-info">Ciclos completados: **{cycles}**</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
