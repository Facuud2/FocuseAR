// --- START OF FILE App.tsx (Updated for Responsiveness) ---
import './App.css';
import { useState } from 'react'; // Importar useState de React
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';
import Auth from './components/Auth';
import Dashboard from './Dashboard';
import Sidebar from './components/Sidebar';
import { Menu, X } from 'lucide-react'; // Importar íconos de menú y cerrar
import PDFSummaryTest from './components/PDFSummaryTest';

function AppRoutes() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para controlar si el sidebar está abierto

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {/* 
              Contenedor principal de la aplicación.
              
              - relative: Es crucial para posicionar el botón de menú y el overlay.
              - bg-gray-100: color de fondo para este contenedor.
              - shadow-xl: una sombra grande para el efecto flotante de toda la aplicación.
              - rounded-2xl: esquinas redondeadas para todo el contenedor de la aplicación.
              - w-full max-w-[1800px]: ocupa el ancho completo hasta un máximo de 1800px.
              - min-h-[calc(100vh-40px)]: altura mínima, dejando un margen vertical.
              - mx-auto my-5: centra el contenedor horizontalmente y le da margen vertical.
              - p-4: padding interno para separar el sidebar y el dashboard de los bordes.
              - overflow-hidden: importante para que el redondeo de las esquinas funcione.
            */}
            <div className="relative flex bg-gray-100 shadow-xl rounded-2xl w-full max-w-[1800px] min-h-[calc(100vh-40px)] mx-auto my-5 p-4 overflow-hidden">
              {/* Overlay para pantallas pequeñas cuando el sidebar está abierto */}
              {isSidebarOpen && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" // z-40 para estar debajo del sidebar pero encima del contenido
                  onClick={toggleSidebar} // Cierra el sidebar al hacer clic en el overlay
                ></div>
              )}

              {/* Botón de hamburguesa para abrir el sidebar en pantallas pequeñas */}
              {/* Solo visible en pantallas pequeñas (lg:hidden) */}
              <button
                className="lg:hidden fixed top-8 left-8 z-50 p-2 bg-sky-500 text-white rounded-full shadow-md"
                onClick={toggleSidebar}
              >
                {isSidebarOpen ? (
                  <Menu className="h-6 w-6" />
                ) : (
                  <X className="h-6 w-6" />
                )}
              </button>

              {/* 
                Sidebar:
                - isSidebarOpen: Le pasamos el estado de si está abierto.
                - onClose: Le pasamos la función para que el Sidebar pueda cerrarse a sí mismo (ej. con un botón de cerrar interno).
              */}
              <Sidebar
                activeSection="overview"
                onSectionChange={() => {}}
                isSidebarOpen={isSidebarOpen}
                onClose={toggleSidebar}
              />

              {/* 
                Área del contenido principal (Dashboard):
                - flex-1: para que ocupe todo el espacio restante horizontalmente.
                - ml-4: un margen izquierdo de 16px para separar el dashboard del sidebar en pantallas grandes.
                - lg:ml-80: En pantallas grandes, el dashboard se desplaza para dejar espacio al sidebar (80 unidades = 320px).
                          Si el sidebar es un overlay en móvil, no necesitamos este `ml` en móvil.
                - overflow-y-auto: permite que el contenido del dashboard tenga scroll vertical si excede su altura.
                - transition-all duration-300 ease-in-out: Para una transición suave si el layout se ajusta.
              */}
              <div
                className={`flex-1 ml-4 overflow-y-auto transition-all duration-300 ease-in-out`}
              >
                <Dashboard />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pdf-summary-test"
        element={
          <ProtectedRoute>
            <PDFSummaryTest />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
// --- END OF FILE App.tsx ---
