import { Gamepad2, BookOpen, Layout, TrendingUp, Camera, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'play', label: 'Oyna', icon: Gamepad2 },
  { id: 'learn', label: 'Öğren', icon: BookOpen },
  { id: 'programs', label: 'Programlar', icon: Layout },
  { id: 'progress', label: 'İlerleme', icon: TrendingUp },
  { id: 'photo', label: 'Foto', icon: Camera },
  { id: 'profile', label: 'Profil', icon: User },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 px-2 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-0.5 py-2 px-3 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 gradient-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                className={isActive ? 'text-primary' : 'text-muted-foreground'}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
