// src/components/Store.tsx

import React from 'react';
import './Store.css';
import { X } from 'lucide-react';

// Define an interface for the store item to prevent 'any' type warnings
interface StoreItem {
  id: string;
  name: string;
  price: number;
  type: 'garden' | 'avatar';
}

const storeItems: StoreItem[] = [
  { id: 'plant_01', name: 'Planta Creciente', price: 50, type: 'garden' },
  { id: 'hat_01', name: 'Sombrero de Brujo', price: 75, type: 'avatar' },
  { id: 'plant_02', name: 'Flor Exótica', price: 60, type: 'garden' },
  { id: 'glasses_01', name: 'Lentes de Sol', price: 40, type: 'avatar' },
];

// The StoreProps interface now has explicit types for the arrays
interface StoreProps {
  onClose: () => void;
  onPurchase: (item: StoreItem) => void;
  userPoints: number;
  avatarItems: string[];
  gardenItems: string[];
}

const Store: React.FC<StoreProps> = ({
  onClose,
  onPurchase,
  userPoints,
  avatarItems,
  gardenItems,
}) => {
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
    <div className="store-overlay">
      <div className="store-modal">
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>
        <h2 className="store-title">Tienda del Jardín</h2>
        <p className="user-points">Tus Puntos de Foco: **{userPoints}**</p>

        <div className="items-list">
          {storeItems.map((item: StoreItem) => (
            <div key={item.id} className="item-card">
              <img
                src={`/assets/items/${item.id}.png`}
                alt={item.name}
                className="item-image"
              />
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-price">{item.price} PF</span>
              </div>
              <button
                className="buy-btn"
                onClick={() => onPurchase(item)}
                disabled={userPoints < item.price || isItemPurchased(item)}
              >
                {isItemPurchased(item) ? 'Comprado' : 'Comprar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Store;
