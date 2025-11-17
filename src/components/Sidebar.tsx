// src/components/Sidebar.tsx
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import CompleteChat from './CompleteChat';

import './Sidebar.css';
import {
  Home,
  BookOpen,
  FileText,
  Timer,
  Brain,
  User,
  TrendingUp,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Menu,
  Bot, // icono del bot
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Sidebar({
  activeSection,
  onSectionChange,
  isDarkMode,
  onToggleDarkMode,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 👇 Este useEffect conecta el estado con clases en <body>
  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('with-sidebar-collapsed');
      document.body.classList.remove('with-sidebar-open');
    } else {
      document.body.classList.add('with-sidebar-open');
      document.body.classList.remove('with-sidebar-collapsed');
    }
  }, [isCollapsed]);

  // Toggle to show/hide Analytics section easily during development
  const SHOW_ANALYTICS = false;

  const menuSections = [
    {
      title: 'Panel Principal',
      items: [
        { id: 'overview', label: 'Inicio', icon: Home, path: '/dashboard' },
      ],
    },
    {
      title: 'Gestión de Estudio',
      items: [
        {
          id: 'subjects',
          label: 'Materias',
          icon: BookOpen,
          path: '/subjects',
        },
        {
          id: 'documents',
          label: 'Documentos',
          icon: FileText,
          path: '/documents',
        },
        {
          id: 'pomodoro',
          label: 'Temporizador Pomodoro',
          icon: Timer,
          path: '/pomodoro',
        },
        {
          id: 'ai-planner',
          label: 'AI Planner',
          icon: Brain,
          path: '/ai-planner',
        },
        { id: 'quizzes', label: 'Quizzes', icon: HelpCircle, path: '/quizzes' },
        { id: 'profile', label: 'Perfil', icon: User, path: '/profile' },
      ],
    },
    // La ocultamos si SHOW_ANALYTICS es falso
    ...(SHOW_ANALYTICS
      ? [
          {
            title: 'Analytics',
            items: [
              {
                id: 'progress',
                label: 'Progress',
                icon: TrendingUp,
                path: '/progress',
              },
              {
                id: 'analytics',
                label: 'Analytics',
                icon: BarChart3,
                path: '/analytics',
              },
            ],
          },
        ]
      : []),
    {
      title: 'Configuración',
      items: [
        {
          id: 'settings',
          label: 'Configuración de Cuenta',
          icon: Settings,
          path: '/settings',
        },
      ],
    },
  ];

  return (
    <>
      <button
        className="sidebar-hamburger-btn"
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-label={isCollapsed ? 'Abrir menú' : 'Cerrar menú'}
      >
        <Menu size={28} />
      </button>

      <aside
        className={`sidebar-container${isCollapsed ? ' collapsed' : ''}`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="sidebar-logo-section">
          <div className="sidebar-logo-icon">
            <BookOpen />
          </div>
          {!isCollapsed && <h1 className="sidebar-logo-text">FocuseAr</h1>}
          {!isCollapsed && (
            <p className="sidebar-logo-subtext">
              Tú Planificación de Estudios con IA
            </p>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              {!isCollapsed && (
                <h3 className="sidebar-section-title">{section.title}</h3>
              )}
              <div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.path;
                  return (
                    <button
                      key={item.id}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => onSectionChange(item.path)}
                    >
                      <Icon className="sidebar-nav-icon" />
                      {!isCollapsed && (
                        <span className="sidebar-nav-label">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Botón de modo oscuro */}
        {!isCollapsed && (
          <div className="dark-mode-toggle-section">
            <button
              className="dark-mode-btn"
              onClick={onToggleDarkMode}
              aria-label={
                isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
              }
            >
              <div
                className={`dark-mode-icon-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
              >
                {isDarkMode ? (
                  <Sun className="dark-mode-icon" size={22} />
                ) : (
                  <Moon className="dark-mode-icon" size={22} />
                )}
              </div>
            </button>
          </div>
        )}

        {/* Sección de ayuda con el botón para abrir el chat */}
        {!isCollapsed ? (
          <div className="sidebar-help-section">
            <div className="sidebar-help-content">
              <div className="sidebar-help-header">
                <div className="sidebar-help-icon">
                  <Bot />
                </div>
                <p className="sidebar-help-title">Chat AI</p>
              </div>
              <p className="sidebar-help-text">Obtén ayuda con tus estudios</p>
              <button
                className="sidebar-chat-button"
                onClick={() => setIsChatOpen(true)}
              >
                <Bot size={16} />
                Abrir Chat
              </button>
            </div>
          </div>
        ) : (
          <button
            className="collapsed-chat-button"
            onClick={() => setIsChatOpen(true)}
            aria-label="Chat with AI Assistant"
          >
            <Bot size={28} />
          </button>
        )}
      </aside>

      {isChatOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            borderRadius: 16,
            background: 'white',
            maxWidth: 400,
            width: '90vw',
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <CompleteChat height="400px" onClose={() => setIsChatOpen(false)} />
        </div>
      )}

      <Outlet />
    </>
  );
}
