import { useRef, useEffect } from "react";
import Hls from "hls.js";

interface HLSPlayerProps {
  src: string;
  poster?: string;
}

const HLSPlayer = ({ src, poster }: HLSPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (src.includes(".m3u8")) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = src;
        video.play().catch(() => {});
      } else if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          video.play().catch(() => {});
        });
        return () => hls.destroy();
      }
    } else {
      video.src = src;
      video.play().catch(() => {});
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      playsInline
      controls
      poster={poster}
      className="w-full h-full object-contain bg-black"
    />
  );
};

export default HLSPlayer;
