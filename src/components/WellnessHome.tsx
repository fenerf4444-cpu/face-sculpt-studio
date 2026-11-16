import { useState } from 'react';
import { ArrowUpRight, Camera, ChevronRight, Flame, Leaf, Sparkles, Timer, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import wellnessPhoto from '@/assets/face-yoga-wellness.jpg';
import { loadSessions, getStreak, getTotalStats } from '@/lib/session-store';
import { getVoiceEnabled, setVoiceEnabled } from '@/lib/voice-guidance';
import type { GameMode } from '@/types/exercises';

interface WellnessHomeProps {
  onStart: (mode: GameMode) => void;
  sessionsToday: number;
}

export function WellnessHome({ onStart, sessionsToday }: WellnessHomeProps) {
  const [filter, setFilter] = useState('Tümü');
  const [voiceOn, setVoiceOn] = useState(getVoiceEnabled);
  const sessions = loadSessions();
  const stats = getTotalStats(sessions);
  const name = localStorage.getItem('facegym-name');
  const routines: { name: string; desc: string; mode: GameMode; count: string; category: string }[] = [
    { name: 'Güne yumuşak bir başlangıç', desc: 'Kısa yüz rutini', mode: 'quick-play', count: '5 hareket', category: 'Yüz yogası' },
    { name: 'Dudak & ifade kontrolü', desc: 'Ritmik takip antrenmanı', mode: 'zone-play', count: '4 hareket', category: 'Yüz yogası' },
    { name: 'Tüm yüz rutini', desc: 'Adım adım rehberli çalışma', mode: 'guided-training', count: 'Tüm hareketler', category: 'Rehberli' },
    { name: 'Aktif yüz antrenmanı', desc: 'İfade ve koordinasyon', mode: 'gymfiesta', count: '4 hareket', category: 'Rehberli' },
  ];
  return (
    <div className="app-screen space-y-6">
      <header className="flex justify-between items-center gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Kendine ayırdığın zaman</p>
          <h1 className="font-bold">Merhaba{name && name !== 'Anonim Kullanici' ? `, ${name}` : ''}.</h1>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2"><Sparkles className="w-3.5 h-3.5 text-primary" /> FACEGYM <span className="mx-1">·</span> {stats.totalXP} XP</p>
        </div>
        <Button variant="outline" size="icon" className="rounded-full shrink-0" title={voiceOn ? 'Sesli yönlendirmeyi kapat' : 'Sesli yönlendirmeyi aç'} aria-label={voiceOn ? 'Sesli yönlendirmeyi kapat' : 'Sesli yönlendirmeyi aç'} onClick={() => { setVoiceEnabled(!voiceOn); setVoiceOn(!voiceOn); }}>
          {voiceOn ? <Volume2 /> : <VolumeX />}
        </Button>
      </header>

      <div className="flex rounded-full p-1 bg-card border border-border">
        {['Tümü', 'Yüz yogası', 'Rehberli'].map(item => <Button key={item} variant={filter === item ? 'default' : 'ghost'} className="flex-1 rounded-full h-9 text-xs" onClick={() => setFilter(item)}>{item}</Button>)}
      </div>

      <section className="wellness-hero">
        <img src={wellnessPhoto} alt="Şakaklarına nazikçe dokunarak yüz yogası yapan kadın" width={1200} height={1008} />
        <div className="wellness-hero-copy">
          <span className="text-xs text-foreground/70 flex items-center gap-1"><Leaf className="w-3 h-3" /> Bugünün rutini</span>
          <h2 className="text-[29px] leading-[1.1] mt-4 font-bold">Yüzüne<br />iyi bak.</h2>
          <p className="text-xs text-foreground/70 mt-3 leading-relaxed">Yavaşla. Rahatla.<br />Hareketi hisset.</p>
          <Button className="mt-5 rounded-full text-xs h-10 px-4" onClick={() => onStart('quick-play')}>Başla <ArrowUpRight /></Button>
        </div>
        <div className="absolute bottom-4 right-4 bg-card/90 rounded-full px-3 py-2 text-[10px] flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-primary" /> Kameralı antrenman</div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3"><h2 className="text-base font-bold">Senin ritmin</h2><span className="text-[11px] text-muted-foreground">Bugün</span></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="wellness-stat"><div className="flex justify-between items-center text-xs"><span>Günlük seans</span><Timer className="w-4 h-4 text-neon-pink" /></div><p className="text-3xl font-bold mt-4">{sessionsToday}<span className="text-xs font-normal text-muted-foreground ml-2">seans</span></p></div>
          <div className="wellness-stat"><div className="flex justify-between items-center text-xs"><span>Devam serisi</span><Flame className="w-4 h-4 text-neon-orange" /></div><p className="text-3xl font-bold mt-4">{getStreak(sessions)}<span className="text-xs font-normal text-muted-foreground ml-2">gün</span></p></div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">Sana uygun rutinler</h2>
        {routines.filter(r => filter === 'Tümü' || r.category === filter).map((routine, i) => (
          <Button key={routine.mode} variant="ghost" className="wellness-program w-full h-auto p-4 justify-start text-left whitespace-normal gap-3" onClick={() => onStart(routine.mode)}>
            <span className="text-xl font-bold text-primary w-8 shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <span className="flex-1 min-w-0"><span className="block text-sm font-bold">{routine.name}</span><span className="block text-[11px] font-normal text-muted-foreground mt-1">{routine.desc} · {routine.count}</span></span>
            <ChevronRight className="text-primary" />
          </Button>
        ))}
      </section>
    </div>
  );
}