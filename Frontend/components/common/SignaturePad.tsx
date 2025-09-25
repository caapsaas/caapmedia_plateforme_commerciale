import React, { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
    onSave: (signature: string) => void;
    onClose: () => void;
    title: string;
    clearLabel: string;
    saveLabel: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose, title, clearLabel, saveLabel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const getCanvasContext = () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.getContext('2d');
    };
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = getCanvasContext();
        if (canvas && ctx) {
            // Set canvas size dynamically to fit container
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, []);

    const getCoords = (event: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        if (event.nativeEvent instanceof MouseEvent) {
             return { x: event.nativeEvent.clientX - rect.left, y: event.nativeEvent.clientY - rect.top };
        }
        if (event.nativeEvent instanceof TouchEvent) {
             return { x: event.nativeEvent.touches[0].clientX - rect.left, y: event.nativeEvent.touches[0].clientY - rect.top };
        }
        return { x: 0, y: 0 };
    }

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        const ctx = getCanvasContext();
        if (!ctx) return;
        const { x, y } = getCoords(event);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const ctx = getCanvasContext();
        if (!ctx) return;
        const { x, y } = getCoords(event);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = getCanvasContext();
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = getCanvasContext();
        if(canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
    
    const handleSave = () => {
        const canvas = canvasRef.current;
        if(canvas) {
            // Check if canvas is empty
            const context = canvas.getContext('2d');
            if(context) {
                const pixelBuffer = new Uint32Array(context.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
                if (!pixelBuffer.some(color => color !== 0)) {
                    // Canvas is blank, maybe alert user or just save empty
                    onSave('');
                    return;
                }
            }
            onSave(canvas.toDataURL('image/png'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b">
                     <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                </div>
                <div className="p-2">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-48 border border-slate-300 rounded-md cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
                 <div className="px-4 py-3 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                    <button onClick={clearCanvas} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{clearLabel}</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{saveLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;