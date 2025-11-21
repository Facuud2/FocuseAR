import React from 'react';
import { logErrorToFirestore } from '../utils/errorHandler';

const ErrorTest: React.FC = () => {
  // 1. Error de JavaScript estándar
  const triggerJsError = () => {
    // Forzamos un error de tipo
    interface ObjWithMethod {
      metodoQueNoExiste: () => void;
    }

    const obj: ObjWithMethod | null = null;
    // @ts-expect-error - Forzando error de tipo
    obj.metodoQueNoExiste();
  };

  // 2. Error de promesa no manejada
  const triggerUnhandledPromise = async () => {
    const promesaFallida = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Esta es una promesa fallida de prueba'));
      }, 1000);
    });

    // No manejamos el error con .catch()
    promesaFallida.then(() => {
      console.log('Esto no debería ejecutarse');
    });
  };

  // 3. Error personalizado con mensaje
  const triggerCustomError = () => {
    try {
      throw new Error('Este es un error personalizado de prueba');
    } catch (error) {
      console.error('Error capturado pero re-lanzado:', error);
      // También podemos registrar manualmente el error
      logErrorToFirestore({
        type: 'console-error',
        message: 'Error personalizado: ' + (error as Error).message,
        file: window.location.href,
        userAgent: navigator.userAgent,
        url: window.location.href,
        stack: (error as Error).stack,
      });
    }
  };

  // 4. Error en un componente hijo
  const ComponenteConError = () => {
    // Forzamos un error de tipo
    interface ObjetoConPropiedad {
      propiedad: string;
    }

    const objetoInexistente: ObjetoConPropiedad | undefined = undefined;
    // @ts-expect-error - Forzando error de tipo
    return <div>{objetoInexistente.propiedad}</div>;
  };

  return (
    <div
      className="error-test"
      style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}
    >
      <h2>Prueba de Manejo de Errores</h2>
      <p>
        Esta es una página de prueba para verificar que el sistema de manejo de
        errores está funcionando correctamente.
      </p>

      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <button onClick={triggerJsError} style={buttonStyle}>
          Probar Error de JavaScript
        </button>

        <button onClick={triggerUnhandledPromise} style={buttonStyle}>
          Probar Promesa No Manejada
        </button>

        <button onClick={triggerCustomError} style={buttonStyle}>
          Probar Error Personalizado
        </button>

        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            border: '1px solid #ff9800',
            borderRadius: '4px',
            backgroundColor: '#fff3e0',
          }}
        >
          <h3>Zona de Error en Componente</h3>
          <p>El siguiente botón renderizará un componente con un error:</p>
          <button
            onClick={() => {
              try {
                // Renderizamos el componente con error
                return <ComponenteConError />;
              } catch (error) {
                console.error('Error al renderizar componente:', error);
              }
            }}
            style={{ ...buttonStyle, backgroundColor: '#ff9800' }}
          >
            Renderizar Componente con Error
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <h3>Instrucciones:</h3>
        <ol>
          <li>Abre la consola del navegador (F12)</li>
          <li>Haz clic en cualquiera de los botones de arriba</li>
          <li>Verifica que los errores aparezcan en la consola</li>
          <li>
            Revisa la colección <code>logs_errors</code> en Firestore para ver
            los errores registrados
          </li>
        </ol>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 15px',
  backgroundColor: '#4285f4',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background-color 0.3s',
};

export default ErrorTest;
