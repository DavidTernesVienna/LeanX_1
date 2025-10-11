import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BackArrowIcon } from './icons';

interface ImageCropperProps {
    src: string;
    onComplete: (dataUrl: string | null) => void;
    onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ src, onComplete, onCancel }) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const pinchStartDistance = useRef(0);
    const pinchStartZoom = useRef(1);

    const getCropDimensions = useCallback(() => {
        if (!containerRef.current) return { cropWidth: 0, cropHeight: 0 };
        const containerWidth = containerRef.current.offsetWidth;
        const cropDim = Math.min(containerWidth * 0.9, 400); 
        return { cropWidth: cropDim, cropHeight: cropDim };
    }, []);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setImageSize({ width: img.width, height: img.height });
        };
    }, [src]);
    
    useEffect(() => {
        if (!imageSize.width || !containerRef.current) return;

        const { cropWidth, cropHeight } = getCropDimensions();
        if(cropWidth === 0) return;

        const zoomToFitWidth = cropWidth / imageSize.width;
        const zoomToFitHeight = cropHeight / imageSize.height;
        
        const initialZoom = Math.max(zoomToFitWidth, zoomToFitHeight);
        
        setZoom(initialZoom);
        setOffset({ x: 0, y: 0 });
    }, [imageSize, src, getCropDimensions]);

    const getDistance = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.current.size === 1) {
            setIsDragging(true);
            setStartDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        } else if (pointers.current.size === 2) {
            // FIX: Explicitly type the destructured values from the pointers map iterator
            // to resolve type inference issue where they were treated as 'unknown'.
            const [p1, p2] = Array.from(pointers.current.values()) as { x: number; y: number }[];
            pinchStartDistance.current = getDistance(p1, p2);
            pinchStartZoom.current = zoom;
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!pointers.current.has(e.pointerId)) return;
        e.preventDefault();
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        
        const { cropWidth, cropHeight } = getCropDimensions();
        let currentZoom = zoom;

        if (pointers.current.size === 2) {
            // FIX: Explicitly type the destructured values from the pointers map iterator
            // to resolve type inference issue where they were treated as 'unknown'.
            const [p1, p2] = Array.from(pointers.current.values()) as { x: number; y: number }[];
            const newDist = getDistance(p1, p2);
            if (pinchStartDistance.current > 0) {
                const newZoom = pinchStartZoom.current * (newDist / pinchStartDistance.current);
                const minZoom = Math.max(cropWidth / imageSize.width, cropHeight / imageSize.height);
                currentZoom = Math.max(minZoom, Math.min(newZoom, 5));
                setZoom(currentZoom);
            }
        }
        
        if (pointers.current.size === 1 && isDragging) {
            const newX = e.clientX - startDrag.x;
            const newY = e.clientY - startDrag.y;
            
            const scaledWidth = imageSize.width * currentZoom;
            const scaledHeight = imageSize.height * currentZoom;

            const maxX = Math.max(0, (scaledWidth - cropWidth) / 2);
            const maxY = Math.max(0, (scaledHeight - cropHeight) / 2);

            setOffset({
                x: Math.max(-maxX, Math.min(maxX, newX)),
                y: Math.max(-maxY, Math.min(maxY, newY)),
            });
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        pointers.current.delete(e.pointerId);

        if (pointers.current.size < 2) {
            pinchStartDistance.current = 0;
        }
        if (pointers.current.size < 1) {
            setIsDragging(false);
        } else {
            // FIX: Explicitly type the destructured value from the pointers map iterator
            // to resolve type inference issue where it was treated as 'unknown'.
            const [p1] = Array.from(pointers.current.values()) as { x: number; y: number }[];
            setIsDragging(true);
            setStartDrag({ x: p1.x - offset.x, y: p1.y - offset.y });
        }
    };
    
    const handleCrop = () => {
        if (!imageRef.current || !canvasRef.current) return;
        
        const image = imageRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { cropWidth, cropHeight } = getCropDimensions();
        
        const finalSize = 400; // Output a consistent size
        canvas.width = finalSize;
        canvas.height = finalSize;

        const scaledImgWidth = image.naturalWidth;
        const scaledImgHeight = image.naturalHeight;

        const sourceCropWidth = cropWidth / zoom;
        const sourceCropHeight = cropHeight / zoom;

        const sourceX = (scaledImgWidth - sourceCropWidth) / 2 - (offset.x / zoom);
        const sourceY = (scaledImgHeight - sourceCropHeight) / 2 - (offset.y / zoom);

        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceCropWidth,
            sourceCropHeight,
            0,
            0,
            finalSize,
            finalSize
        );

        onComplete(canvas.toDataURL('image/jpeg', 0.9));
    };


    return (
        <div className="fixed inset-0 bg-black flex flex-col text-white">
            <header className="flex items-center p-4 z-10">
                <button onClick={onCancel} className="p-2 -ml-2 bg-black/30 rounded-full">
                    <BackArrowIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-xl mx-auto">Edit Photo</h1>
                <div className="w-10"></div>
            </header>

            <div 
                ref={containerRef} 
                className="flex-grow flex items-center justify-center relative overflow-hidden"
                style={{ touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <img
                    ref={imageRef}
                    src={src}
                    alt="Crop preview"
                    className="pointer-events-none max-w-none"
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                />
                 <div 
                    className="absolute w-[90vw] max-w-[400px] aspect-square border-4 border-white/50 rounded-2xl pointer-events-none z-10"
                    style={{
                        boxShadow: '0 0 0 100vmax rgba(0,0,0,0.5)'
                    }}
                ></div>
            </div>

            <footer className="p-4 z-10 bg-black/50">
                <button
                    onClick={handleCrop}
                    className="w-full bg-accent text-off-white font-bold py-3 rounded-full text-lg transition-transform active:scale-95"
                >
                    Save
                </button>
            </footer>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
