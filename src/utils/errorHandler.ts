import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Tipos de errores
type ErrorType =
  | 'console-error'
  | 'react-error'
  | 'unhandled-rejection'
  | 'global-error';

// Interfaz para el objeto de error
export interface ErrorLog {
  type: ErrorType;
  message: string;
  file?: string | null;
  line?: number;
  column?: number;
  stack?: string;
  timestamp: unknown; // Usaremos serverTimestamp() de Firestore
  userAgent: string;
  userId?: string;
  url: string;
}

// Función para enviar el error a Firestore
export const logErrorToFirestore = async (
  errorData: Omit<ErrorLog, 'timestamp'>,
) => {
  try {
    await addDoc(collection(db, 'logs_errors'), {
      ...errorData,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error al guardar el log en Firestore:', error);
  }
};

// Intercepta console.error
const originalConsoleError = console.error;
console.error = function errorHandler(
  message: unknown,
  ...optionalParams: unknown[]
): void {
  const errorData: Omit<ErrorLog, 'timestamp'> = {
    type: 'console-error',
    message: typeof message === 'string' ? message : JSON.stringify(message),
    file: window.location.href || 'unknown',
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Intentar obtener el stack trace
  try {
    const error = new Error();
    errorData.stack = error.stack || 'No stack trace available';
  } catch (error: unknown) {
    console.debug('No se pudo obtener el stack trace', error);
  }

  logErrorToFirestore(errorData);
  originalConsoleError.apply(console, [message, ...optionalParams]);
};

// Intercepta console.warn (opcional)
const originalConsoleWarn = console.warn;
console.warn = function warnHandler(
  message: unknown,
  ...optionalParams: unknown[]
): void {
  const errorData: Omit<ErrorLog, 'timestamp'> = {
    type: 'console-error',
    message: `[WARN] ${typeof message === 'string' ? message : JSON.stringify(message)}`,
    file: window.location.href || 'unknown',
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  logErrorToFirestore(errorData);
  originalConsoleWarn.apply(console, [message, ...optionalParams]);
};

// Maneja errores globales
const handleGlobalError = (
  message: string | Event,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error,
): boolean => {
  const errorMessage =
    typeof message === 'string' ? message : 'Error global no manejado';
  const stack = error?.stack || new Error().stack;

  logErrorToFirestore({
    type: 'global-error',
    message: errorMessage,
    file: source || window.location.href || 'unknown',
    line: lineno,
    column: colno,
    stack: stack,
    userAgent: navigator.userAgent,
    url: window.location.href,
  });

  // Permite que otros manejadores de errores también lo procesen
  return false;
};

// Maneja promesas no manejadas
const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
  const error = event.reason;

  logErrorToFirestore({
    type: 'unhandled-rejection',
    message: error?.message || 'Unhandled promise rejection',
    file: window.location.href || 'unknown',
    stack: error?.stack || new Error().stack || 'No stack trace available',
    userAgent:
      typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: window.location.href,
  });
};

// Configura los manejadores de errores
export const setupErrorHandlers = (): void => {
  // Errores síncronos
  window.onerror = handleGlobalError;

  // Errores de promesas no manejadas
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  // Errores de React (usando el Error Boundary)
  if (typeof window !== 'undefined' && 'React' in window) {
    interface ReactErrorInfo {
      componentStack?: string;
    }

    interface ErrorWithMessageAndStack extends Error {
      message: string;
      stack?: string;
    }

    const win = window as unknown as {
      console: {
        error: (error: unknown, errorInfo?: ReactErrorInfo) => void;
      };
    };

    const originalErrorHandler = win.console.error;
    win.console.error = function (
      error: unknown,
      errorInfo?: ReactErrorInfo,
    ): void {
      if (error) {
        const errorObj = error as ErrorWithMessageAndStack;
        const errorData: Omit<ErrorLog, 'timestamp'> = {
          type: 'react-error',
          message: errorObj?.message || 'React error',
          stack: errorObj?.stack || errorInfo?.componentStack || '',
          file: window.location.href || 'unknown',
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: window.location.href,
        };

        logErrorToFirestore(errorData);
      }

      if (originalErrorHandler) {
        originalErrorHandler.apply(console, [error, errorInfo]);
      }
    };
  }
};

// Limpia los manejadores de errores (útil para pruebas)
export const cleanupErrorHandlers = () => {
  window.onerror = null;
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
};
