// Real session persistence layer - all progress data comes from actual completed trainings
// Stored locally on device (localStorage), no mock/demo data anywhere.

export interface SessionRecord {
  id: string;
  date: string; // ISO string
  mode: string;
  modeName: string;
  score: number;
  xp: number;
  accuracy: number; // 0-100
  durationSec: number;
  symmetry: number; // 0-100
  zoneSeconds: Record<string, number>;
  exercisesCompleted: number;
  bestCombo: number;
}

const SESSIONS_KEY = 'facegym-sessions';
const PROGRAMS_KEY = 'facegym-program-progress';
const ACTIVE_PROGRAM_KEY = 'facegym-active-program';

export function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(rec: Omit<SessionRecord, 'id'>): SessionRecord {
  const sessions = loadSessions();
  const record: SessionRecord = { ...rec, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  sessions.push(record);
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {}
  return record;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getTodaySessionCount(sessions: SessionRecord[]): number {
  const today = dayKey(new Date());
  return sessions.filter(s => dayKey(new Date(s.date)) === today).length;
}

export function getStreak(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;
  const days = new Set(sessions.map(s => dayKey(new Date(s.date))));
  let streak = 0;
  const cursor = new Date();
  // Today counts if trained; otherwise start from yesterday
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface TotalStats {
  totalSessions: number;
  totalXP: number;
  totalMinutes: number;
  avgAccuracy: number;
  avgSymmetry: number;
  bestCombo: number;
}

export function getTotalStats(sessions: SessionRecord[]): TotalStats {
  if (sessions.length === 0) {
    return { totalSessions: 0, totalXP: 0, totalMinutes: 0, avgAccuracy: 0, avgSymmetry: 0, bestCombo: 0 };
  }
  const totalXP = sessions.reduce((a, s) => a + s.xp, 0);
  const totalSec = sessions.reduce((a, s) => a + s.durationSec, 0);
  const avgAccuracy = sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length;
  const avgSymmetry = sessions.reduce((a, s) => a + s.symmetry, 0) / sessions.length;
  const bestCombo = Math.max(...sessions.map(s => s.bestCombo));
  return {
    totalSessions: sessions.length,
    totalXP,
    totalMinutes: Math.round(totalSec / 60),
    avgAccuracy: Math.round(avgAccuracy),
    avgSymmetry: Math.round(avgSymmetry),
    bestCombo,
  };
}

const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt'];

export interface DayDatum {
  day: string;
  xp: number;
  accuracy: number;
  trained: boolean;
}

// Last 7 days ending today, oldest first
export function getWeeklyData(sessions: SessionRecord[]): DayDatum[] {
  const result: DayDatum[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const daySessions = sessions.filter(s => dayKey(new Date(s.date)) === key);
    result.push({
      day: TR_DAYS[d.getDay()],
      xp: daySessions.reduce((a, s) => a + s.xp, 0),
      accuracy: daySessions.length > 0
        ? Math.round(daySessions.reduce((a, s) => a + s.accuracy, 0) / daySessions.length)
        : 0,
      trained: daySessions.length > 0,
    });
  }
  return result;
}

export interface ZoneStat {
  zone: string;
  zoneTr: string;
  mins: number;
  score: number;
}

const ZONE_TR: Record<string, string> = {
  forehead: 'Alin',
  eyes: 'Goz',
  cheeks: 'Yanak',
  lips: 'Dudak',
  jaw: 'Cene',
  neck: 'Boyun',
};

export function getZoneStats(sessions: SessionRecord[]): ZoneStat[] {
  const zoneSecs: Record<string, number> = {};
  const zoneAcc: Record<string, { sum: number; count: number }> = {};

  for (const s of sessions) {
    for (const [zone, secs] of Object.entries(s.zoneSeconds)) {
      zoneSecs[zone] = (zoneSecs[zone] || 0) + secs;
      if (!zoneAcc[zone]) zoneAcc[zone] = { sum: 0, count: 0 };
      zoneAcc[zone].sum += s.accuracy;
      zoneAcc[zone].count += 1;
    }
  }

  return Object.entries(zoneSecs)
    .map(([zone, secs]) => ({
      zone,
      zoneTr: ZONE_TR[zone] || zone,
      mins: Math.round(secs / 60),
      score: zoneAcc[zone] ? Math.round(zoneAcc[zone].sum / zoneAcc[zone].count) : 0,
    }))
    .sort((a, b) => b.mins - a.mins);
}

export interface SymmetryPoint {
  label: string;
  value: number;
}

// Symmetry trend over the last 10 sessions
export function getSymmetryHistory(sessions: SessionRecord[]): SymmetryPoint[] {
  return sessions.slice(-10).map((s, i) => ({
    label: `${i + 1}`,
    value: Math.round(s.symmetry),
  }));
}

// ---- Program progress persistence ----

export function getProgramProgress(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PROGRAMS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setProgramDay(programId: string, day: number): void {
  const progress = getProgramProgress();
  progress[programId] = day;
  try {
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(progress));
  } catch {}
}

export function getActiveProgramId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROGRAM_KEY);
  } catch {
    return null;
  }
}

export function setActiveProgramId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_PROGRAM_KEY, id);
    else localStorage.removeItem(ACTIVE_PROGRAM_KEY);
  } catch {}
}
