import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VehiclePhotoViewerProps {
  photos: string[];
  primaryIndex?: number;
  onSetPrimary?: (index: number) => void;
  onDelete?: (index: number) => void;
}

export const VehiclePhotoViewer: React.FC<VehiclePhotoViewerProps> = ({
  photos = [],
  primaryIndex = 0,
  onSetPrimary,
  onDelete,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const hasPhotos = photos && photos.length > 0;

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
    setZoomLevel(1);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setZoomLevel(1);
  };

  // Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, photos.length]);

  return (
    <div className="space-y-3">
      {/* Main Preview Container */}
      <div className="w-full h-64 sm:h-80 rounded-xl bg-zinc-100 border border-[#E5E5E5] relative overflow-hidden flex items-center justify-center group">
        {hasPhotos ? (
          <>
            <img
              src={photos[activePhotoIndex] || photos[0]}
              alt={`Vehicle Photo ${activePhotoIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-300"
            />

            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-4 pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
                className="p-2 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-200 pointer-events-auto shadow-md"
                aria-label="Previous Photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(true);
                }}
                className="p-2 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-200 pointer-events-auto shadow-md"
                aria-label="Fullscreen Lightbox"
              >
                <Maximize2 className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
                className="p-2 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-200 pointer-events-auto shadow-md"
                aria-label="Next Photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-white/90 border border-zinc-200 text-[10px] font-mono text-zinc-800 shadow-xs">
              {activePhotoIndex + 1} / {photos.length}
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 text-zinc-400">
            <ImageIcon className="w-10 h-10 mb-2 text-zinc-400" />
            <p className="text-xs font-semibold text-zinc-700">No vehicle photos uploaded</p>
            <p className="text-[11px] text-zinc-500 mt-1">Upload actual vehicle asset photos to view gallery.</p>
          </div>
        )}
      </div>

      {/* Thumbnails Bar */}
      {hasPhotos && photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => setActivePhotoIndex(idx)}
              className={`w-16 h-12 rounded-lg overflow-hidden border shrink-0 transition-all ${
                activePhotoIndex === idx
                  ? 'border-[#F5A800] ring-2 ring-[#F5A800]/40 opacity-100'
                  : 'border-zinc-200 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={photo} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 backdrop-blur-md">
            {/* Lightbox Header */}
            <div className="flex items-center justify-between text-zinc-300 border-b border-zinc-800 pb-3">
              <span className="text-xs font-mono text-zinc-300">
                Photo {activePhotoIndex + 1} of {photos.length} • Use Arrow Keys to Navigate
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.5, 3))}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.5, 1))}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                  aria-label="Close Lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Main Image Canvas */}
            <div className="flex-1 flex items-center justify-center overflow-hidden relative my-4">
              <button
                onClick={prevPhoto}
                className="absolute left-4 p-3 rounded-full bg-zinc-900/90 text-white border border-zinc-800 hover:bg-[#F5A800] hover:text-black transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <motion.img
                key={activePhotoIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: zoomLevel }}
                transition={{ duration: 0.2 }}
                src={photos[activePhotoIndex]}
                alt="Vehicle Fullscreen"
                className="max-h-full max-w-full object-contain cursor-grab active:cursor-grabbing"
              />

              <button
                onClick={nextPhoto}
                className="absolute right-4 p-3 rounded-full bg-zinc-900/90 text-white border border-zinc-800 hover:bg-[#F5A800] hover:text-black transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

