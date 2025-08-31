import React, { useState } from 'react';

const DatabaseTester: React.FC = () => {
  const [testMessage, setTestMessage] = useState('');

  const handleTest = () => {
    console.log('🧪 Botón de prueba clickeado!');
    setTestMessage('¡Componente funcionando! - ' + new Date().toLocaleTimeString());
  };

  console.log('🧪 Componente DatabaseTester renderizado');

  return (
    <div style={{ 
      border: '3px solid #FF0000', 
      borderRadius: '10px', 
      padding: '30px', 
      margin: '30px 0',
      backgroundColor: '#FFFF00',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        color: '#FF0000', 
        fontSize: '28px', 
        fontWeight: 'bold', 
        marginBottom: '20px'
      }}>
        🧪 COMPONENTE DE PRUEBA - FIRESTORE
      </h1>
      
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        Si puedes ver esto, el componente se está renderizando correctamente
      </p>

      <button
        onClick={handleTest}
        style={{
          backgroundColor: '#FF0000',
          color: 'white',
          padding: '15px 30px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}
      >
        🚀 HACER PRUEBA SIMPLE
      </button>

      {testMessage && (
        <div style={{ 
          backgroundColor: '#00FF00', 
          padding: '15px', 
          borderRadius: '8px',
          border: '2px solid #008000'
        }}>
          <p style={{ color: '#008000', fontWeight: 'bold' }}>{testMessage}</p>
        </div>
      )}

      <div style={{ 
        backgroundColor: '#0000FF', 
        color: 'white', 
        padding: '15px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>📋 Instrucciones de Debug:</h3>
        <ol style={{ textAlign: 'left', display: 'inline-block' }}>
          <li>Presiona F12 para abrir la consola</li>
          <li>Haz clic en el botón rojo de arriba</li>
          <li>Deberías ver mensajes en la consola</li>
          <li>Si no ves nada, hay un problema de renderizado</li>
        </ol>
      </div>
    </div>
  );
};

export default DatabaseTester;
