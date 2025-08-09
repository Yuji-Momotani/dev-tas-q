/**
 * 作業ステータスの定数定義
 * データベースのworks.statusカラムの値に対応
 */
export enum WorkStatus {
  /** 依頼予定 */
  REQUEST_PLANNED = 1,
  /** 依頼中 */
  REQUESTING = 2,
  /** 進行中 */
  IN_PROGRESS = 3,
  /** 配送中 */
  IN_DELIVERY = 4,
  /** 集荷依頼中 */
  PICKUP_REQUESTING = 5,
  /** 持込待ち */
  WAITING_DROPOFF = 6,
  /** 完了 */
  COMPLETED = 7,
}

/**
 * WorkStatusの値から日本語文字列を取得
 */
export const getWorkStatusLabel = (status: WorkStatus): string => {
  switch (status) {
    case WorkStatus.REQUEST_PLANNED:
      return '依頼予定';
    case WorkStatus.REQUESTING:
      return '依頼中';
    case WorkStatus.IN_PROGRESS:
      return '進行中';
    case WorkStatus.IN_DELIVERY:
      return '配送中';
    case WorkStatus.PICKUP_REQUESTING:
      return '集荷依頼中';
    case WorkStatus.WAITING_DROPOFF:
      return '持込待ち';
    case WorkStatus.COMPLETED:
      return '完了';
    default:
      return '不明';
  }
};

/**
 * 日本語文字列からWorkStatusの値を取得
 */
export const getWorkStatusFromLabel = (label: string): WorkStatus => {
  switch (label) {
    case '依頼予定':
      return WorkStatus.REQUEST_PLANNED;
    case '依頼中':
      return WorkStatus.REQUESTING;
    case '進行中':
      return WorkStatus.IN_PROGRESS;
    case '配送中':
      return WorkStatus.IN_DELIVERY;
    case '集荷依頼中':
      return WorkStatus.PICKUP_REQUESTING;
    case '持込待ち':
      return WorkStatus.WAITING_DROPOFF;
    case '完了':
      return WorkStatus.COMPLETED;
    default:
      return WorkStatus.REQUEST_PLANNED;
  }
};