import { motion } from 'framer-motion';
import { uiIcons } from '@/assets/iconMap';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'play', label: 'Oyna', icon: uiIcons.gamepad },
  { id: 'learn', label: 'Ogren', icon: uiIcons.book },
  { id: 'programs', label: 'Program', icon: uiIcons.target },
  { id: 'progress', label: 'Ilerleme', icon: uiIcons.chart },
  { id: 'photo', label: 'Foto', icon: uiIcons.camera },
  { id: 'profile', label: 'Profil', icon: uiIcons.trophy },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{
      background: 'linear-gradient(180deg, hsl(240 10% 4% / 0.85) 0%, hsl(240 10% 4% / 0.98) 100%)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid hsl(240 6% 18% / 0.5)',
      boxShadow: '0 -4px 30px -4px hsl(0 0% 0% / 0.5)',
    }}>
      <div className="flex items-center justify-around max-w-lg mx-auto py-1.5 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-2 transition-all"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-glow"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'radial-gradient(ellipse at center, hsl(350 85% 55% / 0.15), transparent 70%)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className={`relative w-7 h-7 flex items-center justify-center transition-transform ${isActive ? 'scale-110' : 'scale-90 opacity-50'}`}>
                <img src={tab.icon} alt={tab.label} width={28} height={28} className="object-contain" loading="lazy" />
              </div>
              <span className={`text-[9px] font-display font-bold tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label.toUpperCase()}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-dot"
                  className="absolute -top-0.5 w-6 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, hsl(350 85% 55%), hsl(330 75% 55%))' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
