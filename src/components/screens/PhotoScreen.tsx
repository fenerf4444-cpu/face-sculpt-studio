import { uiIcons } from '@/assets/iconMap';
import { motion } from 'framer-motion';

export function PhotoScreen() {
  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="text-center pt-6">
        <h1 className="font-display text-4xl font-bold text-gradient-primary tracking-tight">FOTO KIYAS</h1>
        <p className="text-muted-foreground text-sm mt-1">Haftalik ilerleme karsilastirmasi</p>
      </div>

      {/* Take base photo */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-3d-elevated p-8 text-center glow-red">
        <div className="relative inline-block mb-5">
          <img src={uiIcons.camera} alt="Kamera" width={72} height={72} className="float-3d" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2">BAZ FOTOGRAF CEK</h3>
        <p className="text-xs text-muted-foreground mb-5 leading-relaxed max-w-xs mx-auto">
          Ilk fotografini cekerek karsilastirma surecini baslat. Rehber sana dogru aci ve isigi gosterecek.
        </p>
        <button className="px-8 py-3 btn-3d-primary text-primary-foreground text-sm">FOTOGRAF CEK</button>
      </motion.div>

      {/* How it works */}
      <div className="card-3d p-5">
        <h3 className="font-display text-sm font-bold text-foreground mb-4">NASIL CALISIR</h3>
        <div className="space-y-4">
          {[
            { step: '1', text: 'Ilk gun baz fotografini cek' },
            { step: '2', text: 'Haftalik ayni acida tekrar cek' },
            { step: '3', text: 'Slider ile karsilastir' },
            { step: '4', text: 'Tutarlilik skorunu takip et' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-xl btn-3d-primary flex items-center justify-center shrink-0">
                <span className="font-display text-sm font-bold text-primary-foreground">{item.step}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Metrics preview */}
      <div className="card-3d p-4">
        <h3 className="font-display text-sm font-bold text-foreground mb-3">KIYAS METRIKLERI</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Poz Eslesmesi', value: '-', suffix: '' },
            { label: 'Tutarlilik', value: '-', suffix: '' },
            { label: 'Antrenman Gunu', value: '0/7', suffix: '' },
            { label: 'Toplam Tutus', value: '0 dk', suffix: '' },
          ].map((m) => (
            <div key={m.label} className="card-3d-inset p-3 text-center">
              <p className="text-[10px] text-muted-foreground font-display">{m.label.toUpperCase()}</p>
              <p className="font-display text-lg font-bold text-foreground mt-1">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      <div className="card-3d-inset p-3">
        <p className="text-[10px] text-muted-foreground text-center font-display">
          FOTOGRAFLAR VARSAYILAN OLARAK CIHAZINDA SIFRELENMIS OLARAK SAKLANIR. BULUT SENKRON ISTEGE BAGLIDIR.
        </p>
      </div>
    </div>
  );
}
