import { useState } from 'react';
import { TabBar } from '@/components/TabBar';
import { PlayScreen } from '@/components/screens/PlayScreen';
import { LearnScreen } from '@/components/screens/LearnScreen';
import { ProgramsScreen } from '@/components/screens/ProgramsScreen';
import { ProgressScreen } from '@/components/screens/ProgressScreen';
import { PhotoScreen } from '@/components/screens/PhotoScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';

const Index = () => {
  const [activeTab, setActiveTab] = useState('play');

  const renderScreen = () => {
    switch (activeTab) {
      case 'play': return <PlayScreen />;
      case 'learn': return <LearnScreen />;
      case 'programs': return <ProgramsScreen />;
      case 'progress': return <ProgressScreen />;
      case 'photo': return <PhotoScreen />;
      case 'profile': return <ProfileScreen />;
      default: return <PlayScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        {renderScreen()}
      </div>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
