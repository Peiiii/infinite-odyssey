import React, { useState, useEffect, useCallback, useRef } from 'react';
import ParticleOverlay from './components/UnderwaterCanvas';
import Interface from './components/Interface';
import { ActionType, HistoryItem, WorldConfig } from './types';
import { initializeWorld, generateSceneDescription, generateSceneImage, generateNarratorSpeech } from './services/gemini';
import { Sparkles, ArrowRight, Zap, TreePine, Rocket, Ghost, Play } from 'lucide-react';

const PRESETS = [
  {
    id: 'cyberpunk',
    title: "Neo-Tokyo Prime",
    tag: "CYBERPUNK",
    prompt: "A futuristic cyberpunk city in 2099 with neon lights, rain, flying cars, and high-tech skyscrapers.",
    image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=800&auto=format&fit=crop",
    color: "text-cyan-400",
    border: "group-hover:border-cyan-400/50",
    shadow: "group-hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.5)]"
  },
  {
    id: 'fantasy',
    title: "The Elder Glade",
    tag: "FANTASY",
    prompt: "A magical ancient forest with glowing bioluminescent plants, giant crystal mushrooms, and floating motes of light.",
    image: "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=800&auto=format&fit=crop",
    color: "text-emerald-400",
    border: "group-hover:border-emerald-400/50",
    shadow: "group-hover:shadow-[0_0_30px_-5px_rgba(52,211,153,0.5)]"
  },
  {
    id: 'mars',
    title: "Crimson Outpost",
    tag: "SCI-FI",
    prompt: "A rugged high-tech scientific colony on the red dusty surface of Mars, with rovers and habitat domes.",
    image: "https://images.unsplash.com/photo-1540651810471-569907e65063?q=80&w=800&auto=format&fit=crop",
    border: "group-hover:border-orange-400/50",
    color: "text-orange-400",
    shadow: "group-hover:shadow-[0_0_30px_-5px_rgba(251,146,60,0.5)]"
  },
  {
    id: 'horror',
    title: "Blackwood Manor",
    tag: "HORROR",
    prompt: "A haunted victorian mansion on a foggy hill, with cobwebs, lightning, and eerie shadows.",
    image: "https://images.unsplash.com/photo-1489053443836-4563626b9c4a?q=80&w=800&auto=format&fit=crop",
    color: "text-purple-400",
    border: "group-hover:border-purple-400/50",
    shadow: "group-hover:shadow-[0_0_30px_-5px_rgba(192,132,252,0.5)]"
  }
];

