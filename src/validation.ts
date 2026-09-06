import { actualOrderError } from './schedule';
import type { AppData, Job } from './types';

export type DataValidation = { valid: true; data: AppData } | { valid: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isText(value: unknown, maximum: number, allowEmpty = false): value is string {
  return typeof value === 'string' && value.length <= maximum && (allowEmpty || value.trim().length > 0);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month! - 1 && parsed.getUTCDate() === day;
}

function isIsoInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { return new Date(value).toISOString() === value; } catch { return false; }
}

function invalid(reason: string): DataValidation {
  return { valid: false, error: `This backup cannot be imported: ${reason} Your current jobs were not changed.` };
}

export function validateAppData(value: unknown): DataValidation {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.jobs) || !isRecord(value.settings)) {
    return invalid('it is not a version 1 Actuals Job Sequencer backup.');
  }

  const { settings } = value;
  if (!isText(settings.timezone, 100)) return invalid('the timezone is missing.');
  try { new Intl.DateTimeFormat('en', { timeZone: settings.timezone }).format(); } catch { return invalid('the timezone is not valid.'); }
  if (!Array.isArray(settings.workdays) || settings.workdays.length === 0 || !settings.workdays.every((day) => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6) || new Set(settings.workdays).size !== settings.workdays.length) {
    return invalid('working days must contain one or more unique weekdays.');
  }
  if (!Array.isArray(settings.holidays) || !settings.holidays.every(isIsoDate) || new Set(settings.holidays).size !== settings.holidays.length) {
    return invalid('non-working dates must be unique YYYY-MM-DD dates.');
  }

  const ids = new Set<string>();
  const claimId = (id: unknown): boolean => {
    if (!isText(id, 200) || ids.has(id)) return false;
    ids.add(id);
    return true;
  };

  for (const [jobIndex, candidate] of value.jobs.entries()) {
    const label = `job ${jobIndex + 1}`;
    if (!isRecord(candidate)) return invalid(`${label} is incomplete.`);
    if (!claimId(candidate.id)) return invalid(`${label} has a missing or duplicate ID.`);
    if (!isText(candidate.name, 80)) return invalid(`${label} needs a name of 80 characters or fewer.`);
    if (!isText(candidate.client, 80, true)) return invalid(`${label} has an invalid client name.`);
    if (!isIsoDate(candidate.startDate)) return invalid(`${label} has an invalid first forecast date.`);
    if (candidate.status !== 'active' && candidate.status !== 'archived') return invalid(`${label} has an invalid status.`);
    if (!isIsoInstant(candidate.createdAt)) return invalid(`${label} is missing a valid created date.`);
    if (!isIsoInstant(candidate.updatedAt)) return invalid(`${label} is missing a valid updated date.`);
    if (!Array.isArray(candidate.steps)) return invalid(`${label} has an invalid step list.`);
    if (!Array.isArray(candidate.history) || candidate.history.length > 50) return invalid(`${label} has an invalid change-note list.`);

    for (const [stepIndex, step] of candidate.steps.entries()) {
      if (!isRecord(step)) return invalid(`${label}, step ${stepIndex + 1} is incomplete.`);
      if (!claimId(step.id)) return invalid(`${label}, step ${stepIndex + 1} has a missing or duplicate ID.`);
      if (!isText(step.name, 80)) return invalid(`${label}, step ${stepIndex + 1} needs a name of 80 characters or fewer.`);
      if (!Number.isInteger(step.duration) || Number(step.duration) < 1 || Number(step.duration) > 120) return invalid(`${label}, step ${stepIndex + 1} must last 1 to 120 working days.`);
      if (step.actualFinish !== undefined && !isIsoDate(step.actualFinish)) return invalid(`${label}, step ${stepIndex + 1} has an invalid actual finish date.`);
    }

    for (const [historyIndex, entry] of candidate.history.entries()) {
      if (!isRecord(entry)) return invalid(`${label}, change note ${historyIndex + 1} is incomplete.`);
      if (!claimId(entry.id)) return invalid(`${label}, change note ${historyIndex + 1} has a missing or duplicate ID.`);
      if (!isIsoInstant(entry.at)) return invalid(`${label}, change note ${historyIndex + 1} has an invalid date.`);
      if (!isText(entry.message, 500)) return invalid(`${label}, change note ${historyIndex + 1} has no valid message.`);
    }

    const orderError = actualOrderError(candidate as unknown as Job);
    if (orderError) return invalid(`${label} has actual finishes out of step order. ${orderError}`);
  }

  if (value.jobs.filter((job) => isRecord(job) && job.status === 'active').length > 5) return invalid('there are more than five active jobs. Archive jobs before exporting a new backup.');
  if (value.jobs.length > 0 && (!isText(value.selectedJobId, 200) || !value.jobs.some((job) => isRecord(job) && job.id === value.selectedJobId))) {
    return invalid('the selected job is missing.');
  }
  if (value.jobs.length === 0 && value.selectedJobId !== undefined) return invalid('the selected job does not exist.');

  return { valid: true, data: value as unknown as AppData };
}
