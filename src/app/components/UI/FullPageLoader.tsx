import { Loader2 } from "lucide-react";

export function FullPageLoader({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50 backdrop-blur-sm fixed inset-0 z-50">
            <div className="relative p-8 bg-white/80 rounded-3xl shadow-2xl border border-gray-100 backdrop-blur-xl flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">

                {/* Animated Brand Icon */}
                <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-300/50 animate-pulse">
                        <span className="text-3xl font-bold text-white">A</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-bounce" />
                </div>

                {/* Loading Text & Spinner */}
                <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{text}</span>
                    </div>
                    <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full animate-[loading_1s_ease-in-out_infinite]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
