export interface Worker {
  id: number;
  name: string;
  email: string;
  authUserID: string;
  birthDate?: Date;
  address?: string;
  nextVisitDate?: Date;
  unitPrice?: number;
  groupID?: number;
}

import { Group } from '../group';

export interface WorkerDetail extends Worker {
  group?: Group;
  skills: WorkerSkill[];
  workHistory: WorkHistory[];
}

export interface WorkerSkill {
  id: number;
  workerID: number;
  rankID: number;
  rankName?: string;
  comment?: string;
}

import { Work } from '../work';

export interface WorkHistory {
  work: Work;
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}