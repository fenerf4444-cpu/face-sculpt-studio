import { motion } from 'framer-motion';
import { uiIcons } from '@/assets/iconMap';

const programs = [
  { id: 'starter', name: '7 Gunluk Baslangic', desc: 'Temel hareketleri ogren', days: 7, progress: 3, gradient: 'from-emerald-500 to-teal-600', free: true },
  { id: 'slim', name: '14 Gun Slim Face', desc: 'Yuz hatlarini belirginlestir', days: 14, progress: 0, gradient: 'from-orange-500 to-red-500', free: true },
  { id: 'jawline', name: 'Jawline Focus', desc: 'Cene hatti odakli program', days: 10, progress: 0, gradient: 'from-blue-500 to-indigo-600', free: true },
  { id: 'eye-lift', name: 'Eye Lift Routine', desc: 'Goz cevresi guclendirme', days: 7, progress: 0, gradient: 'from-purple-500 to-pink-500', free: false },
  { id: 'cheek', name: 'Cheek Energy', desc: 'Yanak kaslarini aktive et', days: 7, progress: 0, gradient: 'from-pink-500 to-rose-500', free: false },
  { id: 'recovery', name: 'Recovery & Relax', desc: 'Yuz gevsetme ve rahatlama', days: 5, progress: 0, gradient: 'from-teal-400 to-cyan-500', free: true },
  { id: 'gymfiesta', name: 'GymFiesta Challenge', desc: '4 aksiyonlu yogun challenge', days: 14, progress: 0, gradient: 'from-red-500 to-orange-500', free: false },
  { id: 'mimic', name: 'Mimic Lab', desc: 'Abartili mimik antrenmani', days: 10, progress: 0, gradient: 'from-violet-500 to-purple-600', free: false },
];

export function ProgramsScreen() {
  return (
    <div className="p-4 pb-24 space-y-5">
      <div className="text-center pt-6">
        <h1 className="font-display text-4xl font-bold text-gradient-cool tracking-tight">PROGRAMLAR</h1>
        <p className="text-muted-foreground text-sm mt-1">Hedefe yonelik antrenman programlari</p>
      </div>

      {/* Active program highlight */}
      <div className="card-3d-elevated p-5 glow-green">
        <div className="flex items-center gap-4">
          <img src={uiIcons.target} alt="" width={44} height={44} className="float-3d" />
          <div className="flex-1">
            <p className="text-[10px] font-display font-bold text-secondary">AKTIF PROGRAM</p>
            <h3 className="font-display text-lg font-bold text-foreground">7 Gunluk Baslangic</h3>
            <p className="text-xs text-muted-foreground">Gun 3 / 7</p>
            <div className="card-3d-inset p-0.5 rounded-full mt-2">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: '43%', boxShadow: '0 0 8px hsl(160 75% 42% / 0.4)' }} />
            </div>
          </div>
        </div>
        <button className="w-full mt-4 py-3 btn-3d-success text-secondary-foreground text-sm">DEVAM ET</button>
      </div>

      {/* Program list */}
      <div className="space-y-3">
        {programs.map((prog, i) => (
          <motion.button
            key={prog.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full card-3d p-4 flex items-center gap-4 text-left group transition-all"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${prog.gradient} flex items-center justify-center shrink-0`}
              style={{ boxShadow: '0 4px 15px -3px hsl(0 0% 0% / 0.4), inset 0 1px 0 0 hsl(0 0% 100% / 0.2)' }}
            >
              <span className="font-display text-xl font-bold text-primary-foreground">{prog.days}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-foreground truncate">{prog.name}</h3>
                {!prog.free && (
                  <div className="card-3d-inset px-1.5 py-0.5 rounded">
                    <span className="text-[9px] font-display font-bold text-neon-orange">PRO</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{prog.desc}</p>
              {prog.progress > 0 && (
                <div className="card-3d-inset p-0.5 rounded-full mt-1.5 w-24">
                  <div className="h-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${(prog.progress / prog.days) * 100}%` }} />
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg card-3d-inset flex items-center justify-center shrink-0">
              <span className="text-muted-foreground text-xs">›</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
