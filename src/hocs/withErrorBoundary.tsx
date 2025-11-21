import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';

/**
 * Higher Order Component que envuelve un componente con ErrorBoundary
 * @param Component - Componente a envolver
 * @param FallbackComponent - Componente a mostrar en caso de error
 * @param errorCallback - Función a ejecutar cuando ocurra un error
 * @returns Componente envuelto en ErrorBoundary
 */
const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType,
  errorCallback?: (error: Error, errorInfo: React.ErrorInfo) => void,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary
      fallback={FallbackComponent ? <FallbackComponent /> : undefined}
      onError={errorCallback}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  // Asignamos un nombre al componente para mejor depuración
  const componentName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withErrorBoundary(${componentName})`;

  return WrappedComponent;
};

export default withErrorBoundary;
