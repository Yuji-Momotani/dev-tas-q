import React, { useState } from 'react';
import { Upload, Video, X } from 'lucide-react';
import { isValidYouTubeUrl } from '../utils/video';

interface VideoFormData {
  title: string;
  uploadType: 'file' | 'youtube';
  file: File | null;
  youtubeUrl: string;
}

interface VideoAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: VideoFormData) => Promise<void>;
  loading: boolean;
}

const VideoAddModal: React.FC<VideoAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading
}) => {
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    uploadType: 'file',
    file: null,
    youtubeUrl: ''
  });
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClose = () => {
    // フォームをリセット
    setFormData({
      title: '',
      uploadType: 'file',
      file: null,
      youtubeUrl: ''
    });
    setIsDragOver(false);
    onClose();
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('video/')) {
      setFormData(prev => ({
        ...prev,
        file: file
      }));
    } else {
      alert('動画ファイルを選択してください。');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (formData.uploadType === 'file' && !formData.file) {
      alert('動画ファイルを選択してください');
      return;
    }
    
    if (formData.uploadType === 'youtube') {
      if (!formData.youtubeUrl) {
        alert('YouTube URLを入力してください');
        return;
      }
      if (!isValidYouTubeUrl(formData.youtubeUrl)) {
        alert('有効なYouTube URLを入力してください');
        return;
      }
    }

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      // エラーハンドリングは親コンポーネントで行う
      console.error('動画追加エラー:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Video className="w-5 h-5 mr-2" />
            動画追加
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* アップロードタイプ選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              アップロード方法 <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadType"
                  value="file"
                  checked={formData.uploadType === 'file'}
                  onChange={(e) => handleFormChange('uploadType', e.target.value)}
                  className="mr-2"
                />
                ファイルアップロード
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadType"
                  value="youtube"
                  checked={formData.uploadType === 'youtube'}
                  onChange={(e) => handleFormChange('uploadType', e.target.value)}
                  className="mr-2"
                />
                YouTube リンク
              </label>
            </div>
          </div>

          {/* ファイルアップロード欄 */}
          {formData.uploadType === 'file' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                作業動画ファイル <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragOver
                    ? 'border-green-500 bg-green-50'
                    : formData.file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('video-file-input')?.click()}
              >
                {formData.file ? (
                  <div className="space-y-2">
                    <Video className="w-12 h-12 text-green-600 mx-auto" />
                    <p className="text-sm font-medium text-green-600">
                      {formData.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, file: null }));
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      ファイルをドラッグ&ドロップするか、クリックして選択
                    </p>
                    <p className="text-xs text-gray-500">
                      対応形式: MP4, MOV, AVI, WMV
                    </p>
                  </div>
                )}
              </div>
              <input
                id="video-file-input"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* YouTube URL入力欄 */}
          {formData.uploadType === 'youtube' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                YouTube URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => handleFormChange('youtubeUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="mt-2 text-sm text-gray-500">
                YouTubeの動画URLを入力してください（例: https://www.youtube.com/watch?v=dQw4w9WgXcQ）
              </p>
            </div>
          )}

          {/* タイトル */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="動画のタイトルを入力してください"
              required
            />
          </div>



          {/* Modal Footer */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={
                !formData.title || 
                loading ||
                (formData.uploadType === 'file' && !formData.file) ||
                (formData.uploadType === 'youtube' && (!formData.youtubeUrl || !isValidYouTubeUrl(formData.youtubeUrl)))
              }
              className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoAddModal;