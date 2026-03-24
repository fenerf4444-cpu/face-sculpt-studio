import { motion } from 'framer-motion';
import { Lock, ChevronRight, Clock, Flame, Dumbbell, Sparkles, Heart, Zap } from 'lucide-react';

const programs = [
  { id: 'starter', name: '7 Günlük Başlangıç', desc: 'Temel hareketleri öğren', days: 7, icon: Sparkles, color: 'from-green-500 to-emerald-600', free: true },
  { id: 'slim', name: '14 Gün Slim Face', desc: 'Yüz hatlarını belirginleştir', days: 14, icon: Flame, color: 'from-orange-500 to-red-500', free: true },
  { id: 'jawline', name: 'Jawline Focus', desc: 'Çene hattı odaklı program', days: 10, icon: Dumbbell, color: 'from-blue-500 to-indigo-600', free: true },
  { id: 'eye-lift', name: 'Eye Lift Routine', desc: 'Göz çevresi güçlendirme', days: 7, icon: Sparkles, color: 'from-purple-500 to-pink-500', free: false },
  { id: 'cheek', name: 'Cheek Energy', desc: 'Yanak kaslarını aktive et', days: 7, icon: Zap, color: 'from-pink-500 to-rose-500', free: false },
  { id: 'recovery', name: 'Recovery & Relax', desc: 'Yüz gevşetme ve rahatlama', days: 5, icon: Heart, color: 'from-teal-500 to-cyan-500', free: true },
  { id: 'gymfiesta', name: 'GymFiesta Challenge', desc: '4 aksiyonlu yoğun challenge', days: 14, icon: Flame, color: 'from-red-500 to-orange-500', free: false },
  { id: 'mimic', name: 'Mimic Lab', desc: 'Abartılı mimik antrenmanı', days: 10, icon: Sparkles, color: 'from-violet-500 to-purple-600', free: false },
];

export function ProgramsScreen() {
  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="text-center pt-4">
        <h1 className="font-display text-2xl font-black text-gradient-primary">PROGRAMLAR</h1>
        <p className="text-muted-foreground text-sm mt-1">Hedefe yönelik antrenman programları</p>
      </div>

      <div className="space-y-3">
        {programs.map((prog, i) => {
          const Icon = prog.icon;
          return (
            <motion.button
              key={prog.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="w-full glass-card p-4 flex items-center gap-4 text-left group hover:border-primary/30 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${prog.color} flex items-center justify-center shrink-0`}>
                <Icon className="text-primary-foreground" size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-bold text-foreground truncate">{prog.name}</h3>
                  {!prog.free && <Lock size={12} className="text-neon-orange shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{prog.desc}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={10} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{prog.days} gün</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
