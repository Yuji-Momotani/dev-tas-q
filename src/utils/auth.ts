import { NavigateFunction } from 'react-router-dom';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * JWT期限切れエラーかどうかを判定する
 * @param error - Supabaseエラーオブジェクト
 * @returns JWT期限切れエラーの場合はtrue
 */
export const isJwtExpiredError = (error: PostgrestError | Error): boolean => {
  const errorMessage = error.message;
  
  return (
    errorMessage.includes('JWT') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('Invalid JWT') ||
    errorMessage.includes('expired') ||
    ('code' in error && error.code === 'PGRST301')
  );
};

/**
 * JWT期限切れエラーをハンドリングし、適切なログイン画面にリダイレクトする
 * @param error - Supabaseエラーオブジェクト
 * @param navigate - React Routerのnavigate関数
 * @param userType - ユーザータイプ ('admin' | 'worker')
 * @returns JWT期限切れエラーの場合はtrue、そうでなければfalse
 */
export const handleJwtExpiredError = (
  error: PostgrestError | Error,
  navigate: NavigateFunction,
  userType: 'admin' | 'worker'
): boolean => {
  if (isJwtExpiredError(error)) {
    const loginPath = userType === 'admin' ? '/admin/login' : '/worker/login';
    console.log(`${userType}でJWT期限切れを検知:`, error.message);
    navigate(loginPath);
    return true;
  }
  return false;
};

/**
 * Supabase APIエラーをハンドリングする汎用関数
 * JWT期限切れの場合は自動でログイン画面にリダイレクト
 * @param error - Supabaseエラーオブジェクト
 * @param navigate - React Routerのnavigate関数
 * @param userType - ユーザータイプ ('admin' | 'worker')
 * @param context - エラーが発生した処理の説明（ログ用）
 */
export const handleSupabaseError = (
  error: PostgrestError | Error,
  navigate: NavigateFunction,
  userType: 'admin' | 'worker',
  context?: string
): void => {
  if (handleJwtExpiredError(error, navigate, userType)) {
    return;
  }
  
  if (context) {
    console.error(`${context}でエラーが発生:`, error);
  } else {
    console.error('Supabaseエラー:', error);
  }
  throw error;
};