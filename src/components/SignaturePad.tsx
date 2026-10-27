import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface Props {
  initialDataUrl?: string;
  onSaveSignature: (dataUrl: string) => void;
  onClearSignature?: () => void;
}

export const SignaturePad: React.FC<Props> = ({ initialDataUrl, onSaveSignature, onClearSignature }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Setup canvas with high DPI for super crisp lines
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a'; // Deep navy ink

    // Load initial image if provided
    if (initialDataUrl && !hasDrawn) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, (rect.width - 240) / 2, (rect.height - 80) / 2, 240, 80);
      };
      img.src = initialDataUrl;
    }
  }, [initialDataUrl, hasDrawn]);

  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
    setSavedSuccess(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    setIsDrawing(false);

    // Auto-save the drawn signature to state
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setSavedSuccess(false);
    if (onClearSignature) {
      onClearSignature();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white rounded-xl overflow-hidden shadow-inner transition">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-36 touch-none cursor-crosshair bg-white"
        />

        {/* Placeholder guide line */}
        <div className="absolute bottom-6 left-12 right-12 border-b border-slate-200 pointer-events-none flex justify-center">
          <span className="text-[10px] text-slate-300 font-sans tracking-widest uppercase">
            เส้นประระนาบลายเซ็น
          </span>
        </div>

        {/* Clear Action Button */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {savedSuccess && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-fade-in">
              <Check className="w-3 h-3" /> บันทึกลายเซ็นแล้ว
            </span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
            title="ล้างลายเซ็นและวาดใหม่"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">ล้างเส้น</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span className="flex items-center gap-1">
          <PenTool className="w-3 h-3 text-indigo-500" />
          ใช้นิ้วมือหรือเมาส์จรดลงบนช่องว่างเพื่อวาดลายเซ็น
        </span>
        <span>ระบบบันทึกเส้นคมชัดแบบความละเอียดสูง (Retina HD)</span>
      </div>
    </div>
  );
};
