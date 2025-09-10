// src/components/Sidebar.tsx
import { Outlet } from 'react-router-dom';

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
  MessageCircle,
  Moon,
  Sun,
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isSidebarOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Sidebar({
  activeSection,
  onSectionChange,
  isSidebarOpen,
  isDarkMode,
  onToggleDarkMode,
}: SidebarProps) {
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
      <aside
        className={`sidebar-container ${isSidebarOpen ? '' : 'collapsed'}`}
      >
        <div className="sidebar-logo-section">
          <div className="sidebar-logo-icon">
            <BookOpen />
          </div>
          {isSidebarOpen && <h1 className="sidebar-logo-text">FocuseAr</h1>}
          {isSidebarOpen && (
            <p className="sidebar-logo-subtext">AI Study Planner</p>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              {isSidebarOpen && (
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
                      {isSidebarOpen && (
                        <span className="sidebar-nav-label">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="dark-mode-toggle-section">
          <button className="dark-mode-btn" onClick={onToggleDarkMode}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {isSidebarOpen && (
              <span className="toggle-label">
                {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
              </span>
            )}
          </button>
        </div>

        <div className="sidebar-help-section">
          <div className="sidebar-help-content">
            <div className="sidebar-help-header">
              <div className="sidebar-help-icon">
                <MessageCircle />
              </div>
              {isSidebarOpen && (
                <p className="sidebar-help-title">Need Help?</p>
              )}
            </div>
            {isSidebarOpen && (
              <p className="sidebar-help-text">Chat with our AI assistant</p>
            )}
            {isSidebarOpen && (
              <button className="sidebar-chat-button">
                <MessageCircle size={16} />
                Open Chat
              </button>
            )}
          </div>
        </div>
      </aside>
      <Outlet />
    </>
  );
}
