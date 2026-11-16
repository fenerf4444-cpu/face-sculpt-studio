import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelSpeech, getVoiceEnabled, normalizeTurkishCue, selectTurkishVoice, setVoiceEnabled, speakCorrectiveHint, speakCountdown } from './voice-guidance';

const turkish = { lang: 'tr-TR', voiceURI: 'Turkish Natural', localService: false } as SpeechSynthesisVoice;
const english = { lang: 'en-US', voiceURI: 'English', localService: true } as SpeechSynthesisVoice;

describe('Turkish coaching', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} });
    vi.stubGlobal('speechSynthesis', { getVoices: () => [english, turkish], speak: vi.fn(), cancel: vi.fn(), speaking: false });
    cancelSpeech();
  });
  it('selects Turkish and does not fall back to an English voice', () => {
    expect(selectTurkishVoice([english, turkish])).toBe(turkish);
    expect(selectTurkishVoice([english])).toBeUndefined();
  });
  it('persists disabled coaching and prevents speech', () => {
    setVoiceEnabled(false);
    expect(getVoiceEnabled()).toBe(false);
    speakCountdown(5);
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  });
  it('does not interrupt an ongoing cue with a correction', () => {
    Object.defineProperty(window.speechSynthesis, 'speaking', { value: true, configurable: true });
    speakCorrectiveHint('Agzini daha fazla ac');
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  });
  it('restores Turkish characters for pronunciation', () => {
    expect(normalizeTurkishCue('Agzini ac, yanaklari iceri cek')).toBe('ağzını aç, yanaklari içeri çek');
  });
});