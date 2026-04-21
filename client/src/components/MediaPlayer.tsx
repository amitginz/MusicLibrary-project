import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';

export default function MediaPlayer() {
  const { isOpen, current, next, prev, close, queue, currentIndex } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [videoExpanded, setVideoExpanded] = useState(true);
  const song = current();

  useEffect(() => {
    if (song?.isLocal && audioRef.current) {
      audioRef.current.src = song.cloudinaryUrl ?? '';
      audioRef.current.play().catch(() => {});
    }
    // Auto-expand video panel when a YouTube song starts
    if (song && !song.isLocal) setVideoExpanded(true);
  }, [song?._id]);

  if (!isOpen || !song) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* YouTube embedded player panel */}
      {!song.isLocal && videoExpanded && (
        <div className="bg-black flex justify-end border-t border-gray-800">
          <div className="relative w-80 aspect-video">
            <iframe
              key={song.videoId}
              src={`https://www.youtube.com/embed/${song.videoId}?autoplay=1&rel=0`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Bottom control bar */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-3 flex items-center gap-4">
        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{song.title}</p>
          <p className="text-xs text-gray-400">{currentIndex + 1} / {queue.length}</p>
        </div>

        {/* Local MP3 audio */}
        {song.isLocal && (
          <audio ref={audioRef} controls className="h-8" onEnded={next} />
        )}

        {/* YouTube toggle */}
        {!song.isLocal && (
          <button
            onClick={() => setVideoExpanded(v => !v)}
            className="text-xs bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            {videoExpanded ? '▼ Hide Video' : '▶ Show Video'}
          </button>
        )}

        {/* Prev / Next / Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={currentIndex === 0}
            className="text-gray-400 hover:text-white disabled:opacity-30 text-lg"
          >⏮</button>
          <button
            onClick={next}
            disabled={currentIndex === queue.length - 1}
            className="text-gray-400 hover:text-white disabled:opacity-30 text-lg"
          >⏭</button>
          <button onClick={close} className="text-gray-400 hover:text-white ml-2 text-lg">✕</button>
        </div>
      </div>
    </div>
  );
}
