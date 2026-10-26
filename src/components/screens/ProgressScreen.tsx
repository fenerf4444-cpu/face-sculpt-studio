import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { uiIcons } from '@/assets/iconMap';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { loadSessions, getStreak, getTotalStats, getWeeklyData, getZoneStats, getSymmetryHistory } from '@/lib/session-store';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Bugun';
  if (same(d, yesterday)) return 'Dun';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function ProgressScreen() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'zones'>('overview');

  const sessions = useMemo(() => loadSessions(), []);
  const streak = useMemo(() => getStreak(sessions), [sessions]);
  const stats = useMemo(() => getTotalStats(sessions), [sessions]);
  const weekly = useMemo(() => getWeeklyData(sessions), [sessions]);
  const zones = useMemo(() => getZoneStats(sessions), [sessions]);
  const symmetry = useMemo(() => getSymmetryHistory(sessions), [sessions]);
  const hasData = sessions.length > 0;

  const statCards = [
    { label: 'Gunluk Streak', value: `${streak}`, icon: uiIcons.streakFire, glow: streak > 0 ? 'glow-orange' : '' },
    { label: 'Toplam Seans', value: `${stats.totalSessions}`, icon: uiIcons.progressFace, glow: '' },
    { label: 'Toplam Sure', value: `${stats.totalMinutes} dk`, icon: uiIcons.progressFace, glow: '' },
    { label: 'Ort. Dogruluk', value: `%${stats.avgAccuracy}`, icon: uiIcons.faceTraining, glow: '' },
    { label: 'Toplam XP', value: stats.totalXP.toLocaleString('tr-TR'), icon: uiIcons.xpBolt, glow: stats.totalXP > 0 ? 'glow-green' : '' },
    { label: 'En Iyi Combo', value: `${stats.bestCombo}x`, icon: uiIcons.streakFire, glow: '' },
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

  // Real AI coach summary derived from actual data
  const coachMessage = useMemo(() => {
    if (!hasData) return 'Henuz antrenman verin yok. Oyna sekmesinden ilk seansini tamamla, burada gelisimini takip et.';
    const parts: string[] = [];
    if (zones.length > 0) {
      parts.push(`En cok ${zones[0].zoneTr} bolgesini calistin (${zones[0].mins} dk).`);
      if (zones.length > 1) {
        const weakest = zones[zones.length - 1];
        parts.push(`${weakest.zoneTr} bolgesi daha az calisti, denge icin ona agirlik verebilirsin.`);
      }
    }
    if (stats.avgAccuracy >= 75) parts.push(`Ortalama dogrulugun %${stats.avgAccuracy}, cok iyi seviyede.`);
    else if (stats.avgAccuracy > 0) parts.push(`Ortalama dogrulugun %${stats.avgAccuracy}. Hareketleri daha yavas ve kontrollu yaparak artirabilirsin.`);
    if (streak > 1) parts.push(`${streak} gundur arka arkaya antrenman yapiyorsun, ritmi koru!`);
    return parts.join(' ');
  }, [hasData, zones, stats, streak]);

  const emptyState = (
    <div className="card-3d-elevated p-8 text-center">
      <img src={uiIcons.progressFace} alt="" width={56} height={56} className="mx-auto mb-4 float-3d" />
      <h3 className="font-display text-lg font-bold text-foreground mb-2">HENUZ VERI YOK</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Ilk antrenmanini tamamladiginda grafiklerin ve istatistiklerin burada gercek verilerinle olusacak.
      </p>
    </div>
  );

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
          <div className={`card-3d-elevated p-5 ${streak > 0 ? 'glow-orange' : ''}`}>
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
            {statCards.map((stat, i) => (
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

          {!hasData ? emptyState : (
            <>
              {/* XP Trend Chart */}
              <div className="card-3d-elevated p-4">
                <h3 className="font-display text-sm font-bold text-foreground mb-3">HAFTALIK XP TRENDI</h3>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={weekly}>
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
                  <LineChart data={weekly}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(240 5% 50%)', fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip {...chartTooltipStyle} />
                    <Line type="monotone" dataKey="accuracy" stroke="hsl(160 75% 42%)" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(160 75% 42%)' }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly activity - real trained days */}
              <div className="card-3d-elevated p-4">
                <h3 className="font-display text-sm font-bold text-foreground mb-3">BU HAFTA</h3>
                <div className="flex justify-between">
                  {weekly.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        d.trained ? 'btn-3d-success' : 'card-3d-inset'
                      }`}>
                        {d.trained ? (
                          <span className="text-[10px] font-display font-bold text-secondary-foreground">OK</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">-</span>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground font-display">{d.day}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center font-display">{weekly.filter(d => d.trained).length}/7 gun tamamlandi</p>
              </div>
            </>
          )}

          {/* Coach note - real data driven */}
          <div className="card-3d-elevated p-4 glow-red">
            <div className="flex items-center gap-2 mb-2">
              <img src={uiIcons.faceTraining} alt="" width={22} height={22} className="object-contain" />
              <p className="font-display text-xs font-bold text-primary">KOC NOTU</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{coachMessage}</p>
          </div>
        </>
      )}

      {selectedTab === 'history' && (
        <div className="space-y-3">
          {!hasData ? emptyState : (
            <>
              {/* Symmetry Chart - real per-session data */}
              {symmetry.length > 1 && (
                <div className="card-3d-elevated p-4">
                  <h3 className="font-display text-sm font-bold text-foreground mb-3">SIMETRI GELISIMI (son {symmetry.length} seans)</h3>
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={symmetry}>
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(240 5% 50%)', fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip {...chartTooltipStyle} />
                      <Line type="monotone" dataKey="value" stroke="hsl(185 80% 50%)" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(185 80% 50%)' }} name="Simetri" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="card-3d p-4">
                <h3 className="font-display text-sm font-bold text-foreground mb-3">TUM SEANSLAR ({sessions.length})</h3>
                {[...sessions].reverse().map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.05 }}
                    className="card-3d-inset p-3 mb-2 last:mb-0 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-display font-bold text-foreground">{session.modeName}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(session.date)} · {session.exercisesCompleted} hareket</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-right">
                        <p className="font-display text-sm font-bold text-foreground">{session.score}</p>
                        <p className="text-[9px] text-muted-foreground">PUAN</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-sm font-bold text-secondary">%{Math.round(session.accuracy)}</p>
                        <p className="text-[9px] text-muted-foreground">DOGRULUK</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {selectedTab === 'zones' && (
        <div className="space-y-4">
          {!hasData || zones.length === 0 ? emptyState : (
            <>
              {/* Radar chart */}
              <div className="card-3d-elevated p-4">
                <h3 className="font-display text-sm font-bold text-foreground mb-3">BOLGE HARITASI</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={zones.map(z => ({ metric: z.zoneTr, value: z.score }))} cx="50%" cy="50%" outerRadius="70%">
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
                  <BarChart data={zones.map(z => ({ zone: z.zoneTr, mins: z.mins }))} barSize={20}>
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
                {zones.map((item) => (
                  <div key={item.zone} className="mb-3.5 last:mb-0">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground font-display">{item.zoneTr}</span>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
