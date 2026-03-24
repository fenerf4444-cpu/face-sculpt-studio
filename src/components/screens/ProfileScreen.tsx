import { motion } from 'framer-motion';
import { uiIcons } from '@/assets/iconMap';

export function ProfileScreen() {
  const menuItems = [
    { label: 'Hesabi Bagla', desc: 'Google / Apple ile giris yap', color: 'text-secondary' },
    { label: 'Premium', desc: 'Tum ozellikleri ac', color: 'text-neon-orange' },
    { label: 'Bildirimler', desc: 'Hatirlatma saatlerini ayarla', color: 'text-neon-pink' },
    { label: 'Ses & Ritim', desc: 'Muzik ve ses efektleri', color: 'text-neon-cyan' },
    { label: 'Kamera Ayarlari', desc: 'Performans ve kalite', color: 'text-neon-green' },
    { label: 'Gizlilik', desc: 'Veri yonetimi ve guvenlik', color: 'text-muted-foreground' },
    { label: 'Hesap Sil', desc: 'Tum verileri kaldir', color: 'text-destructive' },
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Avatar */}
      <div className="text-center pt-6">
        <div className="w-24 h-24 rounded-2xl card-3d-elevated mx-auto mb-4 flex items-center justify-center glow-red overflow-hidden">
          <img src={uiIcons.trophy} alt="Profil" width={52} height={52} className="object-contain float-3d" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">Anonim Kullanici</h1>
        <p className="text-xs text-muted-foreground mt-1">Hesabini baglayarak verilerini koru</p>
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-4">
        {[
          { label: 'STREAK', value: '3', icon: uiIcons.streakFire },
          { label: 'XP', value: '1,240', icon: uiIcons.xpBolt },
          { label: 'SEANS', value: '12', icon: uiIcons.target },
        ].map((s) => (
          <div key={s.label} className="card-3d p-3 text-center flex-1">
            <img src={s.icon} alt="" width={20} height={20} className="mx-auto mb-1.5 object-contain" loading="lazy" />
            <p className="font-display text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground font-display">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="space-y-1.5">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            whileTap={{ scale: 0.98 }}
            className="w-full card-3d p-4 flex items-center gap-3 text-left group transition-all"
          >
            <div className={`w-2 h-2 rounded-full ${item.color === 'text-destructive' ? 'bg-destructive' : 'bg-primary'}`}
              style={{ boxShadow: '0 0 6px currentColor' }}
            />
            <div className="flex-1">
              <p className={`text-sm font-display font-bold ${item.color}`}>{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
            <div className="w-6 h-6 rounded card-3d-inset flex items-center justify-center">
              <span className="text-muted-foreground text-[10px]">›</span>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-center text-[10px] text-muted-foreground font-display">FACEGYM v1.0 — BASAMAK 2</p>
    </div>
  );
}
