import type { Job, ScheduleSettings, ScheduledStep } from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month! - 1 && parsed.getUTCDate() === day;
}

function toDate(value: string): Date {
  if (!isIsoDate(value)) throw new Error(`Invalid date: ${value}`);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day));
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isWorkingDay(value: string, settings: ScheduleSettings): boolean {
  const date = toDate(value);
  return settings.workdays.includes(date.getUTCDay()) && !settings.holidays.includes(value);
}

export function rollToWorkingDay(value: string, settings: ScheduleSettings): string {
  if (settings.workdays.length === 0) throw new Error('At least one working day is required.');
  let date = toDate(value);
  for (let guard = 0; guard < 370; guard += 1) {
    const iso = toIso(date);
    if (isWorkingDay(iso, settings)) return iso;
    date.setUTCDate(date.getUTCDate() + 1);
  }
  throw new Error('Could not find a working day. Check the holiday list.');
}

export function addWorkingDays(value: string, offset: number, settings: ScheduleSettings): string {
  let date = toDate(rollToWorkingDay(value, settings));
  let remaining = Math.max(0, Math.floor(offset));
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (isWorkingDay(toIso(date), settings)) remaining -= 1;
  }
  return toIso(date);
}

export function nextWorkingDay(value: string, settings: ScheduleSettings): string {
  const date = toDate(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return rollToWorkingDay(toIso(date), settings);
}

export function scheduleJob(job: Job, settings: ScheduleSettings): ScheduledStep[] {
  let baselineCursor = rollToWorkingDay(job.startDate, settings);
  let forecastCursor = baselineCursor;

  return job.steps.map((step) => {
    const duration = Math.max(1, Math.floor(step.duration));
    const baselineStart = baselineCursor;
    const baselineFinish = addWorkingDays(baselineStart, duration - 1, settings);
    const forecastStart = forecastCursor;
    const estimatedFinish = addWorkingDays(forecastStart, duration - 1, settings);
    const forecastFinish = step.actualFinish || estimatedFinish;

    baselineCursor = nextWorkingDay(baselineFinish, settings);
    forecastCursor = nextWorkingDay(forecastFinish, settings);

    return {
      ...step,
      duration,
      baselineStart,
      baselineFinish,
      forecastStart,
      forecastFinish,
      startMoved: forecastStart !== baselineStart,
      finishMoved: forecastFinish !== baselineFinish
    };
  });
}

export function formatDate(value: string, style: 'short' | 'long' = 'short'): string {
  const date = toDate(value);
  return new Intl.DateTimeFormat('en', style === 'long'
    ? { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }
    : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }
  ).format(date);
}

export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
