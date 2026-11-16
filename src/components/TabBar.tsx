import { forwardRef } from 'react';
import { ScanFace, BookOpen, CalendarDays, ChartNoAxesCombined, Images, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'play', label: 'Antrenman', icon: ScanFace },
  { id: 'learn', label: 'Öğren', icon: BookOpen },
  { id: 'programs', label: 'Program', icon: CalendarDays },
  { id: 'progress', label: 'İlerleme', icon: ChartNoAxesCombined },
  { id: 'photo', label: 'Fotoğraf', icon: Images },
  { id: 'profile', label: 'Profil', icon: UserRound },
];

export const TabBar = forwardRef<HTMLElement, TabBarProps>(
  ({ activeTab, onTabChange }, ref) => {
    return (
      <nav ref={ref} aria-label="Ana menü" className="app-tabs fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="grid grid-cols-6 max-w-[480px] mx-auto py-2 px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Button variant="ghost"
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-14 flex-col items-center gap-1 py-2 px-0 min-w-0 rounded-xl ${isActive ? 'text-primary bg-muted' : 'text-muted-foreground'}`}
              >
                <tab.icon className="!w-5 !h-5" strokeWidth={isActive ? 2 : 1.6} />
                <span className="text-[9px] font-semibold">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    );
  }
);

TabBar.displayName = 'TabBar';