const App: React.FC = () => {
  // World State
  const [hasStarted, setHasStarted] = useState(false);
  const [worldConfig, setWorldConfig] = useState<WorldConfig | null>(null);
  const [initPrompt, setInitPrompt] = useState("");

  // Current Scene State
  const [locationTitle, setLocationTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentId, setCurrentId] = useState<string>('init');

  // Viewport State
  const [viewScale, setViewScale] = useState(1.1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // --- World Initialization ---
  const startWorld = async (prompt: string) => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
        const { worldConfig: config, initialLocation, initialDescription } = await initializeWorld(prompt);
        setWorldConfig(config);
        setLocationTitle(initialLocation);
        setDescription(initialDescription);
        
        // Generate Initial Image
        const image = await generateSceneImage(initialDescription, config);
        setBgImage(image);
        
        const initItem: HistoryItem = {
            id: `loc-${Date.now()}`,
            title: initialLocation,
            description: initialDescription,
            imageUrl: image,
            timestamp: Date.now()
        };
        
        setHistory([initItem]);
        setCurrentId(initItem.id);
        setHasStarted(true);
        playAudio(initialDescription);

    } catch (error) {
        console.error("Failed to start world", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startWorld(initPrompt);
  };

  const resetWorld = () => {
      setHasStarted(false);
      setWorldConfig(null);
      setHistory([]);
      setBgImage(null);
      setInitPrompt("");
      setPanPosition({x:0, y:0});
      setViewScale(1.1);
  };

  // --- Audio Logic ---
  const playAudio = async (text: string) => {
      if (!isPlayingAudio) return;

      if (audioSourceRef.current) {
          try { audioSourceRef.current.stop(); } catch (e) {}
      }

      const buffer = await generateNarratorSpeech(text);
      if (buffer) {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          }
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContextRef.current.destination);
          source.start();
          audioSourceRef.current = source;
      }
  }

  // --- Navigation Logic ---
  const executeNavigation = async (prompt: string) => {
    if (isLoading || !worldConfig) return;
    setIsLoading(true);

    try {
      const newScene = await generateSceneDescription(prompt, locationTitle, worldConfig, bgImage);
      
      setLocationTitle(newScene.title);
      setDescription(newScene.description);
      playAudio(newScene.description);

      const newImage = await generateSceneImage(newScene.description, worldConfig);
      
      const newItem: HistoryItem = {
          id: `loc-${Date.now()}`,
          title: newScene.title,
          description: newScene.description,
          imageUrl: newImage || bgImage, 
          timestamp: Date.now()
      };

      setHistory(prev => [...prev, newItem]);
      setCurrentId(newItem.id);

      if (newImage) {
        setBgImage(newImage);
        setViewScale(1.1);
        setPanPosition({ x: 0, y: 0 });
      }
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAction = useCallback((type: ActionType) => {
    let actionPrompt = "";
    switch (type) {
      case ActionType.EXPLORE: actionPrompt = "Move to a nearby area."; break;
      case ActionType.DEEP_DIVE: actionPrompt = "Enter or go deeper into the structure/area."; break;
      case ActionType.INSPECT: actionPrompt = "Examine the most interesting object closely."; break;
      case ActionType.SURFACE: actionPrompt = "Move back or leave the immediate area."; break;
    }
    executeNavigation(actionPrompt);
  }, [locationTitle, isLoading, bgImage, worldConfig]);

  const handleCustomAction = useCallback((text: string) => {
      executeNavigation(text);
  }, [locationTitle, isLoading, bgImage, worldConfig]);

  const handleRestoreHistory = (item: HistoryItem) => {
      if (isLoading) return;
      setLocationTitle(item.title);
      setDescription(item.description);
      setBgImage(item.imageUrl);
      setCurrentId(item.id);
      playAudio(item.description);
      setViewScale(1.1);
      setPanPosition({ x: 0, y: 0 });
  };

  const toggleAudio = () => {
      const newState = !isPlayingAudio;
      setIsPlayingAudio(newState);
      if (!newState && audioSourceRef.current) {
          try { audioSourceRef.current.stop(); } catch (e) {}
      }
  };

  // --- View Control Logic ---
  const getBounds = useCallback((scale: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const maxX = (w * (scale - 1)) / 2;
    const maxY = (h * (scale - 1)) / 2;
    return { maxX, maxY };
  }, []);

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  useEffect(() => {
      const enforceBounds = () => {
          const { maxX, maxY } = getBounds(viewScale);
          setPanPosition(prev => ({
              x: clamp(prev.x, -maxX, maxX),
              y: clamp(prev.y, -maxY, maxY)
          }));
      };
      enforceBounds();
      window.addEventListener('resize', enforceBounds);
      return () => window.removeEventListener('resize', enforceBounds);
  }, [viewScale, getBounds]);

  const handlePointerDown = (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('.glass-panel')) return;
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - panPosition.x, y: e.clientY - panPosition.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const rawX = e.clientX - dragStartRef.current.x;
      const rawY = e.clientY - dragStartRef.current.y;
      const { maxX, maxY } = getBounds(viewScale);
      setPanPosition({ x: clamp(rawX, -maxX, maxX), y: clamp(rawY, -maxY, maxY) });
  };

  const handlePointerUp = () => setIsDragging(false);

  // --- START SCREEN RENDER ---
  if (!hasStarted) {
      return (
        <div className="w-full min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 relative overflow-y-auto">
            <ParticleOverlay type="space" />
            
            <div className="relative z-20 max-w-6xl w-full flex flex-col items-center py-12">
                {/* Hero Header */}
                <div className="text-center mb-12 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-4 backdrop-blur-md">
                         <Sparkles size={14} className="text-emerald-400" />
                         <span className="text-[10px] uppercase tracking-widest text-slate-300">AI-Powered Exploration Engine</span>
                    </div>
                    <h1 className="font-heading text-5xl md:text-7xl text-white mb-4 tracking-widest drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        INFINITE<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">ODYSSEY</span>
                    </h1>
                    <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-light">
                        Explore limitless worlds generated in real-time. <br/>
                        Choose a destination below or imagine your own reality.
                    </p>
                </div>

                {/* Presets Grid */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => startWorld(preset.prompt)}
                            disabled={isLoading}
                            className={`
                                group relative h-80 rounded-2xl overflow-hidden border border-white/10 bg-black/50
                                transition-all duration-500 ease-out
                                ${preset.border} ${preset.shadow}
                                hover:-translate-y-2 hover:scale-[1.02]
                            `}
                        >
                            {/* Background Image */}
                            <div 
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                                style={{ backgroundImage: `url(${preset.image})` }}
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 group-hover:opacity-70 transition-opacity" />
                            
                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-end text-left">
                                <span className={`text-[10px] font-bold tracking-[0.2em] mb-2 ${preset.color}`}>
                                    {preset.tag}
                                </span>
                                <h3 className="font-heading text-2xl text-white mb-2 group-hover:text-white transition-colors">
                                    {preset.title}
                                </h3>
                                <div className="w-full h-0 group-hover:h-8 overflow-hidden transition-all duration-300">
                                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                                        <span>Initialize World</span>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 w-full max-w-lg mb-8 animate-fade-in-up opacity-50" style={{animationDelay: '0.2s'}}>
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-xs text-slate-500 uppercase tracking-widest">Or create your own</span>
                    <div className="h-px bg-white/10 flex-1" />
                </div>

                {/* Custom Input */}
                <form onSubmit={handleFormSubmit} className="w-full max-w-2xl relative group animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                     <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                     <div className="relative glass-panel p-2 rounded-2xl flex gap-2 shadow-2xl">
                        <div className="pl-4 flex items-center justify-center">
                            <Sparkles size={20} className="text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            value={initPrompt}
                            onChange={(e) => setInitPrompt(e.target.value)}
                            placeholder="Describe any world you can imagine... (e.g. 'A library made of clouds')"
                            className="flex-1 bg-transparent border-none text-slate-200 px-4 py-4 focus:outline-none placeholder:text-slate-600 text-lg font-light"
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !initPrompt.trim()}
                            className="bg-white text-black hover:bg-emerald-400 hover:text-black px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold tracking-wide"
                        >
                            BEGIN
                        </button>
                    </div>
                </form>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in-up">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                        <Sparkles size={64} className="text-emerald-400 relative z-10 animate-spin-slow" />
                    </div>
                    <p className="font-heading text-2xl text-white tracking-widest mt-8 animate-pulse">Constructing Reality...</p>
                    <p className="text-slate-400 text-sm mt-2">Generating textures, atmosphere, and lore</p>
                </div>
            )}
        </div>
      );
  }

  // --- MAIN APP RENDER ---
  return (
    <div 
      className={`relative w-full h-screen bg-[#000508] overflow-hidden touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: bgImage ? `url(${bgImage})` : 'none',
          opacity: isLoading ? 0.8 : 1,
          transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${viewScale})`,
          transition: isDragging ? 'opacity 0.5s ease' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease'
        }}
      >
        {!bgImage && <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black" />}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <ParticleOverlay type={worldConfig?.particleEffect || 'dust'} />

      <Interface 
        worldTitle={worldConfig?.worldTitle || "Unknown World"}
        title={locationTitle}
        description={description}
        isLoading={isLoading}
        onAction={handleAction}
        onCustomAction={handleCustomAction}
        isPlayingAudio={isPlayingAudio}
        onToggleAudio={toggleAudio}
        onZoomIn={() => setViewScale(s => Math.min(s + 0.25, 3.0))}
        onZoomOut={() => setViewScale(s => Math.max(s - 0.25, 1.0))}
        history={history}
        onRestoreHistory={handleRestoreHistory}
        onReset={resetWorld}
        currentId={currentId}
      />
    </div>
  );
};

export default App;