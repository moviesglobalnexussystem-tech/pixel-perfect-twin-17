import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Newspaper } from "lucide-react";
import { subscribeTVChannels, subscribeLatestUpdates } from "@/lib/firebaseServices";
import type { TVChannelItem, LatestUpdateItem } from "@/data/adminData";
import shaka from "shaka-player";
import logo from "@/assets/logo.png";
import LogoLoader from "@/components/LogoLoader";
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
    let cancelled = false;

    const init = async () => {
      // Destroy previous instance
      if (playerRef.current) {
        await playerRef.current.destroy();
        playerRef.current = null;
      }

      if (cancelled) return;

      const player = new shaka.Player();
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
          dash: { ignoreMinBufferTime: true },
        },
      });

      await player.attach(video);
      if (cancelled) return;

      video.muted = true;
      setLoading(true);

      await player.load(src);
      if (cancelled) return;

      setLoading(false);
      try {
        await video.play();
        setTimeout(() => { if (!cancelled) { video.muted = false; setMuted(false); } }, 300);
      } catch { /* autoplay blocked */ }
    };

    init().catch((err) => {
      if (!cancelled) {
        console.error("Player error:", err);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
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
  const location = useLocation();
  const [channels, setChannels] = useState<TVChannelItem[] | null>(null);
  const [activeChannel, setActiveChannel] = useState<TVChannelItem | null>(null);
  const [latestUpdates, setLatestUpdates] = useState<LatestUpdateItem[]>([]);
  const autoPlayedRef = useRef(false);

  const navState = location.state as { channelId?: string } | null;

  useEffect(() => {
    const unsub1 = subscribeTVChannels((chs) => {
      setChannels(chs);
      // Auto-select channel from search navigation
      if (navState?.channelId && !autoPlayedRef.current) {
        const target = chs.find(c => c.id === navState.channelId);
        if (target?.streamLink) {
          setActiveChannel(target);
          autoPlayedRef.current = true;
        }
      }
    });
    const unsub2 = subscribeLatestUpdates(setLatestUpdates);
    return () => { unsub1(); unsub2(); };
  }, [navState?.channelId]);

  if (channels === null) {
    return (
      <div className="min-h-screen bg-background">
        <LogoLoader text="Loading TV channels..." />
      </div>
    );
  }

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
        <div className="px-4 md:px-8 mb-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2">
          {channels.map((ch) => (
            <div
              key={ch.id}
              onClick={() => ch.streamLink && setActiveChannel(ch)}
              className={`bg-card border rounded-lg p-2 cursor-pointer transition-colors flex flex-col items-center text-center gap-1 ${activeChannel?.id === ch.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
            >
              {ch.logoUrl ? (
                <img src={ch.logoUrl} alt={ch.name} className="w-8 h-8 rounded-md object-cover" />
              ) : (
                <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center">
                  <span className="text-primary text-[9px] font-bold">TV</span>
                </div>
              )}
              <p className="text-foreground text-[10px] font-medium leading-tight line-clamp-1">{ch.name}</p>
              <p className="text-muted-foreground text-[8px] leading-tight">{ch.category}</p>
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
          <h2 className="text-foreground text-xs font-semibold tracking-tight mb-4 flex items-center gap-1.5"><Newspaper className="w-3.5 h-3.5 text-primary" /> Latest Updates</h2>
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
