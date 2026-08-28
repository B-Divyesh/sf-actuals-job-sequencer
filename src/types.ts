export type JobStatus = 'active' | 'archived';

export interface Step {
  id: string;
  name: string;
  duration: number;
  actualFinish?: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  message: string;
}

export interface Job {
  id: string;
  name: string;
  client: string;
  startDate: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  steps: Step[];
  history: HistoryEntry[];
}

export interface ScheduleSettings {
  timezone: string;
  workdays: number[];
  holidays: string[];
}

export interface AppData {
  version: 1;
  settings: ScheduleSettings;
  jobs: Job[];
  selectedJobId?: string;
}

export interface ScheduledStep extends Step {
  baselineStart: string;
  baselineFinish: string;
  forecastStart: string;
  forecastFinish: string;
  startMoved: boolean;
  finishMoved: boolean;
}
