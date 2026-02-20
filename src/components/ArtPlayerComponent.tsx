import { useEffect, useRef } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";

interface ArtPlayerComponentProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  className?: string;
}

const ArtPlayerComponent = ({ src, poster, autoplay = false, className }: ArtPlayerComponentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !src) return;

    const isHLS = src.includes(".m3u8");
    const isIframe = src.startsWith("http") && !src.includes(".m3u8") && !src.includes(".mp4") && src.includes("play.");

    const art = new Artplayer({
      container: containerRef.current,
      url: isIframe ? "" : src,
      poster: poster || "",
      autoplay,
      theme: "hsl(var(--primary))",
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      screenshot: false,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      hotkey: true,
      fastForward: true,
      lock: true,
      ...(isHLS && Hls.isSupported()
        ? {
            customType: {
              m3u8: (video: HTMLVideoElement, url: string) => {
                const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(url);
                hls.attachMedia(video);
                art.on("destroy", () => hls.destroy());
              },
            },
          }
        : {}),
    });

    artRef.current = art;

    return () => {
      if (artRef.current) {
        artRef.current.destroy(false);
        artRef.current = null;
      }
    };
  }, [src, poster, autoplay]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default ArtPlayerComponent;
