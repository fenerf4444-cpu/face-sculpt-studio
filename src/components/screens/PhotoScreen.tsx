import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uiIcons } from '@/assets/iconMap';

interface SavedPhoto {
  id: string;
  dataUrl: string;
  date: string;
  label: string;
}

export function PhotoScreen() {
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIdx, setCompareIdx] = useState<[number, number]>([0, 1]);
  const [sliderPos, setSliderPos] = useState(50);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOpen(true);
    } catch {
      alert('Kamera erisimi reddedildi.');
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const newPhoto: SavedPhoto = {
      id: Date.now().toString(),
      dataUrl,
      date: new Date().toLocaleDateString('tr-TR'),
      label: `Foto ${photos.length + 1}`,
    };
    setPhotos(prev => [newPhoto, ...prev]);
    closeCamera();
  }, [photos.length, closeCamera]);

  const deletePhoto = useCallback((id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  }, []);

  if (isCameraOpen) {
    return (
      <div className="relative h-[calc(100vh-4rem)] bg-background">
        <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted autoPlay />
        {/* Guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-72 border-2 border-dashed rounded-[40%] opacity-40" style={{ borderColor: 'hsl(160 75% 42%)' }} />
        </div>
        <div className="absolute top-4 inset-x-4 z-10">
          <div className="card-3d-elevated px-4 py-2 text-center">
            <p className="text-xs font-display text-muted-foreground">Yuzunu cerceve icine hizala, duz bak</p>
          </div>
        </div>
        <div className="absolute bottom-6 inset-x-4 z-10 flex gap-3">
          <button onClick={closeCamera} className="card-3d-elevated px-5 py-3 font-display text-sm font-bold text-muted-foreground">IPTAL</button>
          <button onClick={capturePhoto} className="flex-1 py-4 btn-3d-primary text-primary-foreground text-base font-display font-bold">CEK</button>
        </div>
      </div>
    );
  }

  if (compareMode && photos.length >= 2) {
    const left = photos[compareIdx[0]];
    const right = photos[compareIdx[1]];
    return (
      <div className="p-4 pb-24 space-y-4">
        <button onClick={() => setCompareMode(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display">← Geri</button>
        <h2 className="font-display text-xl font-bold text-foreground text-center">KARSILASTIR</h2>

        <div className="relative card-3d-elevated overflow-hidden rounded-2xl" style={{ height: 350 }}>
          <img src={right.dataUrl} alt="Sonra" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
            <img src={left.dataUrl} alt="Once" className="w-full h-full object-cover" />
          </div>
          <div className="absolute top-0 bottom-0" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
            <div className="w-0.5 h-full bg-primary" style={{ boxShadow: '0 0 8px hsl(350 85% 55% / 0.5)' }} />
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full btn-3d-primary flex items-center justify-center">
              <span className="text-xs text-primary-foreground font-bold">↔</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
          />
          <div className="absolute top-3 left-3 card-3d-inset px-2 py-1">
            <span className="text-[10px] font-display text-muted-foreground">{left.date}</span>
          </div>
          <div className="absolute top-3 right-3 card-3d-inset px-2 py-1">
            <span className="text-[10px] font-display text-muted-foreground">{right.date}</span>
          </div>
        </div>

        {/* Photo selector */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-display text-muted-foreground mb-1">ONCE</p>
            <div className="flex gap-1.5 overflow-x-auto">
              {photos.map((p, i) => (
                <button key={p.id} onClick={() => setCompareIdx([i, compareIdx[1]])}
                  className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 ${i === compareIdx[0] ? 'ring-2 ring-primary' : 'opacity-50'}`}>
                  <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-display text-muted-foreground mb-1">SONRA</p>
            <div className="flex gap-1.5 overflow-x-auto">
              {photos.map((p, i) => (
                <button key={p.id} onClick={() => setCompareIdx([compareIdx[0], i])}
                  className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 ${i === compareIdx[1] ? 'ring-2 ring-secondary' : 'opacity-50'}`}>
                  <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="text-center pt-6">
        <h1 className="font-display text-4xl font-bold text-gradient-primary tracking-tight">FOTO KIYAS</h1>
        <p className="text-muted-foreground text-sm mt-1">Haftalik ilerleme karsilastirmasi</p>
      </div>

      {/* Take photo */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-3d-elevated p-8 text-center glow-red">
        <div className="relative inline-block mb-5">
          <img src={uiIcons.camera} alt="Kamera" width={72} height={72} className="float-3d" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          {photos.length === 0 ? 'BAZ FOTOGRAF CEK' : 'YENI FOTOGRAF CEK'}
        </h3>
        <p className="text-xs text-muted-foreground mb-5 leading-relaxed max-w-xs mx-auto">
          {photos.length === 0
            ? 'Ilk fotografini cekerek karsilastirma surecini baslat.'
            : `${photos.length} fotograf kayitli. Yeni bir fotograf ekle.`}
        </p>
        <button onClick={openCamera} className="px-8 py-3 btn-3d-primary text-primary-foreground text-sm">FOTOGRAF CEK</button>
      </motion.div>

      {/* Compare button */}
      {photos.length >= 2 && (
        <button onClick={() => setCompareMode(true)} className="w-full py-3 btn-3d-success text-secondary-foreground text-sm font-display font-bold">
          KARSILASTIR ({photos.length} foto)
        </button>
      )}

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div className="card-3d p-4">
          <h3 className="font-display text-sm font-bold text-foreground mb-3">KAYITLI FOTOGRAFLAR</h3>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative card-3d-inset rounded-xl overflow-hidden aspect-[3/4]">
                <img src={photo.dataUrl} alt={photo.label} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 p-1.5" style={{ background: 'linear-gradient(transparent, hsl(0 0% 0% / 0.7))' }}>
                  <p className="text-[9px] text-primary-foreground font-display">{photo.date}</p>
                </div>
                <button
                  onClick={() => deletePhoto(photo.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center text-[10px] text-primary-foreground"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <motion.div key={item.step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl btn-3d-primary flex items-center justify-center shrink-0">
                <span className="font-display text-sm font-bold text-primary-foreground">{item.step}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="card-3d-inset p-3">
        <p className="text-[10px] text-muted-foreground text-center font-display">
          FOTOGRAFLAR CIHAZINDA YEREL OLARAK SAKLANIR. BULUT SENKRON ISTEGE BAGLIDIR.
        </p>
      </div>
    </div>
  );
}
