import { motion } from 'framer-motion';
import { User, Bell, Volume2, Camera as CameraIcon, Shield, Trash2, LogIn, ChevronRight, Crown } from 'lucide-react';

export function ProfileScreen() {
  const menuItems = [
    { icon: LogIn, label: 'Hesabı Bağla', desc: 'Google / Apple ile giriş yap', color: 'text-secondary' },
    { icon: Crown, label: 'Premium', desc: 'Tüm özellikleri aç', color: 'text-neon-orange' },
    { icon: Bell, label: 'Bildirimler', desc: 'Hatırlatma saatlerini ayarla', color: 'text-neon-pink' },
    { icon: Volume2, label: 'Ses & Ritim', desc: 'Müzik ve ses efektleri', color: 'text-blue-400' },
    { icon: CameraIcon, label: 'Kamera Ayarları', desc: 'Performans ve kalite', color: 'text-neon-green' },
    { icon: Shield, label: 'Gizlilik', desc: 'Veri yönetimi ve güvenlik', color: 'text-muted-foreground' },
    { icon: Trash2, label: 'Hesap Sil', desc: 'Tüm verileri kaldır', color: 'text-destructive' },
  ];

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="text-center pt-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <User size={32} className="text-muted-foreground" />
        </div>
        <h1 className="font-display text-lg font-black text-foreground">Anonim Kullanıcı</h1>
        <p className="text-xs text-muted-foreground mt-1">Hesabını bağlayarak verilerini koru</p>
      </div>

      {/* Stats summary */}
      <div className="flex justify-center gap-6">
        {[
          { label: 'Streak', value: '3 🔥' },
          { label: 'XP', value: '1,240 ⚡' },
          { label: 'Seans', value: '12' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-lg font-black text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="space-y-1">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="w-full glass-card p-3.5 flex items-center gap-3 text-left group hover:border-primary/20 transition-all"
            >
              <Icon size={18} className={item.color} />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </motion.button>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-muted-foreground">FaceGym v1.0 • Basamak 1 MVP</p>
    </div>
  );
}
