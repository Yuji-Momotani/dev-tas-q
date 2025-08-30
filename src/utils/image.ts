import { supabase } from './supabase';

/**
 * Supabaseストレージから署名付きURLを生成する
 * @param imagePath - ストレージ内の画像パス（例: 'private/2_1755949706776.jpeg'）
 * @param expiresIn - URL有効期限（秒）、デフォルト3600秒（1時間）
 * @returns 署名付きURL、エラーや空文字の場合は空文字
 */
export async function getWorkerImageUrl(imagePath: string, expiresIn: number = 3600): Promise<string> {
  if (!imagePath.trim()) {
    return '';
  }

  try {
    const { data, error } = await supabase.storage
      .from('worker-images')
      .createSignedUrl(imagePath, expiresIn);

    if (error) {
      console.error('署名付きURL生成エラー:', error);
      return '';
    }

    return data?.signedUrl || '';
  } catch (err) {
    console.error('署名付きURL生成時の予期しないエラー:', err);
    return '';
  }
}