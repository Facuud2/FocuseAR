// src/components/Sidebar.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CompleteChat from './CompleteChat';

import './Sidebar.css';
import {
  Home,
  Clock,
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
  Bot,
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
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const isMobile = window.innerWidth <= 900;

  const menuSections = [
    {
      title: 'Dashboard',
      items: [
        { id: 'overview', label: 'Overview', icon: Home, path: '/dashboard' },
        {
          id: 'schedule',
          label: 'Study Schedule',
          icon: Clock,
          path: '/study-schedule',
        },
      ],
    },
    {
      title: 'Study Management',
      items: [
        {
          id: 'subjects',
          label: 'Subjects',
          icon: BookOpen,
          path: '/subjects',
        },
        {
          id: 'documents',
          label: 'Documents',
          icon: FileText,
          path: '/documents',
        },
        {
          id: 'pomodoro',
          label: 'Pomodoro Timer',
          icon: Timer,
          path: '/pomodoro',
        },
        {
          id: 'ai-planner',
          label: 'AI Planner',
          icon: Brain,
          path: '/ai-planner',
        },
        { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
      ],
    },
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
    {
      title: 'Settings',
      items: [
        {
          id: 'settings',
          label: 'Account Settings',
          icon: Settings,
          path: '/settings',
        },
      ],
    },
  ];

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        className="sidebar-hamburger-btn"
        onClick={() =>
          isMobile
            ? setIsOpenMobile((prev) => !prev)
            : setIsCollapsed((prev) => !prev)
        }
        aria-label={
          isMobile
            ? isOpenMobile
              ? 'Cerrar menú'
              : 'Abrir menú'
            : isCollapsed
              ? 'Abrir menú'
              : 'Cerrar menú'
        }
      >
        <Menu size={28} />
      </button>

      <aside
        className={`sidebar-container 
          ${isMobile ? (isOpenMobile ? 'open' : 'closed') : isCollapsed ? 'collapsed' : 'expanded'}`}
        onMouseEnter={() => !isMobile && setIsCollapsed(false)}
        onMouseLeave={() => !isMobile && setIsCollapsed(true)}
      >
        {/* Logo */}
        <div className="sidebar-logo-section">
          <div className="sidebar-logo-icon">
            <BookOpen />
          </div>
          {(!isCollapsed || isMobile) && (
            <h1 className="sidebar-logo-text">FocuseAr</h1>
          )}
          {(!isCollapsed || isMobile) && (
            <p className="sidebar-logo-subtext">AI Study Planner</p>
          )}
        </div>

        {/* Menú */}
        <nav className="sidebar-nav">
          {menuSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              {(!isCollapsed || isMobile) && (
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
                      {(!isCollapsed || isMobile) && (
                        <span className="sidebar-nav-label">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Botón modo oscuro */}
          {(!isCollapsed || isMobile) && (
            <div className="dark-mode-toggle-section">
              <button
                className="dark-mode-btn"
                onClick={onToggleDarkMode}
                aria-label={
                  isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
                }
              >
                {isDarkMode ? (
                  <Sun className="dark-mode-icon" size={22} />
                ) : (
                  <Moon className="dark-mode-icon" size={22} />
                )}
              </button>
            </div>
          )}

          {/* Chat */}
          {!isCollapsed || isMobile ? (
            <div className="sidebar-help-section">
              <div className="sidebar-help-content">
                <div className="sidebar-help-header">
                  <div className="sidebar-help-icon">
                    <Bot />
                  </div>
                  <p className="sidebar-help-title">AI Assistant</p>
                </div>
                <p className="sidebar-help-text">Get help with your studies</p>
                <button
                  className="sidebar-chat-button"
                  onClick={() => setIsChatOpen(true)}
                >
                  <Bot size={16} />
                  Open Chat
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
        </div>
      </aside>

      {/* Chat */}
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

      {/* Contenido principal */}
      <main
        className={`main-content ${isCollapsed ? 'collapsed' : 'expanded'}`}
      >
        <Outlet />
      </main>
    </>
  );
}
