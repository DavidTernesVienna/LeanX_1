import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BackArrowIcon } from './icons';

interface VideoRecorderProps {
    onVideoTaken: (dataUrl: string) => void;
    onCancel: () => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ onVideoTaken, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

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
            setRecordedVideoUrl(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError("Camera not supported on this device or browser.");
                setIsLoading(false);
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode },
                    audio: true
                });
                if (active) {
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.onloadedmetadata = () => {
                            if (active) setIsLoading(false);
                        };
                    }
                }
            } catch (err: any) {
                console.error("Error accessing camera/mic:", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError("Camera and microphone permissions are needed to record video.");
                } else {
                    setError("Could not access the camera or microphone.");
                }
                setIsLoading(false);
            }
        };

        startStream();

        return () => {
            active = false;
            stopStream();
        };
    }, [facingMode, stopStream]);

    const handleStartRecording = () => {
        if (streamRef.current) {
            recordedChunksRef.current = [];
            const options = { mimeType: 'video/webm; codecs=vp9' };
            try {
                 mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
            } catch(e) {
                 mediaRecorderRef.current = new MediaRecorder(streamRef.current);
            }
           
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setRecordedVideoUrl(url);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            stopStream();
        }
    };

    const handleUseVideo = () => {
        if (recordedVideoUrl) {
            const blobUrl = recordedVideoUrl;
            // Convert Blob URL to a Data URL
            fetch(blobUrl)
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        onVideoTaken(reader.result as string);
                        URL.revokeObjectURL(blobUrl);
                    };
                    reader.readAsDataURL(blob);
                });
        }
    };

    const handleRetake = () => {
        if(recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
        setRecordedVideoUrl(null);
        // This will trigger the useEffect to start the stream again
        setFacingMode(prev => prev); 
    };
    
    const handleSwitchCamera = () => {
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    if (recordedVideoUrl) {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
                <video src={recordedVideoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 z-10">
                    <button onClick={handleRetake} className="px-6 py-3 bg-white/20 text-white rounded-full font-semibold">Retake</button>
                    <button onClick={handleUseVideo} className="px-6 py-3 bg-accent text-white rounded-full font-bold">Use Video</button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-0 left-0 w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }}
            />
             {isLoading && <div className="text-white z-20">Starting camera...</div>}
             {error && <div className="bg-red-500 text-white p-4 rounded-lg text-center z-20 max-w-sm">{error}</div>}
            
            <div className="absolute top-4 left-4 z-10">
                <button onClick={onCancel} className="p-2 bg-black/50 rounded-full">
                    <BackArrowIcon className="w-6 h-6 text-white" />
                </button>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-16 z-10">
                <button
                    onClick={handleSwitchCamera}
                    disabled={isLoading || isRecording}
                    className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
                    aria-label="Switch camera"
                >
                     <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.696v4.992h-4.992m0 0-3.181-3.183a8.25 8.25 0 0 1 11.667 0l3.181 3.183" />
                    </svg>
                </button>
                <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isLoading || !!error}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${isRecording ? 'bg-red-500' : 'bg-white'}`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                    {isRecording ? (
                         <div className="w-8 h-8 bg-white rounded-md"></div>
                    ) : (
                        <div className="w-[70px] h-[70px] rounded-full border-4 border-red-500"></div>
                    )}
                </button>
                 <div className="w-16 h-16" />
            </div>
        </div>
    );
};
