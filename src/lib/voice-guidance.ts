// Device speech: do not fall back to a non-Turkish voice or overlap cues.
let lastSpoken = '';
let lastSpeakTime = 0;
let encouragementIndex = 0;
const MIN_INTERVAL = 6500;

export function getVoiceEnabled() {
  return localStorage.getItem('facegym-voice') !== 'off';
}

export function setVoiceEnabled(enabled: boolean) {
  localStorage.setItem('facegym-voice', enabled ? 'on' : 'off');
  if (!enabled) cancelSpeech();
}

export function selectTurkishVoice(voices: SpeechSynthesisVoice[]) {
  return voices.filter(v => v.lang.toLowerCase().startsWith('tr'))
    .sort((a, b) => Number(b.voiceURI.toLowerCase().includes('natural')) - Number(a.voiceURI.toLowerCase().includes('natural')) || Number(!b.localService) - Number(!a.localService))[0];
}

export function normalizeTurkishCue(text: string) {
  const words: Record<string, string> = {
    agzini: 'ağzını', agzi: 'ağzı', ac: 'aç', daha: 'daha', gozlerini: 'gözlerini', goz: 'göz',
    yuzunu: 'yüzünü', yuz: 'yüz', yuzu: 'yüzü', balik: 'balık', buyuk: 'büyük',
    gulumseme: 'gülümseme', gulumsle: 'gülümse', kaslarini: 'kaşlarını', kas: 'kaş',
    ceneni: 'çeneni', cene: 'çene', kaldirma: 'kaldırma', iceri: 'içeri', cek: 'çek',
    disa: 'dışa', dogru: 'doğru', saga: 'sağa', sola: 'sola', dudaklarini: 'dudaklarını',
    buz: 'büz', sisir: 'şişir', sisirme: 'şişirme', alin: 'alın', 'saskin': 'şaşkın',
  };
  return text.replace(/[A-Za-z]+/g, word => words[word.toLowerCase()] || word);
}

function speak(text: string, priority = false) {
  if (!getVoiceEnabled() || !('speechSynthesis' in window)) return;
  const voice = selectTurkishVoice(window.speechSynthesis.getVoices());
  if (!voice) return; // Incorrect-language pronunciation is worse than silence.
  const now = Date.now();
  if (!priority && (window.speechSynthesis.speaking || now - lastSpeakTime < MIN_INTERVAL)) return;
  if (!priority && text === lastSpoken && now - lastSpeakTime < 18000) return;
  if (priority) window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(normalizeTurkishCue(text));
  utterance.voice = voice;
  utterance.lang = 'tr-TR';
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.volume = 0.85;
  window.speechSynthesis.speak(utterance);
  lastSpoken = text;
  lastSpeakTime = now;
}

export function speakCountdown(seconds: number) {
  if (seconds === 10) speak('Son on saniye.', true);
  else if (seconds === 5) speak('Son beş saniye. Nefesini tutma.', true);
}

export function speakExerciseStart(exerciseName: string, set: number, totalSets: number) {
  speak(`${exerciseName}. ${totalSets} setin ${set}. seti. Nazikçe başla.`, true);
}
export function speakRest(nextName?: string) {
  speak(nextName ? `Yüzünü gevşet. Sıradaki hareket: ${nextName}.` : 'Yüzünü gevşet. Rahatça nefes al.', true);
}
export function speakCorrectiveHint(hintTr: string | null) {
  if (hintTr) speak(hintTr);
}
export function speakEncouragement() {
  const phrases = ['İyi gidiyorsun. Nefes almaya devam et.', 'Hareketi nazikçe koru.', 'Güzel. Omuzlarını rahat bırak.'];
  speak(phrases[encouragementIndex++ % phrases.length]);
}
export function speakSessionEnd() {
  speak('Antrenman tamamlandı. Şimdi yüzünü gevşet. Tebrikler.', true);
}
export function cancelSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  lastSpoken = '';
  lastSpeakTime = 0;
}
