import { useState } from 'react';
import { motion } from 'framer-motion';
import { uiIcons } from '@/assets/iconMap';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const weekDays = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];

interface SessionRecord {
  date: string;
  mode: string;
  score: number;
  accuracy: number;
}

// Weekly data for charts
const weeklyXP = [
  { day: 'Pzt', xp: 180, accuracy: 68 },
  { day: 'Sal', xp: 240, accuracy: 72 },
  { day: 'Car', xp: 310, accuracy: 78 },
  { day: 'Per', xp: 0, accuracy: 0 },
  { day: 'Cum', xp: 0, accuracy: 0 },
  { day: 'Cmt', xp: 0, accuracy: 0 },
  { day: 'Paz', xp: 0, accuracy: 0 },
];

const zoneWorkMinutes = [
  { zone: 'Cene', mins: 18, score: 82 },
  { zone: 'Yanak', mins: 12, score: 68 },
  { zone: 'Dudak', mins: 15, score: 75 },
  { zone: 'Goz', mins: 8, score: 60 },
  { zone: 'Alin', mins: 6, score: 55 },
  { zone: 'Boyun', mins: 4, score: 45 },
];

const symmetryHistory = [
  { day: 'Pzt', left: 72, right: 68 },
  { day: 'Sal', left: 75, right: 71 },
  { day: 'Car', left: 78, right: 76 },
  { day: 'Per', left: 0, right: 0 },
  { day: 'Cum', left: 0, right: 0 },
  { day: 'Cmt', left: 0, right: 0 },
  { day: 'Paz', left: 0, right: 0 },
];

const radarData = [
  { metric: 'Cene', value: 82 },
  { metric: 'Yanak', value: 68 },
  { metric: 'Dudak', value: 75 },
  { metric: 'Goz', value: 60 },
  { metric: 'Alin', value: 55 },
  { metric: 'Boyun', value: 45 },
];

export function ProgressScreen() {
  const [weekActivity, setWeekActivity] = useState([true, true, true, false, false, false, false]);
  const [streak] = useState(3);
  const [totalSessions] = useState(12);
  const [totalXP] = useState(1240);
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
    { label: 'Toplam Seans', value: `${totalSessions}`, icon: uiIcons.progressFace, glow: '' },
    { label: 'Toplam Sure', value: '48 dk', icon: uiIcons.progressFace, glow: '' },
    { label: 'Ort. Dogruluk', value: '%72', icon: uiIcons.faceTraining, glow: '' },
    { label: 'Toplam XP', value: totalXP.toLocaleString(), icon: uiIcons.xpBolt, glow: 'glow-green' },
    { label: 'En Iyi Combo', value: '7x', icon: uiIcons.streakFire, glow: '' },
  ];

  const tabs = [
    { id: 'overview' as const, label: 'GENEL' },
    { id: 'history' as const, label: 'GECMIS' },
    { id: 'zones' as const, label: 'BOLGELER' },
  ];

  const chartTooltipStyle = {
    contentStyle: {
      background: 'hsl(240 8% 10%)',
      border: '1px solid hsl(240 6% 22%)',
      borderRadius: '12px',
      fontSize: '11px',
      fontFamily: 'Rajdhani, sans-serif',
      color: 'hsl(0 0% 90%)',
    },
  };

  return (
    <div className="p-4 pb-24 space-y-5">
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

          {/* XP Trend Chart */}
          <div className="card-3d-elevated p-4">
            <h3 className="font-display text-sm font-bold text-foreground mb-3">HAFTALIK XP TRENDI</h3>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={weeklyXP}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(350 85% 55%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(350 85% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(240 5% 50%)', fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="xp" stroke="hsl(350 85% 55%)" strokeWidth={2.5} fill="url(#xpGrad)" dot={{ r: 3, fill: 'hsl(350 85% 55%)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Accuracy Trend */}
          <div className="card-3d-elevated p-4">
            <h3 className="font-display text-sm font-bold text-foreground mb-3">DOGRULUK GELISIMI</h3>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={weeklyXP}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(240 5% 50%)', fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip {...chartTooltipStyle} />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(160 75% 42%)" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(160 75% 42%)' }} />
              </LineChart>
            </ResponsiveContainer>
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
          {/* Symmetry Chart */}
          <div className="card-3d-elevated p-4">
            <h3 className="font-display text-sm font-bold text-foreground mb-3">SIMETRI GELISIMI (Sol vs Sag)</h3>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={symmetryHistory}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(240 5% 50%)', fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip {...chartTooltipStyle} />
                <Line type="monotone" dataKey="left" stroke="hsl(185 80% 50%)" strokeWidth={2} dot={{ r: 2.5, fill: 'hsl(185 80% 50%)' }} name="Sol" />
                <Line type="monotone" dataKey="right" stroke="hsl(330 85% 58%)" strokeWidth={2} dot={{ r: 2.5, fill: 'hsl(330 85% 58%)' }} name="Sag" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              <span className="text-[10px] font-display text-muted-foreground flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(185 80% 50%)' }} /> Sol
              </span>
              <span className="text-[10px] font-display text-muted-foreground flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(330 85% 58%)' }} /> Sag
              </span>
            </div>
          </div>

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
        <div className="space-y-4">
          {/* Radar chart */}
          <div className="card-3d-elevated p-4">
            <h3 className="font-display text-sm font-bold text-foreground mb-3">BOLGE HARITASI</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(240 6% 20%)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'hsl(240 5% 50%)', fontFamily: 'Rajdhani' }} />
                <Radar dataKey="value" stroke="hsl(350 85% 55%)" fill="hsl(350 85% 55%)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Zone work time bar chart */}
          <div className="card-3d-elevated p-4">
            <h3 className="font-display text-sm font-bold text-foreground mb-3">BOLGE CALISMA SURESI (dk)</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={zoneWorkMinutes} barSize={20}>
                <XAxis dataKey="zone" tick={{ fontSize: 10, fill: 'hsl(240 5% 50%)', fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="mins" radius={[6, 6, 0, 0]} fill="hsl(160 75% 42%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Zone performance bars */}
          <div className="card-3d p-4">
            <h3 className="font-display text-sm font-bold text-foreground mb-4">BOLGE PERFORMANSI</h3>
            {zoneWorkMinutes.map((item) => (
              <div key={item.zone} className="mb-3.5 last:mb-0">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-display">{item.zone}</span>
                  <span className="text-foreground font-display font-bold">%{item.score}</span>
                </div>
                <div className="card-3d-inset p-0.5 rounded-full">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, hsl(${160 + item.score} 75% 45%), hsl(${160 + item.score * 0.5} 60% 40%))`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
