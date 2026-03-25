import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabBar } from '@/components/TabBar';
import { PlayScreen } from '@/components/screens/PlayScreen';
import { LearnScreen } from '@/components/screens/LearnScreen';
import { ProgramsScreen } from '@/components/screens/ProgramsScreen';
import { ProgressScreen } from '@/components/screens/ProgressScreen';
import { PhotoScreen } from '@/components/screens/PhotoScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import appIcon from '@/assets/app-icon.png';

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0, rotateY: -180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, duration: 1 }}
        className="relative mb-8"
      >
        <div className="w-32 h-32 rounded-3xl card-3d-elevated glow-red overflow-hidden"
          style={{ boxShadow: '0 0 60px -10px hsl(350 85% 55% / 0.5), 0 20px 40px -10px hsl(0 0% 0% / 0.6)' }}>
          <img src={appIcon} alt="FaceFlow" className="w-full h-full object-cover" />
        </div>
        <motion.div
          className="absolute -inset-4 rounded-[2rem] border border-primary/30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.2, 1.4] }}
          transition={{ duration: 2, delay: 0.5, repeat: 1 }}
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="font-display text-4xl font-bold text-gradient-primary tracking-wider"
      >
        FACEGYM
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="text-muted-foreground text-sm mt-2 font-display tracking-widest"
      >
        YUZ YOGA ANTRENMANIN
      </motion.p>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 160 }}
        transition={{ delay: 1.2, duration: 1.2, ease: 'easeInOut' }}
        className="h-1 rounded-full mt-8 overflow-hidden"
        style={{ background: 'linear-gradient(90deg, hsl(350 85% 55%), hsl(330 75% 50%), hsl(25 95% 55%))' }}
      />
    </motion.div>
  );
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('play');
  const [showSplash, setShowSplash] = useState(true);

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
      <AnimatePresence>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      </AnimatePresence>
      {!showSplash && (
        <>
          <div className="max-w-lg mx-auto">
            {renderScreen()}
          </div>
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
};

export default Index;
