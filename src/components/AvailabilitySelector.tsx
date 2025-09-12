// src/components/AvailabilitySelector.tsx
import { useState } from 'react';
import './AccountSettings.css'; // Usamos el mismo CSS

const initialAvailability: { [key: string]: boolean } = {
  monday: false,
  tuesday: true,
  wednesday: false,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
};

const AvailabilitySelector = () => {
  const [availability, setAvailability] = useState(initialAvailability);

  const handleAvailabilityChange = (day: string) => {
    setAvailability((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Días de Estudio Disponibles</h3>
      <p className="settings-section-subtitle">
        Selecciona los días en los que la IA puede programar sesiones de estudio
        para ti.
      </p>
      <div className="availability-grid">
        {Object.keys(availability).map((day) => (
          <button
            key={day}
            className={`day-button ${availability[day] ? 'active' : ''}`}
            onClick={() => handleAvailabilityChange(day)}
          >
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AvailabilitySelector;
