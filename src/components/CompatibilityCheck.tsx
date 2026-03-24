import { motion } from 'framer-motion';
import { CompatibilityState } from '@/types/exercises';

const statusConfig = {
  camera: {
    checking: { text: 'Kamera kontrol ediliyor...', color: 'text-muted-foreground', dot: 'bg-muted-foreground', spin: true },
    ready: { text: 'Kamera hazir', color: 'text-secondary', dot: 'bg-secondary', spin: false },
    'no-camera': { text: 'Kamera bulunamadi', color: 'text-destructive', dot: 'bg-destructive', spin: false },
    'no-permission': { text: 'Kamera izni gerekli', color: 'text-neon-orange', dot: 'bg-neon-orange', spin: false },
    error: { text: 'Kamera hatasi', color: 'text-destructive', dot: 'bg-destructive', spin: false },
  },
  light: {
    checking: { text: 'Isik kontrol ediliyor...', color: 'text-muted-foreground', dot: 'bg-muted-foreground', spin: true },
    good: { text: 'Isik yeterli', color: 'text-secondary', dot: 'bg-secondary', spin: false },
    low: { text: 'Daha aydinlik yere gec', color: 'text-neon-orange', dot: 'bg-neon-orange', spin: false },
    'too-dark': { text: 'Cok karanlik, isigi artir', color: 'text-destructive', dot: 'bg-destructive', spin: false },
  },
  face: {
    searching: { text: 'Yuz araniyor...', color: 'text-muted-foreground', dot: 'bg-muted-foreground', spin: true },
    detected: { text: 'Yuz algilandi', color: 'text-secondary', dot: 'bg-secondary', spin: false },
    'too-close': { text: 'Yuzunu biraz uzaklastir', color: 'text-neon-orange', dot: 'bg-neon-orange', spin: false },
    'too-far': { text: 'Yuzunu kadraja yaklastir', color: 'text-neon-orange', dot: 'bg-neon-orange', spin: false },
    'not-found': { text: 'Yuz algilanamadi', color: 'text-destructive', dot: 'bg-destructive', spin: false },
    unstable: { text: 'Basini sabit tut', color: 'text-neon-orange', dot: 'bg-neon-orange', spin: false },
  },
  tracking: {
    high: { text: 'Takip kalitesi yuksek', color: 'text-secondary', dot: 'bg-secondary', spin: false },
    medium: { text: 'Takip kalitesi orta', color: 'text-neon-orange', dot: 'bg-neon-orange', spin: false },
    low: { text: 'Takip kalitesi dusuk', color: 'text-neon-orange', dot: 'bg-neon-orange', spin: false },
    none: { text: 'Takip yok', color: 'text-muted-foreground', dot: 'bg-muted-foreground', spin: false },
  },
};

export function CompatibilityCheck({ state }: { state: CompatibilityState }) {
  const items = [
    { key: 'camera' as const, value: state.camera },
    { key: 'light' as const, value: state.light },
    { key: 'face' as const, value: state.face },
    { key: 'tracking' as const, value: state.tracking },
  ];

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const config = (statusConfig[item.key] as any)[item.value];
        if (!config) return null;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-3d px-4 py-3 flex items-center gap-3"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${config.dot} ${config.spin ? 'animate-pulse' : ''}`}
              style={{ boxShadow: `0 0 8px currentColor` }}
            />
            <span className={`text-sm font-display font-bold ${config.color}`}>{config.text}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
