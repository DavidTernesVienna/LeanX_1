import React, { useState, useRef, useEffect } from 'react';
import { BackArrowIcon } from './icons';

interface ThumbnailSelectorProps {
    src: string;
    onComplete: (dataUrl: string) => void;
    onCancel: () => void;
}

export const ThumbnailSelector: React.FC<ThumbnailSelectorProps> = ({ src, onComplete, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const formatTime = (s: number) => {
        const minutes = Math.floor(s / 60);
        const seconds = Math.floor(s % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    
    // Tries to determine a reliable duration. Some browsers only report the correct
    // duration after seeking, or report Infinity/NaN initially. This function
    // forces the browser to figure out the real duration by seeking to the end.
    const resolveFullDuration = (video: HTMLVideoElement) => {
        const setDurationFromVideo = () => {
            const videoDuration = Number.isFinite(video.duration) && video.duration > 0
                ? video.duration
                : Math.max(video.currentTime || 0, 0);
            if (videoDuration > 0) {
                setDuration(videoDuration);
            }
        };

        // 1. Happy path: a valid duration is already available.
        if (Number.isFinite(video.duration) && video.duration > 0) {
            setDuration(video.duration);
            return;
        }

        // 2. The trick: seek to a very large time value to force the browser to find the end.
        const onSeeked = () => {
            setDurationFromVideo(); // After seeking, the duration should be correct.
            video.removeEventListener('seeked', onSeeked);
            try {
                video.currentTime = 0; // Rewind to the beginning.
            } catch {}
        };

        // Fallback for engines that might only fire timeupdate.
        const onTimeUpdateFallback = () => {
            setDurationFromVideo();
            video.removeEventListener('timeupdate', onTimeUpdateFallback);
            try {
                video.currentTime = 0;
            } catch {}
        };
        
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('timeupdate', onTimeUpdateFallback);

        try {
            video.currentTime = 1e101; // A huge number to represent "the end".
        } catch {
            // If the trick is not allowed, try seeking to the end of the seekable range.
            try {
                if (video.seekable?.length) {
                    video.currentTime = video.seekable.end(video.seekable.length - 1);
                }
            } catch {}
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onLoadedMetadata = () => resolveFullDuration(video);
        const onDurationChange = () => resolveFullDuration(video);
        const onTimeUpdate = () => setCurrentTime(video.currentTime);

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('durationchange', onDurationChange);
        video.addEventListener('timeupdate', onTimeUpdate);

        // If metadata is already loaded (e.g., on a component re-mount).
        if (video.readyState >= 1) {
            resolveFullDuration(video);
        }

        return () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('durationchange', onDurationChange);
            video.removeEventListener('timeupdate', onTimeUpdate);
        };
    }, [src]);

    // Use onInput for live scrubbing, which is more responsive than onChange.
    const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        const video = videoRef.current;
        if (video && !Number.isNaN(time)) {
            try {
                video.pause(); // Pause for more stable frame grabbing.
                video.currentTime = time;
            } catch {}
        }
        setCurrentTime(time);
    };
    
    const handleSaveThumbnail = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        
        canvas.width = video.videoWidth || 720; // Fallback size
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            onComplete(dataUrl);
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col text-white">
            <header className="flex items-center p-4 z-10">
                <button onClick={onCancel} className="p-2 -ml-2 bg-black/30 rounded-full">
                    <BackArrowIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-xl mx-auto">Select Thumbnail</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-4">
                <video
                    ref={videoRef}
                    src={src}
                    className="w-full max-w-sm aspect-square object-contain bg-gray-dark rounded-lg"
                    playsInline
                    muted
                    preload="metadata"
                />
                <div className="w-full max-w-sm space-y-2">
                    <input
                        type="range"
                        min="0"
                        max={duration || 1}
                        step={0.033} // Approx 1/30s for smooth scrubbing
                        value={currentTime}
                        onInput={handleScrub} // Use onInput for live feedback
                        className="w-full h-2 bg-gray-light rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                    <div className="flex justify-between text-xs text-gray-text font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </main>
            
            <footer className="p-4 z-10 bg-black/50">
                <button
                    onClick={handleSaveThumbnail}
                    className="w-full bg-accent text-off-white font-bold py-3 rounded-full text-lg transition-transform active:scale-95"
                >
                    Save Thumbnail
                </button>
            </footer>
            
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
