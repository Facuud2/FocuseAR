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
}

// Renombramos la función a 'Sidebar' para que coincida con el nombre del archivo.
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
    // Contenedor principal del Sidebar
    <aside className="w-80 h-screen bg-white flex flex-col border-r border-gray-200">
      {/* Sección del Logo */}
      <div className="p-6 text-center border-b border-gray-200">
        <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          <BookOpen className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">FocuseAr</h1>
        <p className="text-sm font-medium text-cyan-600">AI Study Planner</p>
      </div>

      {/* Navegación principal con scroll si es necesario */}
      <nav className="flex-1 p-6 space-y-6 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-2 mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    className={`w-full flex items-center gap-3 h-11 px-4 rounded-xl transition-all duration-200 text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-sky-100 hover:text-sky-700'
                    }`}
                    onClick={() => onSectionChange(item.id)}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sección de "Need Help?" al final */}
      <div className="p-6 border-t border-gray-200">
        <div className="bg-violet-50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-blue-400 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Need Help?</p>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Chat with our AI assistant
          </p>
          <button className="w-full text-sm font-semibold py-2 rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-100 transition-colors">
            Open Chat
          </button>
        </div>
      </div>
    </aside>
  );
}
