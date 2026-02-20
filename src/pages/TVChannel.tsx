import { useState, useEffect } from "react";
import { subscribeTVChannels, subscribeLatestUpdates } from "@/lib/firebaseServices";
import type { TVChannelItem, LatestUpdateItem } from "@/data/adminData";
import ShakaPlayerComponent from "@/components/ShakaPlayerComponent";

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
      <div className="px-4 md:px-8 py-6">
        <h1 className="text-foreground text-xl font-bold mb-1">TV Channels</h1>
        <p className="text-muted-foreground text-xs mb-4">Watch live TV channels 24/7</p>
      </div>

      {activeChannel && activeChannel.streamLink && (
        <div className="px-4 md:px-8 mb-6">
          <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", maxHeight: "480px" }}>
            <ShakaPlayerComponent key={activeChannel.streamLink} src={activeChannel.streamLink} autoplay />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-foreground text-sm font-bold">{activeChannel.name}</span>
            <span className="text-muted-foreground text-xs">{activeChannel.category}</span>
            <button onClick={() => setActiveChannel(null)} className="ml-auto text-destructive text-xs hover:underline">Close Player</button>
          </div>
        </div>
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
