import { describe, expect, it } from 'vitest';
import { toTrainingRequest, type PersonalSession } from './personal-session';

const session: PersonalSession = { title: 'Yanak kontrolü', summary: 'Kontrollü çalışma', safetyNote: 'Ağrı olursa bırak.', items: [{ exerciseId: 'fish-face', rationale: 'Yanak kontrolü', coachingTip: 'Çeneyi gevşek tut.' }] };
describe('Personal camera sessions', () => {
  it('uses three 30-second sets', () => {
    const result = toTrainingRequest(session);
    expect(result.exercises[0].reps).toBe(3);
    expect(result.exercises[0].holdDurationSec).toBe(30);
  });
  it('rejects invented exercises rather than creating demo output', () => {
    expect(() => toTrainingRequest({ ...session, items: [{ ...session.items[0], exerciseId: 'invented-move' }] })).toThrow();
  });
  it('does not claim camera verification of hand-assisted exercises', () => {
    expect(() => toTrainingRequest({ ...session, items: [{ ...session.items[0], exerciseId: 'under-eye-press' }] })).toThrow();
  });
});