import React, { useEffect, useRef, useState } from "react";
import { X, Send, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WhiteboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    socket: any;
    chatId: string;
    onSend: (imgDataUrl: string) => void;
}

const WhiteboardModal: React.FC<WhiteboardModalProps> = ({ isOpen, onClose, socket, chatId, onSend }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#10B981"); // Emerald 500
    const [brushSize, setBrushSize] = useState(3);

    // For local coords
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // Resize canvas to fit container
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height); // white background
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        }
    }, [isOpen]);

    useEffect(() => {
        if (!socket || !isOpen) return;

        const handleDrawing = (data: any) => {
            if (data.chatId !== chatId) return;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!ctx || !canvas) return;

            const { x0, y0, x1, y1, color, size } = data;

            ctx.beginPath();
            ctx.moveTo(x0 * canvas.width, y0 * canvas.height);
            ctx.lineTo(x1 * canvas.width, y1 * canvas.height);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.stroke();
        };

        socket.on("whiteboard drawing", handleDrawing);
        return () => {
            socket.off("whiteboard drawing", handleDrawing);
        };
    }, [socket, isOpen, chatId]);

    const draw = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, isDown: boolean) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        let clientX = 0;
        let clientY = 0;

        if ("touches" in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (isDown && lastPos.current) {
            ctx.beginPath();
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.stroke();

            // Emit to server (normalized coords)
            socket.emit("whiteboard drawing", {
                chatId,
                x0: lastPos.current.x / canvas.width,
                y0: lastPos.current.y / canvas.width, // Notice normalizing with width or height, let's keep it consistent
                // Wait, fixing normalized coords
                x1: x / canvas.width,
                y1: y / canvas.height
            });

            // Re-emit fix for normalized coordinates correctly
            socket.emit("whiteboard drawing", {
                chatId,
                x0: lastPos.current.x / canvas.width,
                y0: lastPos.current.y / canvas.height,
                x1: x / canvas.width,
                y1: y / canvas.height,
                color,
                size: brushSize
            });
        }

        lastPos.current = { x, y };
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e, false);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        draw(e, true);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && canvas) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleSend = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        onSend(dataUrl);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-5xl h-[90vh] bg-zinc-900 border border-emerald-500/20 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
                >
                    <div className="p-4 bg-zinc-900 border-b border-emerald-500/20 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <h2 className="text-white font-bold px-2 tracking-tight">Live Whiteboard 🎨</h2>
                            <div className="flex items-center gap-2 ml-4">
                                <div className="flex gap-1 border border-zinc-700 p-1 rounded-lg">
                                    {["#10B981", "#3B82F6", "#EF4444", "#F59E0B", "#111827", "#FFFFFF"].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={`w-6 h-6 rounded-md border text-xs shadow-sm ${color === c ? 'border-white scale-110' : 'border-zinc-700 scale-100 hover:scale-110'} transition-all`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="range"
                                    min="1" max="20"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                    className="w-24 accent-emerald-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={clearCanvas} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all" title="Clear Canvas">
                                <Trash2 size={18} />
                            </button>
                            <button onClick={handleSend} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm tracking-wide rounded-xl transition-colors shadow-lg shadow-emerald-500/20" title="Send drawing to chat">
                                <Send size={16} /> Send
                            </button>
                            <div className="w-px h-6 bg-zinc-700 mx-2"></div>
                            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div ref={containerRef} className="flex-1 w-full relative bg-white overflow-hidden cursor-crosshair">
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 touch-none"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseOut={handleMouseUp}
                            onTouchStart={handleMouseDown}
                            onTouchMove={handleMouseMove}
                            onTouchEnd={handleMouseUp}
                            onTouchCancel={handleMouseUp}
                        />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default WhiteboardModal;
