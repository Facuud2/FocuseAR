import React from 'react';
import { logErrorToFirestore } from '../utils/errorHandler';
import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from './ErrorBoundary.types';

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to our service
    logErrorToFirestore({
      type: 'react-error',
      message: error.message,
      stack: error.stack,
      file: window.location.href,
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Call the onError handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div style={{ padding: '20px', color: 'red' }}>
            <h2>Algo salió mal.</h2>
            <p>El error ha sido reportado al equipo de desarrollo.</p>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ whiteSpace: 'pre-wrap' }}>
                {this.state.error?.toString()}
                <br />
                {this.state.error?.stack}
              </details>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Exportamos el componente ErrorBoundary por defecto
export default ErrorBoundary;
