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
    console.log('🎬 サムネイル生成開始:', videoUrl);
    
    // デバイス・ブラウザ情報を追加
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isMobile = /Mobi|Android/i.test(userAgent);
    
    console.log('📱 デバイス情報:', {
      userAgent,
      isIOS,
      isSafari,
      isMobile,
      platform: navigator.platform
    });
    
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('❌ Canvas context取得失敗');
      reject(new Error('Canvas context not available'));
      return;
    }

    // 本番環境とlocalhost環境を判定
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    console.log('🌍 環境判定:', isProduction ? '本番環境' : 'ローカル環境');
    console.log('🌍 ホスト名:', window.location.hostname);
    
    if (isIOS) {
			// iOS対応: プリロード設定
      video.preload = 'metadata';
      video.playsInline = true;
      console.log('📱 iOS設定: preload=metadata, playsInline=true');
    } else {
			// iOS対応: iOSではcrossOriginを設定しない
			video.crossOrigin = 'anonymous';
      console.log('🔒 crossOrigin設定: anonymous');
		}
    
    // タイムアウト設定
    const timeoutId = setTimeout(() => {
      console.error('⏰ タイムアウト: 10秒経過');
      reject(new Error('動画読み込みタイムアウト'));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeoutId);
    };
    
    video.currentTime = 1; // 1秒後のフレームを取得
    console.log('⏱️ currentTime設定: 1秒');

    video.onloadstart = () => {
      console.log('📥 動画読み込み開始');
    };

    video.onloadeddata = () => {
      console.log('📊 動画データ読み込み完了');
    };

    video.onloadedmetadata = () => {
      console.log('📋 メタデータ読み込み完了');
      console.log('📐 動画サイズ:', video.videoWidth, 'x', video.videoHeight);
      console.log('⏱️ 動画長:', video.duration, '秒');
      
      // キャンバスサイズをサムネイルサイズに設定
      canvas.width = 320;  // 幅320px（16:9で高さ180pxになる）
      canvas.height = 180; // 高さ180px
      console.log('🎨 キャンバスサイズ設定: 320x180');
    };

    video.oncanplay = () => {
      console.log('▶️ 再生準備完了');
    };

    video.onseeked = () => {
      console.log('🎯 シーク完了 - サムネイル生成開始');
      try {
        // 動画フレームをキャンバスに描画
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log('🖼️ キャンバスに描画完了');
        
        // Base64データURLを取得
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        console.log('✅ サムネイル生成成功 - データURL長:', thumbnailDataUrl.length);
        
        cleanup();
        resolve(thumbnailDataUrl);
      } catch (error) {
        console.error('❌ サムネイル描画エラー:', error);
        cleanup();
        reject(error);
      }
    };

    video.onerror = (event) => {
      console.error('❌ 動画エラー発生:', event);
      console.error('❌ エラーコード:', video.error?.code);
      console.error('❌ エラーメッセージ:', video.error?.message);
      console.error('❌ 動画URL:', videoUrl);
      console.error('❌ 動画状態 - readyState:', video.readyState);
      console.error('❌ 動画状態 - networkState:', video.networkState);
      
      cleanup();
      reject(new Error('動画の読み込みに失敗しました'));
    };

    video.onstalled = () => {
      console.warn('⚠️ 動画読み込みが停滞');
    };

    video.onsuspend = () => {
      console.warn('⚠️ 動画読み込みが一時停止');
    };

    console.log('🔗 動画URL設定:', videoUrl);
    video.src = videoUrl;
  });
};