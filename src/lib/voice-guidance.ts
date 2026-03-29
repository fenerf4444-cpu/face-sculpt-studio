// Turkish voice guidance using Web Speech API

let lastSpoken = '';
let lastSpeakTime = 0;
const MIN_INTERVAL = 3500; // minimum ms between voice cues

function speak(text: string, force = false) {
  if (!('speechSynthesis' in window)) return;
  
  const now = Date.now();
  if (!force && text === lastSpoken && now - lastSpeakTime < MIN_INTERVAL * 2) return;
  if (!force && now - lastSpeakTime < MIN_INTERVAL) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'tr-TR';
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;

  // Try Turkish voice
  const voices = window.speechSynthesis.getVoices();
  const trVoice = voices.find(v => v.lang.startsWith('tr'));
  if (trVoice) utterance.voice = trVoice;

  window.speechSynthesis.speak(utterance);
  lastSpoken = text;
  lastSpeakTime = now;
}

export function speakCountdown(seconds: number) {
  if (seconds === 10) speak('Son on saniye!', true);
  else if (seconds === 5) speak('Son bes saniye!', true);
  else if (seconds === 3) speak('Uc!', true);
  else if (seconds === 2) speak('Iki!', true);
  else if (seconds === 1) speak('Bir!', true);
}

export function speakExerciseStart(exerciseName: string, set: number, totalSets: number) {
  speak(`${exerciseName}. Set ${set}, ${totalSets}.`, true);
}

export function speakRest(nextName?: string) {
  speak(nextName ? `Nefes al. Sonraki: ${nextName}` : 'Nefes al, dinlen.', true);
}

export function speakCorrectiveHint(hintTr: string | null) {
  if (!hintTr) return;
  speak(hintTr);
}

export function speakEncouragement() {
  const phrases = [
    'Harika devam et!',
    'Cok iyi gidiyorsun!',
    'Mukemmel, boyle devam!',
    'Aferin, tutmaya devam!',
    'Super! Biraz daha!',
  ];
  speak(phrases[Math.floor(Math.random() * phrases.length)]);
}

export function speakSessionEnd() {
  speak('Tebrikler! Antrenman tamamlandi!', true);
}

export function cancelSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
