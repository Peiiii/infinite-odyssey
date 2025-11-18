import React, { useRef, useEffect, useState } from 'react';
import { Compass, Eye, Footprints, Map, Volume2, VolumeX, ZoomIn, ZoomOut, Send, ChevronRight, Menu, History as HistoryIcon, MapPin, RotateCcw, Globe } from 'lucide-react';
import { ActionType, HistoryItem } from '../types';

interface InterfaceProps {
  worldTitle: string;
  title: string;
  description: string;
  isLoading: boolean;
  onAction: (type: ActionType) => void;
  onCustomAction: (text: string) => void;
  isPlayingAudio: boolean;
  onToggleAudio: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  history: HistoryItem[];
  onRestoreHistory: (item: HistoryItem) => void;
  onReset: () => void;
  currentId: string | undefined;
}

const Interface: React.FC<InterfaceProps> = ({
  worldTitle,
  title,
  description,
  isLoading,
  onAction,
  onCustomAction,
  isPlayingAudio,
  onToggleAudio,
  onZoomIn,
  onZoomOut,
  history,
  onRestoreHistory,
  onReset,
  currentId
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [customInput, setCustomInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isLoading, currentId, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customInput.trim() && !isLoading) {
            onCustomAction(customInput);
            setCustomInput("");
        }
    };

    return (
    <>
        {/* Main Canvas Overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            {/* Brand / World Title - Top Left */}
            <div className={`absolute top-4 left-4 md:top-6 md:left-6 transition-opacity duration-300 ${isOpen ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
                <div className="glass-panel px-4 py-2 rounded-full border border-white/10 shadow-lg pointer-events-auto flex items-center gap-2">
                    <Globe size={14} className="text-emerald-400" />
                    <h1 className="font-heading text-sm md:text-lg text-slate-100 tracking-widest drop-shadow-md uppercase">
                        {worldTitle || 'ODYSSEY'}
                    </h1>
                </div>
            </div>

            {/* Mobile Menu Trigger */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="absolute top-4 right-4 pointer-events-auto glass-panel p-3 rounded-full hover:bg-white/10 transition-all border border-white/20 text-slate-200 shadow-lg"
                >
                    <Menu size={24} />
                </button>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-6 left-6 flex flex-col gap-2 pointer-events-auto">
                 <div className="glass-panel p-2 rounded-xl flex flex-col gap-2 border border-white/10">
                    <button onClick={onZoomIn} className="p-2 text-slate-300 hover:bg-white/10 rounded-lg transition-colors"><ZoomIn size={20}/></button>
                    <button onClick={onZoomOut} className="p-2 text-slate-300 hover:bg-white/10 rounded-lg transition-colors"><ZoomOut size={20}/></button>
                 </div>
            </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div 
            className={`
                absolute top-0 right-0 h-full z-30 flex flex-col
                glass-panel border-l border-white/10 bg-black/80 backdrop-blur-xl
                transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${isOpen ? 'translate-x-0 w-full md:w-[420px]' : 'translate-x-full w-full md:w-[420px]'}
                shadow-[-10px_0_30px_rgba(0,0,0,0.8)]
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                    <HistoryIcon size={18} className="text-emerald-400" />
                    <span className="font-heading text-slate-200 tracking-widest text-sm">Log</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onReset}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-colors"
                        title="New World / Reset"
                    >
                        <RotateCcw size={18} />
                    </button>
                     <button 
                        onClick={onToggleAudio}
                        className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${isPlayingAudio ? 'text-emerald-400' : 'text-slate-500'}`}
                        title={isPlayingAudio ? "Mute" : "Unmute"}
                    >
                        {isPlayingAudio ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Log Entries */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6" ref={scrollRef}>
                {history.map((item) => {
                    const isCurrent = item.id === currentId;
                    return (
                        <div 
                            key={item.id}
                            onClick={() => !isCurrent && !isLoading && onRestoreHistory(item)}
                            className={`
                                relative group rounded-xl border transition-all duration-300 cursor-pointer
                                ${isCurrent 
                                    ? 'bg-emerald-900/10 border-emerald-500/40 ring-1 ring-emerald-500/20' 
                                    : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                                }
                            `}
                        >
                            {isCurrent && <div className="absolute -left-0 top-4 bottom-4 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}

                            <div className="flex gap-3 p-3">
                                <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-black/50 border border-white/10">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700"><Map size={16}/></div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-heading text-sm truncate ${isCurrent ? 'text-emerald-300' : 'text-slate-300'}`}>
                                            {item.title}
                                        </h3>
                                        <span className="text-[10px] text-slate-600 whitespace-nowrap ml-2">
                                            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    
                                    <p className={`text-xs leading-relaxed ${isCurrent ? 'text-slate-200' : 'text-slate-400 line-clamp-2'}`}>
                                        {item.description}
                                    </p>
                                    
                                    {!isCurrent && (
                                        <div className="mt-2 text-[10px] text-emerald-400 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <MapPin size={10} /> Return to here
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isLoading && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse">
                         <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                             <Globe size={16} className="text-emerald-400 animate-spin-slow" />
                         </div>
                         <div className="space-y-2 flex-1">
                             <div className="h-3 w-24 bg-white/10 rounded"></div>
                             <div className="h-2 w-3/4 bg-white/5 rounded"></div>
                         </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-white/10 bg-black/40">
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <ActionButton icon={<Compass size={18} />} label="Move" onClick={() => onAction(ActionType.EXPLORE)} disabled={isLoading} />
                    <ActionButton icon={<Footprints size={18} />} label="Enter" onClick={() => onAction(ActionType.DEEP_DIVE)} disabled={isLoading} />
                    <ActionButton icon={<Eye size={18} />} label="Look" onClick={() => onAction(ActionType.INSPECT)} disabled={isLoading} />
                    <ActionButton icon={<RotateCcw size={18} />} label="Back" onClick={() => onAction(ActionType.SURFACE)} disabled={isLoading} />
                </div>

                <form onSubmit={handleSubmit} className="relative">
                     <input 
                        type="text" 
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="What do you want to do?"
                        disabled={isLoading}
                        className="w-full bg-black/40 border border-white/10 text-slate-200 text-sm rounded-xl py-3 px-4 pr-12 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-600 transition-all"
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || !customInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-500 hover:text-emerald-300 disabled:opacity-30 disabled:hover:text-emerald-500 transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    </>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-1 p-2 rounded-xl border
        glass-panel transition-all duration-200 active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed
        hover:bg-white/10 border-white/10 text-slate-300
      `}
    >
      <div className="opacity-90">{icon}</div>
      <span className="text-[9px] font-heading tracking-wider uppercase">{label}</span>
    </button>
  );
};

export default Interface;