import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Play, Download, DollarSign, Share2, Timer, X, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PlyrPlayer from "@/components/PlyrPlayer";
import {
  subscribeSharedLinks, addSharedLink, subscribeEpisodes,
  subscribeMovies, type SharedLink
} from "@/lib/firebaseServices";
import type { EpisodeItem, MovieItem } from "@/data/adminData";

const DOWNLOAD_PROXY = "https://download.mainplatform-nexus.workers.dev/?url=";

const AgentWatch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { agentData } = useAuth();
  const { toast } = useToast();

  const state = location.state as {
    title?: string;
    image?: string;
    streamLink?: string;
    downloadLink?: string;
    type?: string;
    genre?: string;
    firebaseId?: string;
    episode?: string;
    seriesId?: string;
  } | null;

  const [showSellModal, setShowSellModal] = useState(false);
  const [sellPrice, setSellPrice] = useState("");
  const [sellDuration, setSellDuration] = useState("60");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeItem | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<MovieItem[]>([]);

  const contentId = state?.firebaseId || id || "";
  const title = state?.title || "Content";
  const image = state?.image || "/placeholder.svg";
  const streamLink = currentEpisode?.streamLink || state?.streamLink || "";
  const downloadLink = currentEpisode?.downloadLink || currentEpisode?.streamLink || state?.downloadLink || state?.streamLink || "";

  useEffect(() => {
    if (!agentData) return;
    const unsub = subscribeSharedLinks(agentData.id, setSharedLinks);
    return unsub;
  }, [agentData]);

  useEffect(() => {
    const seriesId = state?.seriesId || contentId;
    if (!seriesId) return;
    const unsub = subscribeEpisodes((allEps) => {
      const filtered = allEps
        .filter(ep => ep.seriesId === seriesId && ep.isAgent)
        .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
      setEpisodes(filtered);
      if (!currentEpisode && filtered.length > 0) setCurrentEpisode(filtered[0]);
    });
    return unsub;
  }, [contentId]);

  useEffect(() => {
    const unsub = subscribeMovies((movies) => {
      setRelatedMovies(movies.filter(m => m.isAgent && m.id !== contentId).slice(0, 6));
    });
    return unsub;
  }, [contentId]);

  if (!agentData) {
    navigate("/agent");
    return null;
  }

  const handleSell = async () => {
    if (!sellPrice || !agentData) return;
    const dur = parseInt(sellDuration);
    if (dur < 30) {
      toast({ title: "Minimum 30 minutes", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const shareCode = `${agentData.agentId}-${String(sharedLinks.length + 1).padStart(3, "0")}`;
      await addSharedLink({
        agentId: agentData.agentId,
        agentDocId: agentData.id,
        contentType: state?.type?.toLowerCase() as any || "movie",
        contentId,
        contentTitle: `${title}${state?.episode ? ` ${state.episode}` : ""}`,
        price: parseInt(sellPrice),
        views: 0,
        earnings: 0,
        shareCode,
        active: true,
        streamLink: streamLink || state?.streamLink,
        posterUrl: image,
        accessDuration: dur,
        agentName: agentData.name,
      } as any);
      setShowSellModal(false);
      toast({ title: "Sell link created!", description: `Code: ${shareCode} • ${dur} min access` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleCopyLink = (shareCode: string, linkId: string) => {
    const link = `${window.location.origin}/a/${shareCode}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = () => {
    if (!downloadLink) {
      toast({ title: "No download available", variant: "destructive" });
      return;
    }
    const fileName = currentEpisode
      ? `${title} - Episode ${currentEpisode.episodeNumber}.mp4`
      : `${title}.mp4`;

    setIsDownloading(true);
    toast({ title: "Download starting...", description: fileName });

    const proxiedUrl = `${DOWNLOAD_PROXY}${encodeURIComponent(downloadLink)}`;
    const a = document.createElement("a");
    a.href = proxiedUrl;
    a.download = fileName;
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      setIsDownloading(false);
    }, 1500);
  };

  const contentSharedLinks = sharedLinks.filter(l => l.contentId === contentId);

  return (
    <div className="min-h-screen bg-background">
      <button onClick={() => navigate("/agent")} className="flex items-center gap-1.5 px-4 py-2.5 text-muted-foreground hover:text-foreground text-xs transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Player */}
      <div className="relative w-full bg-black" style={{ aspectRatio: "16/9", maxHeight: "480px" }}>
        {streamLink ? (
          <PlyrPlayer key={`${contentId}-${currentEpisode?.id || "main"}`} src={streamLink} poster={image} autoplay />
        ) : (
          <div className="w-full h-full relative">
            <img src={image} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Play className="w-12 h-12 text-muted-foreground opacity-40" />
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        <button onClick={() => setShowSellModal(true)}
          className="flex-1 flex flex-col items-center gap-0.5 bg-gradient-to-br from-primary to-primary/70 border border-primary/30 rounded-lg py-2 hover:shadow-[0_2px_12px_hsl(135_100%_37%/0.4)] transition-all active:scale-95">
          <DollarSign className="w-4 h-4 text-primary-foreground" />
          <span className="text-[10px] font-bold text-primary-foreground">Sell</span>
        </button>
        <button onClick={handleDownload} disabled={isDownloading}
          className="flex-1 flex flex-col items-center gap-0.5 bg-card border border-border rounded-lg py-2 hover:bg-secondary transition-colors disabled:opacity-50">
          <Download className={`w-4 h-4 text-muted-foreground ${isDownloading ? "animate-bounce" : ""}`} />
          <span className="text-[10px] font-medium text-muted-foreground">{isDownloading ? "Starting..." : "Download"}</span>
        </button>
      </div>

      {/* Episode selector */}
      {episodes.length > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-card border border-border rounded-xl p-3">
            <h3 className="text-foreground text-xs font-semibold mb-2">Episodes</h3>
            <div className="grid grid-cols-8 gap-1.5">
              {episodes.map(ep => (
                <button key={ep.id} onClick={() => setCurrentEpisode(ep)}
                  className={`flex flex-col items-center justify-center rounded-lg border text-[10px] font-medium py-1.5 transition-colors
                    ${currentEpisode?.id === ep.id ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary/40 text-foreground hover:bg-secondary"}`}>
                  {ep.episodeNumber}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Title & Info */}
      <div className="px-4 py-3">
        <h1 className="text-foreground text-lg font-bold">{title}</h1>
        {state?.episode && <p className="text-muted-foreground text-xs mt-0.5">{state.episode}</p>}
        {state?.genre && <p className="text-muted-foreground text-xs mt-1">{state.genre}</p>}
      </div>

      {/* Active sell links */}
      {contentSharedLinks.length > 0 && (
        <div className="px-4 pb-4">
          <h3 className="text-foreground text-sm font-semibold mb-2">Your Sell Links</h3>
          <div className="space-y-2">
            {contentSharedLinks.map(link => (
              <div key={link.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${link.active ? "bg-primary" : "bg-muted-foreground"}`} />
                    <span className="text-foreground text-xs font-medium truncate">UGX {link.price.toLocaleString()}</span>
                    <span className="text-muted-foreground text-[10px]">• {(link as any).accessDuration || 10} min</span>
                  </div>
                  <p className="text-muted-foreground text-[10px] mt-0.5">Views: {link.views} • Earned: UGX {(link.earnings || 0).toLocaleString()}</p>
                </div>
                <button onClick={() => handleCopyLink(link.shareCode, link.id)} className="bg-secondary p-2 rounded-lg">
                  {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related agent content */}
      {relatedMovies.length > 0 && (
        <div className="px-4 pb-6">
          <h2 className="text-foreground text-sm font-bold mb-3">More Agent Content</h2>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
            {relatedMovies.map(m => (
              <div key={m.id} className="flex-shrink-0 w-[110px] cursor-pointer group"
                onClick={() => navigate(`/agent-watch/${m.id}`, {
                  state: { firebaseId: m.id, title: m.name, image: m.posterUrl, streamLink: m.streamLink, downloadLink: m.downloadLink, type: "Movie", genre: m.genre }
                })}>
                <div className="relative rounded-md overflow-hidden mb-1 aspect-[2/3]">
                  <img src={m.posterUrl || "/placeholder.svg"} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-foreground text-[10px] font-medium line-clamp-1">{m.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowSellModal(false)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Sell Content</h3>
              <button onClick={() => setShowSellModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-secondary rounded-lg p-3 mb-4">
              <p className="text-foreground text-xs font-medium">{title}</p>
              <p className="text-muted-foreground text-[10px]">{state?.type}{state?.episode ? ` • ${state.episode}` : ""}</p>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-muted-foreground text-[10px] block mb-1">Set Price (UGX)</label>
                <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="e.g. 2000"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] block mb-1">Access Duration (minutes) — Min 30</label>
                <input type="number" value={sellDuration} onChange={e => setSellDuration(e.target.value)} placeholder="60" min={30}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                <div className="flex gap-1.5 mt-1.5">
                  {[30, 60, 120, 1440].map(m => (
                    <button key={m} onClick={() => setSellDuration(String(m))}
                      className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${sellDuration === String(m) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                      {m < 60 ? `${m}m` : m < 1440 ? `${m / 60}h` : "24h"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button className="w-full text-xs h-9" onClick={handleSell} disabled={isProcessing || !sellPrice}>
              {isProcessing ? "Creating..." : "Create Sell Link"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentWatch;
