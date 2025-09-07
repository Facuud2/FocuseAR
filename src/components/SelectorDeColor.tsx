import React, { useState } from 'react';
import { ChromePicker } from 'react-color';
import type { ColorResult } from 'react-color';

interface SelectorDeColorProps {
  color: string;
  onChange: (color: string) => void;
}

const SelectorDeColor: React.FC<SelectorDeColorProps> = ({
  color,
  onChange,
}) => {
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleChange = (colorResult: ColorResult) => {
    onChange(colorResult.hex);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Botón que muestra el color y abre el picker */}
      <div
        onClick={() => setPickerVisible(!pickerVisible)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '4px',
          backgroundColor: color,
          border: '1px solid #ccc',
          cursor: 'pointer',
        }}
      />

      {/* Picker */}
      {pickerVisible && (
        <div style={{ position: 'absolute', zIndex: 2, top: '40px' }}>
          <div
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }}
            onClick={() => setPickerVisible(false)}
          />
          <ChromePicker color={color} onChange={handleChange} />
        </div>
      )}
    </div>
  );
};

export default SelectorDeColor;
