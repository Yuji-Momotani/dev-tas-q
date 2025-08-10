import React from 'react';
import { X } from 'lucide-react';
import { isValidYouTubeUrl, getYouTubeEmbedUrl } from '../utils/video';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    url: string;
    title: string;
  } | null;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  video
}) => {
  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {video.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4">
          {isValidYouTubeUrl(video.url) ? (
            <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={getYouTubeEmbedUrl(video.url)}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
          ) : (
            <video
              src={video.url}
              controls
              className="w-full max-h-[60vh]"
              autoPlay
            >
              お使いのブラウザは動画再生に対応していません。
            </video>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;