import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { CompatibilityState } from '@/types/exercises';

interface CompatibilityCheckProps {
  state: CompatibilityState;
}

const statusConfig = {
  camera: {
    checking: { icon: Loader2, text: 'Kamera kontrol ediliyor...', color: 'text-muted-foreground', spin: true },
    ready: { icon: CheckCircle, text: 'Kamera hazır ✅', color: 'text-secondary', spin: false },
    'no-camera': { icon: XCircle, text: 'Kamera bulunamadı', color: 'text-destructive', spin: false },
    'no-permission': { icon: AlertTriangle, text: 'Kamera izni gerekli', color: 'text-neon-orange', spin: false },
    error: { icon: XCircle, text: 'Kamera hatası', color: 'text-destructive', spin: false },
  },
  light: {
    checking: { icon: Loader2, text: 'Işık kontrol ediliyor...', color: 'text-muted-foreground', spin: true },
    good: { icon: CheckCircle, text: 'Işık yeterli ✅', color: 'text-secondary', spin: false },
    low: { icon: AlertTriangle, text: 'Daha aydınlık yere geç', color: 'text-neon-orange', spin: false },
    'too-dark': { icon: XCircle, text: 'Çok karanlık, ışığı artır', color: 'text-destructive', spin: false },
  },
  face: {
    searching: { icon: Loader2, text: 'Yüz aranıyor...', color: 'text-muted-foreground', spin: true },
    detected: { icon: CheckCircle, text: 'Yüz algılandı ✅', color: 'text-secondary', spin: false },
    'too-close': { icon: AlertTriangle, text: 'Yüzünü biraz uzaklaştır', color: 'text-neon-orange', spin: false },
    'too-far': { icon: AlertTriangle, text: 'Yüzünü kadraja yaklaştır', color: 'text-neon-orange', spin: false },
    'not-found': { icon: XCircle, text: 'Yüz algılanamadı', color: 'text-destructive', spin: false },
    unstable: { icon: AlertTriangle, text: 'Başını sabit tut', color: 'text-neon-orange', spin: false },
  },
  tracking: {
    high: { icon: CheckCircle, text: 'Takip kalitesi yüksek ✅', color: 'text-secondary', spin: false },
    medium: { icon: CheckCircle, text: 'Takip kalitesi orta', color: 'text-neon-orange', spin: false },
    low: { icon: AlertTriangle, text: 'Takip kalitesi düşük', color: 'text-neon-orange', spin: false },
    none: { icon: XCircle, text: 'Takip yok', color: 'text-muted-foreground', spin: false },
  },
};

export function CompatibilityCheck({ state }: CompatibilityCheckProps) {
  const items = [
    { key: 'camera' as const, value: state.camera },
    { key: 'light' as const, value: state.light },
    { key: 'face' as const, value: state.face },
    { key: 'tracking' as const, value: state.tracking },
  ];

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const config = (statusConfig[item.key] as any)[item.value];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 glass-card px-4 py-2.5"
          >
            <Icon size={18} className={`${config.color} ${config.spin ? 'animate-spin' : ''}`} />
            <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
