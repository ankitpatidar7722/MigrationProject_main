import React, { useEffect, useState } from 'react';

interface LoadingOverlayProps {
    message?: string;
    progress?: number; // 0 to 100
    isVisible?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    message = 'Loading...',
    progress,
    isVisible = true
}) => {
    const [simulatedProgress, setSimulatedProgress] = useState(0);

    useEffect(() => {
        if (progress !== undefined) return; // Use real progress if provided

        // Simulate progress for indeterminate states
        const interval = setInterval(() => {
            setSimulatedProgress(prev => {
                if (prev >= 90) return prev; // Stall at 90%
                return prev + Math.random() * 10;
            });
        }, 500);

        return () => clearInterval(interval);
    }, [progress]);

    const displayProgress = progress !== undefined ? progress : simulatedProgress;

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 w-[400px] flex flex-col items-center animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-zinc-800">

                {/* Three Dots Animation */}
                <div className="flex gap-2 mb-6">
                    <div className="w-3 h-3 bg-[#0f294d] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-3 h-3 bg-[#0f294d] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-3 h-3 bg-[#0f294d] rounded-full animate-bounce"></div>
                </div>

                <h3 className="text-slate-700 dark:text-zinc-300 font-medium mb-4">{message}</h3>

                {/* Progress Bar Container */}
                <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-[#0f294d] rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.round(displayProgress)}%` }}
                    />
                </div>

                <span className="text-sm font-bold text-[#0f294d] dark:text-blue-400">
                    {Math.round(displayProgress)}%
                </span>
            </div>
        </div>
    );
};
