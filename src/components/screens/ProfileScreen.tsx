import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uiIcons } from '@/assets/iconMap';

export function ProfileScreen() {
  const [username, setUsername] = useState(() => localStorage.getItem('facegym-name') || 'Anonim Kullanici');
  const [editingName, setEditingName] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [morningTime, setMorningTime] = useState(() => localStorage.getItem('facegym-morning') || '08:00');
  const [eveningTime, setEveningTime] = useState(() => localStorage.getItem('facegym-evening') || '20:00');
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('facegym-name', username); }, [username]);
  useEffect(() => { localStorage.setItem('facegym-morning', morningTime); }, [morningTime]);
  useEffect(() => { localStorage.setItem('facegym-evening', eveningTime); }, [eveningTime]);

  const toggleSection = (id: string) => setOpenSection(prev => prev === id ? null : id);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotificationsOn(true);
      scheduleNotifications();
    }
  }, []);

  const scheduleNotifications = useCallback(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    // Schedule a test notification
    new Notification('FaceGym Hatirlatma', {
      body: 'Yuz yogasi antrenman zamanin geldi!',
      icon: '/placeholder.svg',
      tag: 'facegym-reminder',
    });
  }, []);

  const handleNotificationToggle = useCallback(() => {
    if (!notificationsOn) {
      requestNotificationPermission();
    } else {
      setNotificationsOn(false);
    }
  }, [notificationsOn, requestNotificationPermission]);

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="text-center pt-6">
        <div className="w-24 h-24 rounded-2xl card-3d-elevated mx-auto mb-4 flex items-center justify-center glow-red overflow-hidden">
          <img src={uiIcons.trophy} alt="Profil" width={52} height={52} className="object-contain float-3d" />
        </div>
        {editingName ? (
          <div className="flex items-center gap-2 justify-center">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="bg-transparent text-center font-display text-xl font-bold text-foreground border-b border-primary outline-none" autoFocus
              onBlur={() => setEditingName(false)} onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)} />
          </div>
        ) : (
          <button onClick={() => setEditingName(true)}>
            <h1 className="font-display text-xl font-bold text-foreground">{username}</h1>
            <p className="text-xs text-muted-foreground mt-1">Isme dokun ve degistir</p>
          </button>
        )}
      </div>

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

      <div className="space-y-1.5">
        {/* Notifications */}
        <button onClick={() => toggleSection('notifications')} className="w-full card-3d p-4 flex items-center gap-3 text-left">
          <div className="w-2 h-2 rounded-full bg-neon-pink" style={{ boxShadow: '0 0 6px hsl(330 85% 58%)' }} />
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-neon-pink">Bildirimler</p>
            <p className="text-[10px] text-muted-foreground">Sabah ve aksam hatirlatma</p>
          </div>
          <div className="w-6 h-6 rounded card-3d-inset flex items-center justify-center">
            <span className="text-muted-foreground text-[10px]">{openSection === 'notifications' ? '−' : '›'}</span>
          </div>
        </button>
        <AnimatePresence>
          {openSection === 'notifications' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="card-3d-inset p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Bildirimleri ac</span>
                  <button onClick={handleNotificationToggle}
                    className={`w-12 h-6 rounded-full transition-all ${notificationsOn ? 'bg-secondary' : 'bg-muted'}`}>
                    <div className={`w-5 h-5 rounded-full bg-primary-foreground transition-transform ${notificationsOn ? 'translate-x-6' : 'translate-x-0.5'}`}
                      style={{ boxShadow: '0 1px 3px hsl(0 0% 0% / 0.3)' }} />
                  </button>
                </div>
                {notificationsOn && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sabah saati</span>
                      <input type="time" value={morningTime} onChange={(e) => setMorningTime(e.target.value)}
                        className="bg-transparent font-display text-sm text-foreground border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Aksam saati</span>
                      <input type="time" value={eveningTime} onChange={(e) => setEveningTime(e.target.value)}
                        className="bg-transparent font-display text-sm text-foreground border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary" />
                    </div>
                    <button onClick={scheduleNotifications}
                      className="w-full py-2 btn-3d-primary text-primary-foreground text-xs">
                      TEST BILDIRIMI GONDER
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sound */}
        <button onClick={() => toggleSection('sound')} className="w-full card-3d p-4 flex items-center gap-3 text-left">
          <div className="w-2 h-2 rounded-full bg-neon-cyan" style={{ boxShadow: '0 0 6px hsl(185 80% 50%)' }} />
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-neon-cyan">Ses & Ritim</p>
            <p className="text-[10px] text-muted-foreground">Muzik ve ses efektleri</p>
          </div>
          <div className="w-6 h-6 rounded card-3d-inset flex items-center justify-center">
            <span className="text-muted-foreground text-[10px]">{openSection === 'sound' ? '−' : '›'}</span>
          </div>
        </button>
        <AnimatePresence>
          {openSection === 'sound' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="card-3d-inset p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ses efektleri</span>
                <button onClick={() => setSoundOn(!soundOn)}
                  className={`w-12 h-6 rounded-full transition-all ${soundOn ? 'bg-secondary' : 'bg-muted'}`}>
                  <div className={`w-5 h-5 rounded-full bg-primary-foreground transition-transform ${soundOn ? 'translate-x-6' : 'translate-x-0.5'}`}
                    style={{ boxShadow: '0 1px 3px hsl(0 0% 0% / 0.3)' }} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera */}
        <button onClick={() => toggleSection('camera')} className="w-full card-3d p-4 flex items-center gap-3 text-left">
          <div className="w-2 h-2 rounded-full bg-neon-green" style={{ boxShadow: '0 0 6px hsl(160 75% 42%)' }} />
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-neon-green">Kamera Ayarlari</p>
            <p className="text-[10px] text-muted-foreground">Performans ve kalite</p>
          </div>
          <div className="w-6 h-6 rounded card-3d-inset flex items-center justify-center">
            <span className="text-muted-foreground text-[10px]">{openSection === 'camera' ? '−' : '›'}</span>
          </div>
        </button>
        <AnimatePresence>
          {openSection === 'camera' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="card-3d-inset p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Algilama hizi</span>
                  <span className="text-xs font-display text-foreground">~12 FPS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kamera cozunurluk</span>
                  <span className="text-xs font-display text-foreground">640x480</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy */}
        <button onClick={() => toggleSection('privacy')} className="w-full card-3d p-4 flex items-center gap-3 text-left">
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-muted-foreground">Gizlilik</p>
            <p className="text-[10px] text-muted-foreground">Veri yonetimi</p>
          </div>
          <div className="w-6 h-6 rounded card-3d-inset flex items-center justify-center">
            <span className="text-muted-foreground text-[10px]">{openSection === 'privacy' ? '−' : '›'}</span>
          </div>
        </button>
        <AnimatePresence>
          {openSection === 'privacy' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="card-3d-inset p-4 space-y-2">
                <p className="text-xs text-muted-foreground">Tum veriler yerel olarak cihazinda saklanir.</p>
                <p className="text-xs text-muted-foreground">Kamera verileri islenip atilir, kaydedilmez.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-[10px] text-muted-foreground font-display">FACEGYM v1.0</p>
    </div>
  );
}
