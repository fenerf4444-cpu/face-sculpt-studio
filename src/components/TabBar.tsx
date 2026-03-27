import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { uiIcons } from '@/assets/iconMap';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'play', label: 'Antrenman', icon: uiIcons.faceTraining },
  { id: 'learn', label: 'Ogren', icon: uiIcons.learnFace },
  { id: 'programs', label: 'Program', icon: uiIcons.programFace },
  { id: 'progress', label: 'Ilerleme', icon: uiIcons.progressFace },
  { id: 'photo', label: 'Foto', icon: uiIcons.photoFace },
  { id: 'profile', label: 'Profil', icon: uiIcons.profileFace },
];

export const TabBar = forwardRef<HTMLElement, TabBarProps>(
  ({ activeTab, onTabChange }, ref) => {
    return (
      <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom" style={{
        background: 'linear-gradient(180deg, hsl(240 10% 6% / 0.92) 0%, hsl(240 10% 4% / 0.98) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '0.5px solid hsl(240 6% 22% / 0.4)',
      }}>
        <div className="flex items-center justify-around max-w-lg mx-auto pt-1.5 pb-1 px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center gap-0.5 py-1 px-2 min-w-0 transition-all active:scale-95"
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute -inset-x-1 -inset-y-0.5 rounded-2xl"
                    style={{
                      background: 'radial-gradient(ellipse at center bottom, hsl(350 85% 55% / 0.12), transparent 75%)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div className={`relative w-6 h-6 flex items-center justify-center transition-all duration-200 ${isActive ? 'scale-105' : 'scale-90 opacity-40'}`}>
                  <img src={tab.icon} alt={tab.label} width={24} height={24} className="object-contain rounded-md" loading="lazy" />
                </div>
                <span className={`text-[8px] font-display font-semibold tracking-wider transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  {tab.label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }
);

TabBar.displayName = 'TabBar';
