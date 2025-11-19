
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
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        // If we have a captured image, we stop the stream to save battery/resources
        // and rely on the captured image data URL for display.
        if (capturedImage) return;

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
    }, [facingMode, stopStream, retryAttempt, capturedImage]);

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
                setCapturedImage(dataUrl);
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleConfirmPhoto = () => {
        if (capturedImage) {
            onPictureTaken(capturedImage);
        }
    };

    const handleSwitchCamera = () => {
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    const handleRetry = () => {
        setRetryAttempt(c => c + 1);
    };

    if (capturedImage) {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center animate-fade-in z-50">
                <img src={capturedImage} alt="Captured" className="absolute top-0 left-0 w-full h-full object-contain" />
                
                <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-10 p-4">
                    <button 
                        onClick={handleRetake} 
                        className="px-8 py-3 bg-gray-dark/80 backdrop-blur-md text-white rounded-full font-semibold border border-white/10 shadow-lg transition-transform active:scale-95"
                    >
                        Retake
                    </button>
                    <button 
                        onClick={handleConfirmPhoto} 
                        className="px-8 py-3 bg-accent text-off-white rounded-full font-bold shadow-lg transition-transform active:scale-95"
                    >
                        Use Photo
                    </button>
                </div>
            </div>
        );
    }
    
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
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="text-white text-center bg-black/30 backdrop-blur-sm p-4 rounded-xl">
                        <svg className="animate-spin h-8 w-8 text-white mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-medium">Starting camera...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-900/90 backdrop-blur-md text-white p-6 rounded-xl text-center z-20 max-w-sm shadow-2xl border border-red-500/30">
                    <h3 className="text-lg font-bold mb-2">Camera Access Error</h3>
                    <p className="text-red-100 text-sm mb-4">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={onCancel} className="bg-black/30 px-4 py-2 rounded-lg font-medium hover:bg-black/50 transition-colors">
                            Back
                        </button>
                        <button onClick={handleRetry} className="bg-white text-red-900 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors">
                            Retry
                        </button>
                    </div>
                </div>
            )}
            
            <div className="absolute top-4 left-4 z-10">
                <button onClick={onCancel} className="p-3 bg-black/40 backdrop-blur-md rounded-full transition-transform active:scale-95">
                    <BackArrowIcon className="w-6 h-6 text-white" />
                </button>
            </div>
            
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-12 z-10">
                {/* Placeholder for layout balance */}
                <div className="w-14 h-14" />

                <button
                    onClick={handleTakePhoto}
                    disabled={isLoading || !!error}
                    className="w-20 h-20 rounded-full bg-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shadow-xl"
                    aria-label="Take photo"
                >
                    <div className="w-[72px] h-[72px] rounded-full border-4 border-black opacity-80"></div>
                </button>

                <button
                    onClick={handleSwitchCamera}
                    disabled={isLoading || !!error}
                    className="w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-95 disabled