import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BackArrowIcon } from './icons';

interface CameraViewProps {
    onPictureTaken: (dataUrl: string) => void;
    onCancel: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onPictureTaken, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [retryAttempt, setRetryAttempt] = useState(0);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        stopStream();
        let active = true;

        const startStream = async () => {
            setIsLoading(true);
            setError(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError("Camera not supported on this device or browser.");
                setIsLoading(false);
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode }
                });
                if (active && videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                    videoRef.current.onloadedmetadata = () => {
                        if (active) {
                            setIsLoading(false);
                        }
                    };
                }
            } catch (err: any) {
                console.error("Error accessing camera:", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError("Camera permission denied. Please allow camera access in your browser settings.");
                } else {
                    setError("Could not access the camera. Please check permissions or try another browser.");
                }
                setIsLoading(false);
            }
        };

        startStream();

        return () => {
            active = false;
            stopStream();
        };
    }, [facingMode, stopStream, retryAttempt]);

    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current && !isLoading && !error) {
            const MAX_DIMENSION = 800;
            const video = videoRef.current;
            const canvas = canvasRef.current;

            let { videoWidth: width, videoHeight: height } = video;

            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                } else {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            if (context) {
                if (facingMode === 'user') {
                    context.scale(-1, 1);
                    context.translate(-width, 0);
                }
                context.drawImage(video, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                onPictureTaken(dataUrl);
            }
        }
    };

    const handleSwitchCamera = () => {
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    const handleRetry = () => {
        setRetryAttempt(c => c + 1);
    };
    
    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover"
                style={{ 
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)',
                    visibility: isLoading || error ? 'hidden' : 'visible'
                }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="text-white text-center">
                        <svg className="animate-spin h-10 w-10 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2">Starting camera...</p>
                    </div>
                </div>
            )}

            {error === "Camera permission denied. Please allow camera access in your browser settings." ? (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-800/90 backdrop-blur-sm text-white p-6 rounded-xl text-center z-20 max-w-sm shadow-lg">
                    <h3 className="text-xl font-bold mb-2">Camera Permission Denied</h3>
                    <p className="text-red-100">To use the camera, you need to grant permission in your browser settings.</p>
                    <p className="mt-4 text-sm bg-red-900/50 p-3 rounded-lg">
                        <strong>Tip:</strong> Tap the lock icon (🔒) in the address bar to find site settings and enable the camera.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <button onClick={onCancel} className="flex-1 bg-red-700/80 px-4 py-2 rounded-md transition-colors hover:bg-red-700">
                            Back
                        </button>
                        <button onClick={handleRetry} className="flex-1 bg-gray-200 text-red-900 font-semibold px-4 py-2 rounded-md transition-colors hover:bg-white">
                            Retry
                        </button>
                    </div>
                </div>
            ) : error ? (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-800/80 text-white p-4 rounded-lg text-center z-20 max-w-sm">
                    <p>{error}</p>
                    <button onClick={onCancel} className="mt-4 bg-red-600 px-4 py-2 rounded-md">
                        Back
                    </button>
                </div>
            ) : null}
            
            <div className="absolute top-4 left-4 z-10">
                <button onClick={onCancel} className="p-2 bg-black/50 rounded-full">
                    <BackArrowIcon className="w-6 h-6 text-white" />
                </button>
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-16 z-10">
                <div className="w-16 h-16" />

                <button
                    onClick={handleTakePhoto}
                    disabled={isLoading || !!error}
                    className="w-20 h-20 rounded-full bg-white flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
                    aria-label="Take photo"
                >
                    <div className="w-[70px] h-[70px] rounded-full border-4 border-black"></div>
                </button>

                <button
                    onClick={handleSwitchCamera}
                    disabled={isLoading || !!error}
                    className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
                    aria-label="Switch camera"
                >
                     <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.696v4.992h-4.992m0 0-3.181-3.183a8.25 8.25 0 0 1 11.667 0l3.181 3.183" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
