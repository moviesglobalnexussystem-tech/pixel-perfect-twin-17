import { useState, useEffect, useRef } from "react";
import { subscribeTVChannels, subscribeLatestUpdates } from "@/lib/firebaseServices";
import type { TVChannelItem, LatestUpdateItem } from "@/data/adminData";
import Artplayer from "artplayer";
import Hls from "hls.js";
import logo from "@/assets/logo.png";

interface TVPlayerProps {
  src: string;
  name: string;
  category: string;
  onClose: () => void;
}

const TVPlayer = ({ src, name, category, onClose }: TVPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !src) return;

    const isHLS = src.includes(".m3u8");

    const art = new Artplayer({
      container: containerRef.current,
      url: src,
      autoplay: true,
      theme: "hsl(135, 100%, 37%)",
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      hotkey: true,
      fastForward: true,
      lock: true,
      isLive: isHLS,
      layers: [
        {
          name: "watermark",
          html: `<img src="${logo}" style="width:32px;height:32px;border-radius:6px;opacity:0.6;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));" />`,
          tooltip: "LUO FILM",
          style: {
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: "50",
            pointerEvents: "none",
          },
        },
      ],
      ...(isHLS && Hls.isSupported()
        ? {
            customType: {
              m3u8: (video: HTMLVideoElement, url: string) => {
                const hls = new Hls({
                  enableWorker: true,
                  lowLatencyMode: true,
                  maxBufferLength: 10,
                  maxMaxBufferLength: 20,
                  startFragPrefetch: true,
                  testBandwidth: true,
                });
                hls.loadSource(url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  video.play().catch(() => {});
                });
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
  }, [src]);

  return (
    <div className="px-4 md:px-8 mb-6">
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/50"
        style={{ aspectRatio: "16/9", maxHeight: "520px" }}
      />
      <div className="mt-3 flex items-center gap-3 px-1">
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
