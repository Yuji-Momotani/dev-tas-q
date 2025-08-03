/**
 * 作業ステータスの定数定義
 * データベースのworks.statusカラムの値に対応
 */
export enum WorkStatus {
  /** 予定なし */
  NO_PLAN = 1,
  /** 予定 */
  PLANNED = 2,
  /** 着手中 */
  IN_PROGRESS = 3,
  /** 完了 */
  COMPLETED = 4,
}

/**
 * WorkStatusの値から日本語文字列を取得
 */
export const getWorkStatusLabel = (status: WorkStatus): string => {
  switch (status) {
    case WorkStatus.NO_PLAN:
      return '予定なし';
    case WorkStatus.PLANNED:
      return '予定';
    case WorkStatus.IN_PROGRESS:
      return '着手中';
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
    case '予定なし':
      return WorkStatus.NO_PLAN;
    case '予定':
      return WorkStatus.PLANNED;
    case '着手中':
      return WorkStatus.IN_PROGRESS;
    case '完了':
      return WorkStatus.COMPLETED;
    default:
      return WorkStatus.NO_PLAN;
  }
};