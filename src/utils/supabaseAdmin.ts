import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

// 管理者権限用のSupabaseクライアント
// Service Role Keyを使用してユーザー管理操作を実行
export const supabaseAdmin = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * 作業者を招待してメールを送信
 */
export const inviteWorkerByEmail = async (
  email: string, 
  redirectTo?: string
): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        data: {
          role: 'worker',
          role_name: '作業者',
          user_type: 'worker',
          invited_by: 'admin'
        }
      }
    );

    if (error) {
      console.error('招待エラー:', error);
      return { success: false, error: error.message };
    }

    console.log('招待送信成功:', data);
    return { success: true, user: data.user };
  } catch (err) {
    console.error('招待処理エラー:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : '不明なエラーが発生しました' 
    };
  }
};

/**
 * 管理者を招待してメールを送信
 */
export const inviteAdminByEmail = async (
  email: string, 
  redirectTo?: string
): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectTo || `${window.location.origin}/admin/auth/callback`,
        data: {
          role: 'admin',
          role_name: '管理者',
          user_type: 'admin',
          invited_by: 'admin'
        }
      }
    );

    if (error) {
      console.error('管理者招待エラー:', error);
      return { success: false, error: error.message };
    }

    console.log('管理者招待送信成功:', data);
    return { success: true, user: data.user };
  } catch (err) {
    console.error('管理者招待処理エラー:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : '不明なエラーが発生しました' 
    };
  }
};

/**
 * 招待されたユーザーのauth_user_idをworkersテーブルに関連付け
 */
export const linkAuthUserToProfile = async (
  authUserId: string,
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabaseAdmin
      .from('workers')
      .update({ auth_user_id: authUserId })
      .eq('email', email)
      .is('auth_user_id', null);

    if (error) {
      console.error('プロフィール関連付けエラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('プロフィール関連付け処理エラー:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : '不明なエラーが発生しました' 
    };
  }
};

/**
 * 招待されたユーザーのauth_user_idをadminsテーブルに関連付け
 */
export const linkAuthUserToAdminProfile = async (
  authUserId: string,
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabaseAdmin
      .from('admins')
      .update({ auth_user_id: authUserId })
      .eq('email', email)
      .is('auth_user_id', null);

    if (error) {
      console.error('管理者プロフィール関連付けエラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('管理者プロフィール関連付け処理エラー:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : '不明なエラーが発生しました' 
    };
  }
};