import { Camera, Image, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function PhotoScreen() {
  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="text-center pt-4">
        <h1 className="font-display text-2xl font-black text-gradient-primary">FOTO KIYAS</h1>
        <p className="text-muted-foreground text-sm mt-1">Haftalık ilerleme karşılaştırması</p>
      </div>

      {/* Take base photo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center neon-glow-red"
      >
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
          <Camera size={32} className="text-primary-foreground" />
        </div>
        <h3 className="font-display text-sm font-bold text-foreground mb-2">BAZ FOTOĞRAF ÇEK</h3>
        <p className="text-xs text-muted-foreground mb-4">
          İlk fotoğrafını çekerek karşılaştırma sürecini başlat. Rehber sana doğru açı ve ışığı gösterecek.
        </p>
        <button className="px-6 py-2.5 rounded-xl gradient-primary font-display text-xs font-bold text-primary-foreground">
          FOTOĞRAF ÇEK 📸
        </button>
      </motion.div>

      {/* How it works */}
      <div className="glass-card p-4">
        <h3 className="font-display text-xs font-bold text-foreground mb-3">NASIL ÇALIŞIR</h3>
        <div className="space-y-3">
          {[
            { step: '1', text: 'İlk gün baz fotoğrafını çek' },
            { step: '2', text: 'Haftalık aynı açıda tekrar çek' },
            { step: '3', text: 'Slider ile karşılaştır' },
            { step: '4', text: 'Tutarlılık skorunu takip et' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <span className="font-display text-xs font-bold text-primary-foreground">{item.step}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      <div className="glass-card p-3 border-secondary/30">
        <p className="text-xs text-muted-foreground text-center">
          🔒 Fotoğraflar varsayılan olarak cihazında şifrelenmiş olarak saklanır. Bulut senkron isteğe bağlıdır.
        </p>
      </div>
    </div>
  );
}
