
import React, { useState, useRef, useEffect } from 'react';
import { BackArrowIcon, PlayIcon, PauseIcon } from './icons';

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
    const [isPlaying, setIsPlaying] = useState(false);

    const formatTime = (s: number) => {
        const minutes = Math.floor(s / 60);
        const seconds = Math.floor(s % 60);
        const millis = Math.floor((s % 1) * 100);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
    };
    
    const resolveFullDuration = (video: HTMLVideoElement) => {
        const setDurationFromVideo = () => {
            const videoDuration = Number.isFinite(video.duration) && video.duration > 0
                ? video.duration
                : Math.max(video.currentTime || 0, 0);
            if (videoDuration > 0) {
                setDuration(videoDuration);
            }
        };

        if (Number.isFinite(video.duration) && video.duration > 0) {
            setDuration(video.duration);
            return;
        }

        const onSeeked = () => {
            setDurationFromVideo();
            video.removeEventListener('seeked', onSeeked);
            try { video.currentTime = 0; } catch (e) { /* ignore */ }
        };

        video.addEventListener('seeked', onSeeked);
        try {
            video.currentTime = 1e101; 
        } catch (e) { /* ignore */ }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onLoadedMetadata = () => resolveFullDuration(video);
        const onTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            if (video.paused) setIsPlaying(false);
        };
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);

        if (video.readyState >= 1) resolveFullDuration(video);

        return () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
        };
    }, [src]);

    const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        const video = videoRef.current;
        if (video && !Number.isNaN(time)) {
            try {
                video.pause(); 
                video.currentTime = time;
                setCurrentTime(time);
            } catch (e) { /* ignore */ }
        }
    };
    
    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    };

    const handleSaveThumbnail = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        
        // Use intrinsic dimensions for high quality
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // High quality JPEG
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            onComplete(dataUrl);
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col text-white z-50">
            <header className="flex items-center p-4 bg-black/50 backdrop-blur-md sticky top-0 z-10">
                <button onClick={onCancel} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                    <BackArrowIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg mx-auto uppercase tracking-wide">Select Frame</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-6 relative">
                {/* Video Preview Area */}
                <div className="relative w-full max-w-md aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
                    <video
                        ref={videoRef}
                        src={src}
                        className="w-full h-full object-contain"
                        playsInline
                        muted
                        onClick={togglePlay}
                    />
                    
                    {/* Play/Pause Overlay */}
                    <div 
                        className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 pointer-events-none ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
                    >
                        <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            {isPlaying ? <PauseIcon className="w-8 h-8 text-white" /> : <PlayIcon className="w-8 h-8 text-white pl-1" />}
                        </div>
                    </div>
                </div>

                {/* Slider Controls */}
                <div className="w-full max-w-md space-y-3 bg-gray-900/50 p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-xs font-bold text-accent uppercase tracking-widest">Timeline</label>
                        <div className="font-mono text-xl font-bold text-white tabular-nums">
                            {formatTime(currentTime)}
                        </div>
                    </div>
                    
                    <input
                        type="range"
                        min="0"
                        max={duration || 1}
                        step={0.01} 
                        value={currentTime}
                        onInput={handleScrub}
                        className="w-full h-8 bg-transparent cursor-pointer appearance-none relative z-10
                        [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-gray-700 [&::-webkit-slider-runnable-track]:rounded-full
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black"
                    />
                    
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <span>Start</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </main>
            
            <footer className="p-4 bg-black border-t border-gray-800">
                <button
                    onClick={handleSaveThumbnail}
                    className="w-full bg-accent text-black font-black py-4 rounded-xl uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] transition-all active:scale-95"
                >
                    Use This Frame
                </button>
            </footer>
            
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
