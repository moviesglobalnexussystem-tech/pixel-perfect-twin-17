import { useEffect, useRef } from "react";
import shaka from "shaka-player";

interface ShakaPlayerComponentProps {
  src: string;
  autoplay?: boolean;
  className?: string;
}

const ShakaPlayerComponent = ({ src, autoplay = true, className }: ShakaPlayerComponentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      console.error("Shaka Player is not supported in this browser.");
      return;
    }

    const video = videoRef.current;
    const player = new shaka.Player();
    playerRef.current = player;

    player.attach(video).then(() => {
      return player.load(src);
    }).then(() => {
      if (autoplay) {
        video.play().catch(() => {});
      }
    }).catch((err: any) => {
      console.error("Shaka Player error:", err);
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [src, autoplay]);

  return (
    <video
      ref={videoRef}
      className={className}
      style={{ width: "100%", height: "100%", background: "#000" }}
      controls
      autoPlay={autoplay}
      playsInline
    />
  );
};

export default ShakaPlayerComponent;
