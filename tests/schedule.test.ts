import { describe, expect, it } from 'vitest';
import { addWorkingDays, isIsoDate, nextWorkingDay, rollToWorkingDay, scheduleJob } from '../src/schedule';
import type { Job, ScheduleSettings } from '../src/types';

const settings: ScheduleSettings = { timezone: 'Europe/London', workdays: [1, 2, 3, 4, 5], holidays: ['2026-09-07'] };

function job(actuals: Array<string | undefined> = []): Job {
  return {
    id: 'job', name: 'Kitchen fit', client: 'A. Patel', startDate: '2026-09-03', status: 'active', createdAt: '', updatedAt: '', history: [],
    steps: [
      { id: 'a', name: 'Strip out', duration: 2, actualFinish: actuals[0] },
      { id: 'b', name: 'Rough-in', duration: 3, actualFinish: actuals[1] },
      { id: 'c', name: 'Fit cabinets', duration: 2, actualFinish: actuals[2] }
    ]
  };
}

describe('working calendar', () => {
  it('rejects impossible calendar dates', () => {
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-09-30')).toBe(true);
  });

  it('rolls weekends and configured holidays forward', () => {
    expect(rollToWorkingDay('2026-09-05', settings)).toBe('2026-09-08');
  });

  it('adds inclusive working durations', () => {
    expect(addWorkingDays('2026-09-03', 2, settings)).toBe('2026-09-08');
  });

  it('finds the next working day', () => {
    expect(nextWorkingDay('2026-09-04', settings)).toBe('2026-09-08');
  });
});

describe('seeded finish-to-start sequences', () => {
  it('keeps baseline dates when actuals match', () => {
    const result = scheduleJob(job(['2026-09-04']), settings);
    expect(result.map((step) => [step.forecastStart, step.forecastFinish])).toEqual([
      ['2026-09-03', '2026-09-04'],
      ['2026-09-08', '2026-09-10'],
      ['2026-09-11', '2026-09-14']
    ]);
  });

  it('moves every downstream date from a late actual', () => {
    const result = scheduleJob(job(['2026-09-09']), settings);
    expect(result[1]?.forecastStart).toBe('2026-09-10');
    expect(result[1]?.forecastFinish).toBe('2026-09-14');
    expect(result[2]?.forecastStart).toBe('2026-09-15');
    expect(result[2]?.forecastFinish).toBe('2026-09-16');
  });

  it('pulls downstream work forward after an early actual', () => {
    const result = scheduleJob(job(['2026-09-03']), settings);
    expect(result[1]?.forecastStart).toBe('2026-09-04');
    expect(result[1]?.forecastFinish).toBe('2026-09-09');
  });

  it('uses each subsequent actual as the new source of truth', () => {
    const result = scheduleJob(job(['2026-09-09', '2026-09-18']), settings);
    expect(result[2]?.forecastStart).toBe('2026-09-21');
    expect(result[2]?.forecastFinish).toBe('2026-09-22');
  });

  it('allows a real finish on a non-working day and resumes next workday', () => {
    const result = scheduleJob(job(['2026-09-05']), settings);
    expect(result[0]?.forecastFinish).toBe('2026-09-05');
    expect(result[1]?.forecastStart).toBe('2026-09-08');
  });

  it('marks downstream forecasts as moved without mislabeling unchanged starts', () => {
    const result = scheduleJob(job(['2026-09-09']), settings);
    expect(result[0]?.startMoved).toBe(false);
    expect(result[1]?.startMoved).toBe(true);
    expect(result[2]?.finishMoved).toBe(true);
  });
});
