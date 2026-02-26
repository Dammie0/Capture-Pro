import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';

interface DraggableWebcamProps {
  stream: MediaStream;
  onClose?: () => void;
}

export function DraggableWebcam({ stream, onClose }: DraggableWebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [position, setPosition] = useState({ x: 32, y: 32 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const togglePiP = async () => {
    if (videoRef.current) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    }
  };

  return (
    <div
      className="fixed z-50 overflow-hidden rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] bg-black/80 border border-white/10 group backdrop-blur-xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '280px',
        height: '210px',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover pointer-events-none rounded-2xl"
      />
      
      {/* Controls overlay */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={(e) => { e.stopPropagation(); togglePiP(); }}
          className="p-2 bg-black/60 hover:bg-black/80 rounded-xl text-white backdrop-blur-md border border-white/10 transition-colors"
          title="Picture in Picture"
        >
          <Maximize2 size={14} />
        </button>
        {onClose && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 bg-black/60 hover:bg-black/80 rounded-xl text-white backdrop-blur-md border border-white/10 transition-colors"
            title="Close webcam"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
