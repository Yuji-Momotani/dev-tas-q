import { Work } from '../types/work';
import { WorkStatus } from '../constants/workStatus';

/**
 * ステータスの優先度を定義（要件に基づく順序）
 * Note: supabaseのorder句ではcaseを用いた複雑なソート処理ができないようだったのでフロントでソート実行
 */
export const getStatusPriority = (status: WorkStatus): number => {
  switch (status) {
    case WorkStatus.IN_PROGRESS: return 1;        // 進行中
    case WorkStatus.IN_DELIVERY: return 2;        // 配送中
    case WorkStatus.WAITING_DROPOFF: return 3;    // 持込待ち
    case WorkStatus.PICKUP_REQUESTING: return 4;  // 集荷依頼中
    case WorkStatus.REQUESTING: return 5;         // 依頼中
    case WorkStatus.REQUEST_PLANNED: return 6;    // 依頼予定
    case WorkStatus.COMPLETED: return 7;          // 完了
    default: return 8;
  }
};

/**
 * 作業アイテムのソート処理
 * 第一ソート：ステータス優先度順
 * 第二ソート：納品予定日の昇順
 * Note: supabaseのorder句ではcaseを用いた複雑なソート処理ができないようだったのでフロントでソート実行
 */
export const sortWorkItems = (items: Work[]): Work[] => {
  return [...items].sort((a, b) => {
    // 第一ソート：ステータス優先度順
    const statusPriorityA = getStatusPriority(a.status);
    const statusPriorityB = getStatusPriority(b.status);
    
    if (statusPriorityA !== statusPriorityB) {
      return statusPriorityA - statusPriorityB;
    }
    
    // 第二ソート：納品予定日の昇順
    const dateA = a.deliveryDate;
    const dateB = b.deliveryDate;
    
    // 両方とも日付がない場合は0（同順）
    if (!dateA && !dateB) return 0;
    // 片方だけ日付がない場合は、日付がない方を後に
    if (!dateA) return 1;
    if (!dateB) return -1;
    // 両方とも日付がある場合は日付で比較（昇順）
    return dateA.getTime() - dateB.getTime();
  });
};