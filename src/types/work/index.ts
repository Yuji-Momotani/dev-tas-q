import { WorkStatus } from '../../constants/workStatus';

export interface Work {
  id: number;
  title: string;
  status: WorkStatus;
  quantity: number;
  unitPrice: number;
  deliveryDate?: Date;
  scheduledDeliveryDate?: Date;
  workerID?: number;
  workerName?: string;
  workerUnitPriceRatio?: number;
  note?: string;
  cost: number;
  endedAt?: Date;
}

export interface WorkDetail extends Work {
  cost: number;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkVideo {
  id: number;
  title: string;
  creator: string;
  createdAt: Date;
  workTitle?: string;
  videoUrl?: string;
}

export interface WorkHistory {
  id: number;
  name: string;
  status: WorkStatus;
  quantity: number;
  unitPrice: number;
  cost: number;
  deliveryDate?: Date;
}

export const calculateCost = (quantity: number, unitPrice: number, unitPriceRatio: number = 1.0): number => {
  // 費用計算: 数量 × 単価 × 単価率（小数点切り捨て）
  return Math.floor(quantity * unitPrice * unitPriceRatio);
};