import type { Task, TaskInstance } from '@/db/types';

export interface EasyWinItem {
  task: Task;
  instance: TaskInstance;
}
