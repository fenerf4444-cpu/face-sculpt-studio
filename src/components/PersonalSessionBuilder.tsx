import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Loader2, Sparkles, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toTrainingRequest, type PersonalSession } from '@/lib/personal-session';
import { EXERCISES } from '@/data/exercises';
import type { TrainingRequest } from '@/lib/training-request';

export function PersonalSessionBuilder({ onClose, onStart }: { onClose: () => void; onStart: (request: TrainingRequest) => void }) {
  const [goal, setGoal] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [minutes, setMinutes] = useState(5);
  const [safe, setSafe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<PersonalSession | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setError(''); setSession(null); setBusy(true);
    const abort = new AbortController(); controller.current = abort;
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/personal-session`, {
        method: 'POST', signal: abort.signal,
        headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) },
        body: JSON.stringify({ goal, difficulties, minutes, hasPain: !safe }),
      });
      if (!response.ok) { const body = await response.json(); throw new Error(body.message || 'Seans oluşturulamadı.'); }
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Seans yanıtı alınamadı.');
      const decoder = new TextDecoder(); let pending = ''; let received = false;
      while (true) {
        const chunk = await reader.read();
        pending += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = pending.split('\n'); pending = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === 'error') throw new Error(event.message);
          if (event.type === 'result') { toTrainingRequest(event.session); setSession(event.session); received = true; }
        }
        if (chunk.done) break;
      }
      if (!received) throw new Error('Seans tamamlanamadı; örnek içerik gösterilmiyor.');
    } catch (e) {
      if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Seans oluşturulamadı.');
    } finally { setBusy(false); controller.current = null; }
  }

  return <div className="app-screen space-y-6">
    <Button variant="ghost" onClick={onClose}><ArrowLeft /> Geri</Button>
    <header><p className="text-xs text-primary flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4" /> Lovable AI</p><h1>Sana özel seans</h1><p className="text-sm text-muted-foreground mt-2">Bugünkü hedefin, senin tempon.</p></header>
    <form onSubmit={generate} className="space-y-5">
      <label className="block text-sm font-semibold">Hedefin<textarea required maxLength={500} value={goal} onChange={e => setGoal(e.target.value)} placeholder="Örneğin yanak hareketlerini daha kontrollü yapmak" className="mt-2 w-full min-h-24 rounded-lg border bg-card p-3 font-normal text-foreground" disabled={busy} /></label>
      <label className="block text-sm font-semibold">Zorlandığın hareketler<textarea maxLength={500} value={difficulties} onChange={e => setDifficulties(e.target.value)} placeholder="Örneğin yanakları içeri çekerken çenemi sıkıyorum" className="mt-2 w-full min-h-20 rounded-lg border bg-card p-3 font-normal text-foreground" disabled={busy} /></label>
      <fieldset><legend className="text-sm font-semibold mb-2">Ayırabileceğin süre</legend><div className="flex gap-2">{[5, 8, 10].map(n => <Button type="button" disabled={busy} key={n} variant={minutes === n ? 'default' : 'outline'} aria-pressed={minutes === n} onClick={() => setMinutes(n)} className="flex-1">{n} dakika</Button>)}</div></fieldset>
      <label className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground"><input type="checkbox" checked={safe} onChange={e => setSafe(e.target.checked)} disabled={busy} className="mt-1" />Yüz/çene ağrım, yakın zamanda yüz bölgemde işlem veya antrenmana engel bir rahatsızlığım yok. Ağrı olursa bırakacağım.</label>
      <p className="text-xs text-muted-foreground">Yüz yogasının estetik etkileri için kanıtlar sınırlıdır; bu seans tedavi değildir. Yüz görüntün paylaşılmaz. Seans oluşturma Lovable AI kredisi kullanır.</p>
      {busy ? <Button type="button" variant="outline" className="w-full" onClick={() => controller.current?.abort()}><Loader2 className="animate-spin" /> Oluşturuluyor <Square /> Durdur</Button> : <Button type="submit" disabled={!goal.trim() || !safe} className="w-full"><Sparkles /> Seans oluştur</Button>}
    </form>
    {error && <p role="alert" className="text-sm text-destructive break-words">{error}</p>}
    {session && <section className="space-y-4 border-t pt-5">
      <h2 className="text-lg font-bold">{session.title}</h2><p className="text-sm text-muted-foreground">{session.summary}</p>
      <p className="text-xs text-primary">{session.items.length} hareket · Her hareket 3 × 30 sn</p>
      {session.items.map((item, i) => <article key={item.exerciseId} className="border-b pb-4"><h3 className="text-sm">{i + 1}. {EXERCISES.find(e => e.id === item.exerciseId)?.nameTr}</h3><p className="text-xs text-muted-foreground mt-2">{item.rationale}</p><p className="text-sm mt-2">{item.coachingTip}</p></article>)}
      <p className="text-xs text-muted-foreground">{session.safetyNote}</p>
      <Button className="w-full" onClick={() => onStart(toTrainingRequest(session))}><Camera /> Hareketleri incele ve başla</Button>
    </section>}
  </div>;
}