// --- START OF FILE Sidebar.tsx (Updated with new CSS classes) ---
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
} from 'lucide-react';

// Definimos las propiedades que el componente recibirá.
interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isSidebarOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  activeSection,
  onSectionChange,
}: SidebarProps) {
  const menuSections = [
    {
      title: 'Dashboard',
      items: [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'schedule', label: 'Study Schedule', icon: Clock },
      ],
    },
    {
      title: 'Study Management',
      items: [
        { id: 'subjects', label: 'Subjects', icon: BookOpen },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'pomodoro', label: 'Pomodoro Timer', icon: Timer },
        { id: 'ai-planner', label: 'AI Planner', icon: Brain },
        { id: 'profile', label: 'Profile', icon: User },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { id: 'progress', label: 'Progress', icon: TrendingUp },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'Settings',
      items: [{ id: 'settings', label: 'Settings', icon: Settings }],
    },
  ];

  return (
    <>
      <aside className="sidebar-container">
        {/* Sección del Logo */}
        <div className="sidebar-logo-section">
          <div className="sidebar-logo-icon">
            <BookOpen />
          </div>
          <h1 className="sidebar-logo-text">FocuseAr</h1>
          <p className="sidebar-logo-subtext">AI Study Planner</p>
        </div>

        {/* Navegación principal */}
        <nav className="sidebar-nav">
          {menuSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <h3 className="sidebar-section-title">{section.title}</h3>
              <div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onSectionChange(item.id);
                      }}
                    >
                      <Icon className="sidebar-nav-icon" />
                      <span className="sidebar-nav-label">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sección de "Need Help?" al final */}
        <div className="sidebar-help-section">
          <div className="sidebar-help-content">
            <div className="sidebar-help-header">
              <div className="sidebar-help-icon">
                <MessageCircle />
              </div>
              <p className="sidebar-help-title">Need Help?</p>
            </div>
            <p className="sidebar-help-text">Chat with our AI assistant</p>
            <button className="sidebar-chat-button">
              <MessageCircle size={16} />
              Open Chat
            </button>
          </div>
        </div>
      </aside>
      <Outlet />
    </>
  );
}
// --- END OF FILE Sidebar.tsx ---
