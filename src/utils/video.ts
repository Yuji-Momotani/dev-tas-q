// YouTube URL の検証
export const isValidYouTubeUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
  return youtubeRegex.test(url);
};

// YouTube埋め込みURLを生成
export const getYouTubeEmbedUrl = (url: string): string => {
  // YouTube動画IDを抽出
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
};

// YouTubeサムネイルURLを取得
export const getYouTubeThumbnail = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  
  if (match && match[1]) {
    // 高画質サムネイル（480x360）
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
};

// アップロード動画のサムネイルを生成
export const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // 本番環境とlocalhost環境を判定
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    // 本番環境ではcrossOriginを設定しない（CORSエラー回避）
    if (!isProduction) {
      video.crossOrigin = 'anonymous';
    }
    
    video.currentTime = 1; // 1秒後のフレームを取得

    video.onloadedmetadata = () => {
      // キャンバスサイズをサムネイルサイズに設定
      canvas.width = 320;  // 幅320px（16:9で高さ180pxになる）
      canvas.height = 180; // 高さ180px
    };

    video.onseeked = () => {
      try {
        // 動画フレームをキャンバスに描画
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Base64データURLを取得
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailDataUrl);
      } catch (error) {
        console.error('サムネイル生成エラー:', error);
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('動画の読み込みに失敗しました'));
    };

    video.src = videoUrl;
  });
};