import { useEffect, useRef } from "react";
import Plyr from "plyr";
import Hls from "hls.js";
import "plyr/dist/plyr.css";

interface PlyrPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  className?: string;
}

const PlyrPlayer = ({ src, poster, autoplay = false, className }: PlyrPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const video = videoRef.current;

    // Clean up previous instances
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }

    const isHLS = src.includes(".m3u8");

    const player = new Plyr(video, {
      controls: [
        "play-large", "play", "rewind", "fast-forward", "progress",
        "current-time", "duration", "mute", "volume", "captions",
        "settings", "pip", "airplay", "fullscreen",
      ],
      settings: ["captions", "quality", "speed"],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      autoplay,
      ratio: "16:9",
    } as Plyr.Options);

    playerRef.current = player;

    if (isHLS && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        // Expose available quality levels via Plyr quality event
        const availableQualities = data.levels.map((l) => l.height).filter(Boolean);
        availableQualities.unshift(0); // 0 = Auto

        // Listen for Plyr's quality change event
        player.on("qualitychange" as any, (evt: any) => {
          const newQuality = evt.detail.plyr.quality;
          if (newQuality === 0) {
            hls.currentLevel = -1;
          } else {
            const levelIndex = hls.levels.findIndex((l) => l.height === newQuality);
            if (levelIndex !== -1) hls.currentLevel = levelIndex;
          }
        });

        if (autoplay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
            case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
            default: hls.destroy(); break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl") && isHLS) {
      // Safari native HLS
      video.src = src;
      if (autoplay) video.play().catch(() => {});
    } else {
      // Direct MP4 / iframe
      video.src = src;
      if (autoplay) video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }
    };
  }, [src, poster, autoplay]);

  return (
    <div className={`plyr-glass-player w-full h-full ${className || ""}`}>
      <video
        ref={videoRef}
        playsInline
        crossOrigin="anonymous"
        className="w-full h-full"
      />
    </div>
  );
};

export default PlyrPlayer;
