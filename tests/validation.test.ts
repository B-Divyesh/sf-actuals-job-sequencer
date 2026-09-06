import { describe, expect, it } from 'vitest';
import { validateAppData } from '../src/validation';

function backup(count = 1): Record<string, unknown> {
  const timestamp = '2026-09-06T12:00:00.000Z';
  return {
    version: 1,
    settings: { timezone: 'Europe/London', workdays: [1, 2, 3, 4, 5], holidays: ['2026-12-25'] },
    jobs: Array.from({ length: count }, (_, index) => ({
      id: `job-${index + 1}`,
      name: `Job ${index + 1}`,
      client: '',
      startDate: '2026-09-07',
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
      steps: [],
      history: []
    })),
    selectedJobId: 'job-1'
  };
}

describe('backup validation', () => {
  it('accepts a complete backup', () => {
    expect(validateAppData(backup())).toMatchObject({ valid: true });
  });

  it('rejects a missing timestamp before the record can be saved', () => {
    const candidate = backup(2) as { jobs: Array<Record<string, unknown>> };
    delete candidate.jobs[1]!.updatedAt;
    expect(validateAppData(candidate)).toMatchObject({ valid: false, error: expect.stringContaining('job 2 is missing a valid updated date') });
  });

  it('rejects duplicate IDs and a selected job that does not exist', () => {
    const duplicate = backup(2) as { jobs: Array<Record<string, unknown>> };
    duplicate.jobs[1]!.id = 'job-1';
    expect(validateAppData(duplicate)).toMatchObject({ valid: false, error: expect.stringContaining('duplicate ID') });

    const missingSelection = backup();
    missingSelection.selectedJobId = 'missing';
    expect(validateAppData(missingSelection)).toMatchObject({ valid: false, error: expect.stringContaining('selected job is missing') });
  });

  it('rejects an invalid timezone, incomplete history, and six active jobs', () => {
    const invalidTimezone = backup() as { settings: Record<string, unknown> };
    invalidTimezone.settings.timezone = 'Not/A_Timezone';
    expect(validateAppData(invalidTimezone)).toMatchObject({ valid: false, error: expect.stringContaining('timezone is not valid') });

    const invalidHistory = backup() as { jobs: Array<Record<string, unknown>> };
    invalidHistory.jobs[0]!.history = [{ id: 'history-1', message: 'Changed' }];
    expect(validateAppData(invalidHistory)).toMatchObject({ valid: false, error: expect.stringContaining('change note 1 has an invalid date') });

    expect(validateAppData(backup(6))).toMatchObject({ valid: false, error: expect.stringContaining('more than five active jobs') });
  });
});
