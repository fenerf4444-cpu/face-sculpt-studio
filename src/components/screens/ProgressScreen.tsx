import { useState } from 'react';
import { motion } from 'framer-motion';
import { uiIcons } from '@/assets/iconMap';

const weekDays = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];

interface SessionRecord {
  date: string;
  mode: string;
  score: number;
  accuracy: number;
}

export function ProgressScreen() {
  const [weekActivity, setWeekActivity] = useState([true, true, true, false, false, false, false]);
  const [streak, setStreak] = useState(3);
  const [totalSessions, setTotalSessions] = useState(12);
  const [totalXP, setTotalXP] = useState(1240);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'zones'>('overview');

  const [sessions] = useState<SessionRecord[]>([
    { date: 'Bugun', mode: 'Hizli Oyun', score: 340, accuracy: 78 },
    { date: 'Dun', mode: 'GymFiesta', score: 420, accuracy: 82 },
    { date: '2 gun once', mode: 'Rehberli', score: 280, accuracy: 65 },
    { date: '3 gun once', mode: 'Hizli Oyun', score: 310, accuracy: 71 },
    { date: '4 gun once', mode: 'GymFiesta', score: 390, accuracy: 80 },
  ]);

  const stats = [
    { label: 'Gunluk Streak', value: `${streak}`, icon: uiIcons.streakFire, glow: 'glow-orange' },
    { label: 'Toplam Seans', value: `${totalSessions}`, icon: uiIcons.target, glow: '' },
    { label: 'Toplam Sure', value: '48 dk', icon: uiIcons.chart, glow: '' },
    { label: 'Ort. Dogruluk', value: '%72', icon: uiIcons.trophy, glow: '' },
    { label: 'Toplam XP', value: totalXP.toLocaleString(), icon: uiIcons.xpBolt, glow: 'glow-green' },
    { label: 'En Iyi Combo', value: '7x', icon: uiIcons.streakFire, glow: '' },
  ];

  const zones = [
    { zone: 'Cene Hatti', score: 82, gradient: 'from-emerald-400 to-teal-500' },
    { zone: 'Yanaklar', score: 68, gradient: 'from-orange-400 to-orange-500' },
    { zone: 'Dudaklar', score: 75, gradient: 'from-pink-400 to-rose-500' },
    { zone: 'Gozler', score: 60, gradient: 'from-blue-400 to-indigo-500' },
    { zone: 'Alin', score: 55, gradient: 'from-red-400 to-red-500' },
  ];

  const tabs = [
    { id: 'overview' as const, label: 'GENEL' },
    { id: 'history' as const, label: 'GECMIS' },
    { id: 'zones' as const, label: 'BOLGELER' },
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="text-center pt-6">
        <h1 className="font-display text-4xl font-bold text-gradient-energy tracking-tight">ILERLEME</h1>
        <p className="text-muted-foreground text-sm mt-1">Antrenman gecmisin ve gelisimin</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-display font-bold transition-all ${
              selectedTab === tab.id ? 'btn-3d-primary text-primary-foreground' : 'card-3d text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedTab === 'overview' && (
        <>
          {/* Streak highlight */}
          <div className="card-3d-elevated p-5 glow-orange">
            <div className="flex items-center gap-4">
              <img src={uiIcons.streakFire} alt="Streak" width={52} height={52} className="float-3d" />
              <div>
                <p className="font-display text-4xl font-bold text-foreground">{streak}</p>
                <p className="text-xs text-muted-foreground font-display">GUN ARKA ARKAYA</p>
              </div>
              <div className="flex-1" />
              <div className="card-3d-inset p-3 rounded-xl text-center">
                <p className="font-display text-xl font-bold text-neon-orange">+{streak * 10}</p>
                <p className="text-[9px] text-muted-foreground">STREAK XP</p>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`card-3d p-3.5 text-center ${stat.glow}`}
              >
                <img src={stat.icon} alt="" width={24} height={24} className="mx-auto mb-2 object-contain" loading="lazy" />
                <p className="font-display text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[9px] text-muted-foreground font-display mt-0.5">{stat.label.toUpperCase()}</p>
              </motion.div>
            ))}
          </div>

          {/* Weekly activity */}
          <div className="card-3d-elevated p-4">
            <h3 className="font-display text-sm font-bold text-foreground mb-3">BU HAFTA</h3>
            <div className="flex justify-between">
              {weekDays.map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => {
                      const newActivity = [...weekActivity];
                      newActivity[i] = !newActivity[i];
                      setWeekActivity(newActivity);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      weekActivity[i] ? 'btn-3d-success' : 'card-3d-inset'
                    }`}
                  >
                    {weekActivity[i] ? (
                      <span className="text-[10px] font-display font-bold text-secondary-foreground">OK</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">-</span>
                    )}
                  </button>
                  <span className="text-[9px] text-muted-foreground font-display">{day}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center font-display">{weekActivity.filter(Boolean).length}/7 gun tamamlandi</p>
          </div>

          {/* AI Coach */}
          <div className="card-3d-elevated p-4 glow-red">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg btn-3d-primary flex items-center justify-center">
                <span className="text-[10px] text-primary-foreground font-bold">AI</span>
              </div>
              <p className="font-display text-xs font-bold text-primary">AI KOC OZETI</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bugyn jawline hareketlerinde daha stabildin. Cheek Puff hareketinde simetri biraz dusmus, yarin bunu iyilestirebiliriz. {streak} gundur ritmini koruyorsun, bu cok iyi!
            </p>
          </div>
        </>
      )}

      {selectedTab === 'history' && (
        <div className="space-y-3">
          <div className="card-3d p-4">
            <h3 className="font-display text-sm font-bold text-foreground mb-3">TUM SEANSLAR</h3>
            {sessions.map((session, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-3d-inset p-3 mb-2 last:mb-0 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-display font-bold text-foreground">{session.mode}</p>
                  <p className="text-[10px] text-muted-foreground">{session.date}</p>
                </div>
                <div className="flex gap-3">
                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-foreground">{session.score}</p>
                    <p className="text-[9px] text-muted-foreground">PUAN</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-secondary">%{session.accuracy}</p>
                    <p className="text-[9px] text-muted-foreground">DOGRULUK</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'zones' && (
        <div className="card-3d p-4">
          <h3 className="font-display text-sm font-bold text-foreground mb-4">BOLGE PERFORMANSI</h3>
          {zones.map((item) => (
            <div key={item.zone} className="mb-3.5 last:mb-0">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-display">{item.zone}</span>
                <span className="text-foreground font-display font-bold">%{item.score}</span>
              </div>
              <div className="card-3d-inset p-0.5 rounded-full">
                <motion.div
                  className={`h-2 rounded-full bg-gradient-to-r ${item.gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  style={{ boxShadow: '0 0 8px hsl(0 0% 100% / 0.1)' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
