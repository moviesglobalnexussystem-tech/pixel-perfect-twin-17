import { useState, useEffect, useRef, useCallback } from "react";
import { subscribeTVChannels, subscribeLatestUpdates } from "@/lib/firebaseServices";
import type { TVChannelItem, LatestUpdateItem } from "@/data/adminData";
import shaka from "shaka-player";
import logo from "@/assets/logo.png";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2 } from "lucide-react";

interface TVPlayerProps {
  src: string;
  name: string;
  category: string;
  onClose: () => void;
}

const TVPlayer = ({ src, name, category, onClose }: TVPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);

  // Initialize Shaka Player
  useEffect(() => {
    if (!videoRef.current || !src) return;
    shaka.polyfill.installAll();
    if (!shaka.Player.isBrowserSupported()) return;

    const video = videoRef.current;
    // Pass video directly to constructor — skips async attach step
    const player = new shaka.Player(video);
    playerRef.current = player;

    player.configure({
      streaming: {
        bufferingGoal: 2,
        rebufferingGoal: 0.5,
        bufferBehind: 10,
        segmentPrefetchLimit: 2,
        retryParameters: { maxAttempts: 3, baseDelay: 200, backoffFactor: 1.5, fuzzFactor: 0.3 },
      },
      manifest: {
        retryParameters: { maxAttempts: 3, baseDelay: 200, backoffFactor: 1.5, fuzzFactor: 0.3 },
        dash: {
          ignoreMinBufferTime: true,
        },
      },
    });

    // Muted autoplay is always allowed by browsers
    video.muted = true;

    player.load(src).then(() => {
      setLoading(false);
      video.play().then(() => {
        // Unmute after playback starts
        setTimeout(() => { video.muted = false; setMuted(false); }, 300);
      }).catch(() => {});
    }).catch((err: any) => {
      console.error("Player error:", err);
      setLoading(false);
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [src]);

  // Sync play state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    if (val === 0) { v.muted = true; setMuted(true); }
    else if (v.muted) { v.muted = false; setMuted(false); }
  };

  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [resetHideTimer]);

  return (
    <div className="mb-6">
      <div
        ref={wrapperRef}
        className="relative w-full bg-black overflow-hidden md:mx-4 md:rounded-2xl md:border md:border-border md:shadow-2xl md:shadow-black/50 group select-none"
        style={{ aspectRatio: "16/9", maxHeight: isFullscreen ? "100vh" : "520px" }}
        onMouseMove={resetHideTimer}
        onTouchStart={resetHideTimer}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover bg-black"
          playsInline
          autoPlay
          onClick={togglePlay}
        />

        {/* Watermark */}
        <div className="absolute top-3 right-3 z-30 pointer-events-none opacity-50">
          <img src={logo} alt="LUO FILM" className="w-8 h-8 rounded-md object-contain drop-shadow-lg" />
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}

        {/* LIVE dot */}
        <div className="absolute top-3 left-3 z-30">
          <span className="w-2.5 h-2.5 bg-destructive rounded-full animate-pulse block shadow-lg shadow-destructive/50" />
        </div>

        {/* Custom controls overlay */}
        <div className={`absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
          <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-3 px-4">
            {/* Channel info + controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Play/Pause */}
                <button onClick={togglePlay} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors">
                  {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button onClick={toggleMute} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                    {muted || volume === 0 ? <VolumeX className="w-4 h-4 text-white/80" /> : <Volume2 className="w-4 h-4 text-white/80" />}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={muted ? 0 : volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-0 group-hover/vol:w-16 transition-all duration-200 accent-primary h-1 cursor-pointer opacity-0 group-hover/vol:opacity-100"
                  />
                </div>

                {/* Channel name */}
                <span className="text-white/90 text-xs font-semibold truncate">{name}</span>
                <span className="text-white/50 text-[10px] bg-white/10 px-2 py-0.5 rounded-full shrink-0">{category}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                  {isFullscreen ? <Minimize className="w-4 h-4 text-white/80" /> : <Maximize className="w-4 h-4 text-white/80" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 px-4 md:px-8">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-foreground text-sm font-bold">{name}</span>
        </div>
        <span className="text-muted-foreground text-xs bg-secondary px-2 py-0.5 rounded-full">{category}</span>
        <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-destructive text-xs font-medium transition-colors">✕ Close</button>
      </div>
    </div>
  );
};


const TVChannel = () => {
  const [channels, setChannels] = useState<TVChannelItem[]>([]);
  const [activeChannel, setActiveChannel] = useState<TVChannelItem | null>(null);
  const [latestUpdates, setLatestUpdates] = useState<LatestUpdateItem[]>([]);

  useEffect(() => {
    const unsub1 = subscribeTVChannels(setChannels);
    const unsub2 = subscribeLatestUpdates(setLatestUpdates);
    return () => { unsub1(); unsub2(); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="h-3" />

      {activeChannel && activeChannel.streamLink && (
        <TVPlayer
          src={activeChannel.streamLink}
          name={activeChannel.name}
          category={activeChannel.category}
          onClose={() => setActiveChannel(null)}
        />
      )}

      {channels.length > 0 ? (
        <div className="px-4 md:px-8 mb-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {channels.map((ch) => (
            <div
              key={ch.id}
              onClick={() => ch.streamLink && setActiveChannel(ch)}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 cursor-pointer transition-colors"
            >
              {ch.logoUrl ? (
                <img src={ch.logoUrl} alt={ch.name} className="w-10 h-10 rounded-lg object-cover mb-3" />
              ) : (
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary text-xs font-bold">TV</span>
                </div>
              )}
              <p className="text-foreground text-xs font-medium">{ch.name}</p>
              <p className="text-muted-foreground text-[10px]">{ch.category}</p>
              {ch.isLive && (
                <span className="inline-flex items-center gap-1 mt-2 text-[9px] text-destructive font-medium">
                  <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />LIVE
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <span className="text-4xl mb-4">📡</span>
          <p className="text-sm font-medium">No TV channels available yet</p>
          <p className="text-xs mt-1">Admin can add channels from the dashboard</p>
        </div>
      )}

      {/* Latest Updates Section */}
      {latestUpdates.length > 0 && (
        <div className="px-4 md:px-8 mb-8">
          <h2 className="text-foreground text-lg font-bold mb-4">📰 Latest Updates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {latestUpdates.map((update) => (
              <a key={update.id} href={update.linkUrl || "#"} target={update.linkUrl ? "_blank" : undefined} rel="noopener noreferrer"
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group">
                {update.imageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img src={update.imageUrl} alt={update.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="text-foreground text-xs font-bold line-clamp-2">{update.title}</h3>
                  {update.description && <p className="text-muted-foreground text-[10px] mt-1 line-clamp-2">{update.description}</p>}
                  <p className="text-muted-foreground text-[9px] mt-2">{new Date(update.createdAt).toLocaleDateString()}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TVChannel;
