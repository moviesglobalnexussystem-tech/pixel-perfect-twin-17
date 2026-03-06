import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Play, MessageSquare, Share2, Monitor, Smartphone, Star, ArrowLeft, Download, Send, Trash2, Lock } from "lucide-react";
import { subscribeMovies, subscribeEpisodes, subscribeComments, addComment, deleteComment, addWatchLater, subscribeWatchLater, deleteWatchLater, getUserByUid } from "@/lib/firebaseServices";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EpisodeItem, CommentItem, WatchLaterItem, UserItem } from "@/data/adminData";
import SportPlayer from "@/components/SportPlayer";
import PlyrPlayer from "@/components/PlyrPlayer";
import { useState, useEffect } from "react";
import LogoLoader from "@/components/LogoLoader";
import type { Drama } from "@/data/dramas";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SubscribeModal from "@/components/SubscribeModal";

const ADMIN_EMAIL = "mainplatform.nexus@gmail.com";
const DOWNLOAD_PROXY = "https://download.mainplatform-nexus.workers.dev/?url=";

// ==================== SPORT WATCH ====================
const SportWatch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    matchId?: string;
    playPath?: string;
    playSource?: { title: string; path: string }[];
    homeTeam?: string;
    awayTeam?: string;
    highlights?: { title: string; path: string; cover?: { url: string } }[];
    isLive?: boolean;
  } | null;

  const [activeChannel, setActiveChannel] = useState(-1);
  const [highlightUrl, setHighlightUrl] = useState<string | null>(null);

  const playPath = state?.playPath || "";
  const playSource = state?.playSource || [];
  const highlights = state?.highlights || [];
  const title = state?.homeTeam && state?.awayTeam
    ? `${state.homeTeam} vs ${state.awayTeam}`
    : "Live Sport";

  const isPlayingHighlight = !!highlightUrl;
  const selectedSource = activeChannel >= 0 && !isPlayingHighlight ? playSource[activeChannel] : null;
  const isIframeSource = selectedSource?.path?.includes("http") && !selectedSource?.path?.includes(".m3u8");
  const currentVideoUrl = isPlayingHighlight
    ? highlightUrl!
    : activeChannel === -1
      ? playPath
      : (isIframeSource ? "" : selectedSource?.path || "");
  const iframeUrl = !isPlayingHighlight && isIframeSource ? selectedSource?.path : "";

  return (
    <div className="min-h-screen bg-background">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-4 py-2.5 text-muted-foreground hover:text-foreground text-xs transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          <div className="relative w-full bg-black" style={{ aspectRatio: "16/9", maxHeight: "520px" }}>
            {iframeUrl ? (
              <iframe src={iframeUrl} className="w-full h-full border-0" allowFullScreen allow="autoplay; encrypted-media; fullscreen" title="Live Stream" />
            ) : currentVideoUrl ? (
              state?.isLive && !isPlayingHighlight ? (
                <SportPlayer key={currentVideoUrl} src={currentVideoUrl} />
              ) : (
                <PlyrPlayer key={currentVideoUrl} src={currentVideoUrl} autoplay />
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Play className="w-10 h-10 opacity-30" />
                <p className="text-sm">No stream available. Select a channel below.</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border overflow-x-auto">
            {playPath && (
              <button onClick={() => { setActiveChannel(-1); setHighlightUrl(null); }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${activeChannel === -1 && !highlightUrl ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                🔴 Main Stream
              </button>
            )}
            {playSource.map((src, i) => (
              <button key={i} onClick={() => { setActiveChannel(i); setHighlightUrl(null); }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${activeChannel === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {src.title || `Channel ${i + 1}`}
              </button>
            ))}
          </div>
          <div className="px-4 py-3">
            <h1 className="text-foreground text-lg font-bold mb-2">{title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">LIVE SPORT</span>
              {currentVideoUrl && <span className="text-primary">● {isPlayingHighlight ? "Highlight" : "Stream"} active</span>}
            </div>
          </div>
          {highlights.length > 0 && (
            <div className="px-4 py-3 border-t border-border">
              <h2 className="text-foreground text-base font-bold mb-3">Highlights</h2>
              <div className="space-y-2">
                {highlights.map((h, i) => (
                  <div key={i} className="flex gap-3 p-2 rounded cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => { if (h.path) { setHighlightUrl(h.path); setActiveChannel(-2); } }}>
                    {h.cover?.url && <img src={h.cover.url} alt={h.title} className="w-24 h-14 object-cover rounded" />}
                    <div className="flex-1">
                      <p className="text-foreground text-xs font-medium line-clamp-2">{h.title}</p>
                      <Play className="w-3 h-3 text-primary mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== HELPERS ====================
const checkUserSubscription = (userDoc: UserItem | null, isAdmin: boolean): boolean => {
  if (isAdmin) return true; // admin always has access
  if (!userDoc) return false;
  if (!userDoc.subscription || !userDoc.subscriptionExpiry) return false;
  const expiry = new Date(userDoc.subscriptionExpiry);
  return expiry.getTime() > Date.now() && userDoc.status !== "blocked";
};

// Download using CORS proxy - no new tab, real filename
const handleProxyDownload = (videoUrl: string, fileName: string) => {
  if (!videoUrl) return;
  const proxiedUrl = `${DOWNLOAD_PROXY}${encodeURIComponent(videoUrl)}`;
  const a = document.createElement("a");
  a.href = proxiedUrl;
  a.download = fileName;
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 1000);
};

// ==================== DRAMA WATCH ====================
const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"episodes" | "highlights">("episodes");
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeItem | null>(null);
  const [recommended, setRecommended] = useState<Drama[]>([]);
  const [drama, setDrama] = useState<Drama | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [watchLaterItems, setWatchLaterItems] = useState<WatchLaterItem[]>([]);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribeMode, setSubscribeMode] = useState<"user" | "agent">("user");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userDoc, setUserDoc] = useState<UserItem | null>(null);
  const isSport = id?.startsWith("sport-");

  const isAdmin = user?.email === ADMIN_EMAIL;

  const firebaseState = location.state as {
    firebaseId?: string;
    title?: string;
    image?: string;
    streamLink?: string;
    downloadLink?: string;
    episodes?: string;
    genre?: string;
    rating?: number;
    description?: string;
    actors?: string;
    isVip?: boolean;
    isHotDrama?: boolean;
    isOriginal?: boolean;
    isAgent?: boolean;
    agentMarkedAt?: string | null;
  } | null;

  // Load user doc
  useEffect(() => {
    if (!user) { setUserDoc(null); return; }
    getUserByUid(user.uid).then(d => setUserDoc(d));
  }, [user]);

  const hasSubscription = checkUserSubscription(userDoc, isAdmin);

  // Reset ALL state when id changes (critical fix for player not changing)
  useEffect(() => {
    setDrama(null);
    setCurrentEpisode(null);
    setEpisodes([]);
    setComments([]);
    setShowComments(false);
    setIsLoading(true);
  }, [id]);

  // Load content
  useEffect(() => {
    if (isSport || !id) return;

    const loadContent = async () => {
      setIsLoading(true);
      if (firebaseState?.firebaseId) {
        setDrama({
          id: Number(id) || 9999,
          title: firebaseState.title || "Unknown",
          image: firebaseState.image || "/placeholder.svg",
          episodes: firebaseState.episodes,
          streamLink: firebaseState.streamLink,
          genre: firebaseState.genre,
          rating: firebaseState.rating,
          description: firebaseState.description,
          actors: firebaseState.actors,
          isVip: firebaseState.isVip,
          isHotDrama: firebaseState.isHotDrama,
          isOriginal: firebaseState.isOriginal,
          firebaseId: firebaseState.firebaseId,
          isAgent: firebaseState.isAgent,
          agentMarkedAt: firebaseState.agentMarkedAt,
          downloadLink: firebaseState.downloadLink,
        });
      } else {
        try {
          const seriesDoc = await getDoc(doc(db, "series", id));
          if (seriesDoc.exists()) {
            const s = seriesDoc.data();
            setDrama({
              id: 9999, title: s.name || "Unknown", image: s.posterUrl || "/placeholder.svg",
              episodes: `${s.totalEpisodes || 0} Episodes`, genre: s.genre, rating: s.rating,
              description: s.description, actors: s.actors, isVip: s.isVip,
              isHotDrama: s.isHotDrama, isOriginal: s.isOriginal, firebaseId: id,
            });
          } else {
            const movieDoc = await getDoc(doc(db, "movies", id));
            if (movieDoc.exists()) {
              const m = movieDoc.data();
              setDrama({
                id: 9999, title: m.name || "Unknown", image: m.posterUrl || "/placeholder.svg",
                streamLink: m.streamLink, downloadLink: m.downloadLink, genre: m.genre,
                rating: m.rating, description: m.description, actors: m.actors,
                isVip: m.isVip, isHotDrama: m.isHotDrama, isOriginal: m.isOriginal,
                firebaseId: id, isAgent: m.isAgent, agentMarkedAt: m.agentMarkedAt,
              });
            }
          }
        } catch (err) {
          console.error("Error loading content:", err);
        }
      }
      setIsLoading(false);
    };

    loadContent();

    const unsub1 = subscribeMovies((movies) => {
      const sorted = [...movies].sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setRecommended(sorted.filter(m => !m.isAgent).slice(0, 7).map((m, i) => ({
        id: i + 6000, title: m.name, image: m.posterUrl || "/placeholder.svg",
        firebaseId: m.id, streamLink: m.streamLink, genre: m.genre,
        rating: m.rating, description: m.description, downloadLink: m.downloadLink,
        createdAt: m.createdAt,
      })));
    });
    return () => { unsub1(); };
  }, [id, isSport]);

  // Episodes
  useEffect(() => {
    const contentId = firebaseState?.firebaseId || id;
    if (!contentId || isSport) return;
    const unsub = subscribeEpisodes((allEps) => {
      const filtered = allEps
        .filter(ep => ep.seriesId === contentId)
        .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
      setEpisodes(filtered);
      if (!currentEpisode && filtered.length > 0 && filtered[0].streamLink) {
        setCurrentEpisode(filtered[0]);
      }
    });
    return unsub;
  }, [id, firebaseState?.firebaseId, isSport]);

  // Comments
  useEffect(() => {
    if (!id) return;
    const contentId = firebaseState?.firebaseId || id;
    const unsub = subscribeComments(contentId, setComments);
    return unsub;
  }, [id, firebaseState?.firebaseId]);

  // Watch later
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeWatchLater(user.uid, setWatchLaterItems);
    return unsub;
  }, [user]);

  if (isSport) return <SportWatch />;

  if (isLoading || (!drama && firebaseState?.firebaseId)) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><LogoLoader text="Loading content..." /></div>;
  }

  if (!drama) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <span className="text-4xl">🎬</span>
        <p className="text-muted-foreground text-sm">Content not found</p>
        <button onClick={() => navigate(-1)} className="text-primary text-xs hover:underline">Go back</button>
      </div>
    );
  }

  const isAgentContent = drama.isAgent;
  const agentMarkedDate = drama.agentMarkedAt ? new Date(drama.agentMarkedAt) : null;
  const daysSinceMarked = agentMarkedDate ? Math.floor((Date.now() - agentMarkedDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const isStillOnAgent = isAgentContent && daysSinceMarked < 5;

  const actorList = drama.actors ? drama.actors.split(",").map(a => {
    const trimmed = a.trim();
    const parts = trimmed.split("|");
    return { name: parts[0]?.trim() || "", image: parts[1]?.trim() || "" };
  }).filter(a => a.name) : [];
  const genreList = drama.genre ? drama.genre.split(",").map(g => g.trim()).filter(Boolean) : [];

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) {
      if (!user) toast({ title: "Login required", description: "Please login to comment", variant: "destructive" });
      return;
    }
    try {
      const contentId = firebaseState?.firebaseId || id || "";
      await addComment({
        contentId, userId: user.uid,
        userName: user.displayName || user.email || "User",
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
      } as any);
      setNewComment("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleWatchLater = async () => {
    if (!user) {
      toast({ title: "Login required", variant: "destructive" });
      return;
    }
    const contentId = firebaseState?.firebaseId || id || "";
    const existing = watchLaterItems.find(w => w.contentId === contentId);
    if (existing) {
      await deleteWatchLater(existing.id);
      toast({ title: "Removed from Watch Later" });
    } else {
      await addWatchLater({
        userId: user.uid, contentId,
        contentTitle: drama.title,
        contentImage: drama.image,
        contentType: "movie",
        createdAt: new Date().toISOString(),
      } as any);
      toast({ title: "Added to Watch Later" });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: drama.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!" });
    }
  };

  const handleDownload = () => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to download", variant: "destructive" });
      return;
    }
    if (!hasSubscription) {
      toast({ title: "Subscription required", variant: "destructive" });
      setShowSubscribe(true);
      return;
    }
    const rawUrl = currentEpisode?.downloadLink || currentEpisode?.streamLink
      || (drama as any).downloadLink || drama.streamLink;

    if (!rawUrl) {
      toast({ title: "No download available", variant: "destructive" });
      return;
    }

    const fileName = currentEpisode
      ? `${drama.title} - Episode ${currentEpisode.episodeNumber}.mp4`
      : `${drama.title}.mp4`;

    setIsDownloading(true);
    toast({ title: "Download starting...", description: fileName });
    handleProxyDownload(rawUrl, fileName);
    setTimeout(() => setIsDownloading(false), 2000);
  };

  // Require subscription to play & download (admin always passes)
  const requiresSubscription = !user || !hasSubscription;

  // Current video src (for player key — critical for switching)
  const currentVideoSrc = currentEpisode?.streamLink || drama.streamLink || "";

  return (
    <div className="min-h-screen bg-background">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-4 py-2.5 text-muted-foreground hover:text-foreground text-xs transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          {/* Video Player */}
          <div className="relative w-full bg-black" style={{ aspectRatio: "16/9", maxHeight: "520px" }}>
            {requiresSubscription ? (
              <div className="w-full h-full relative">
                <img src={drama.image} alt={drama.title} className="w-full h-full object-cover blur-sm" />
                <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-3">
                  <Lock className="w-12 h-12 text-primary" />
                  <p className="text-foreground text-sm font-bold">
                    {!user ? "Login & Subscribe to Watch" : "Subscribe to Watch"}
                  </p>
                  <p className="text-muted-foreground text-xs text-center px-8">
                    {isStillOnAgent
                      ? "This is exclusive Agent content. Subscribe to Agent plan to watch."
                      : "Get a subscription plan to enjoy unlimited streaming"}
                  </p>
                  <button onClick={() => { setSubscribeMode(isStillOnAgent ? "agent" : "user"); setShowSubscribe(true); }}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-xs font-bold hover:bg-primary/90">
                    {isStillOnAgent ? "Get Agent Plan" : "Subscribe Now"}
                  </button>
                </div>
              </div>
            ) : currentVideoSrc ? (
              <PlyrPlayer
                key={`${id}-${currentEpisode?.id || "movie"}`}
                src={currentVideoSrc}
                poster={drama.image}
                autoplay
              />
            ) : (
              <>
                <img src={drama.image} alt={drama.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Play className="w-12 h-12 opacity-40 mx-auto mb-2" />
                    <p className="text-xs">No stream link available</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-1.5 px-4 py-2">
            <button onClick={handleShare} className="flex-1 flex flex-col items-center gap-0.5 bg-card border border-border rounded-lg py-1.5 hover:bg-secondary transition-colors">
              <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[9px] font-medium text-muted-foreground">Share</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex-1 flex flex-col items-center gap-0.5 bg-card border border-border rounded-lg py-1.5 hover:bg-secondary transition-colors">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[9px] font-medium text-muted-foreground">{comments.length} Comments</span>
            </button>
            <button onClick={handleDownload} disabled={isDownloading}
              className="flex-1 flex flex-col items-center gap-0.5 bg-gradient-to-br from-primary to-primary/70 border border-primary/30 rounded-lg py-1.5 hover:shadow-[0_2px_12px_hsl(135_100%_37%/0.4)] transition-all active:scale-95 disabled:opacity-50">
              <Download className={`w-3.5 h-3.5 text-primary-foreground ${isDownloading ? "animate-bounce" : ""}`} />
              <span className="text-[9px] font-bold text-primary-foreground">{isDownloading ? "Starting..." : "Download"}</span>
            </button>
          </div>

          {/* Episodes Grid - Mobile */}
          {drama.episodes && (
            <div className="lg:hidden px-4 pb-3">
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-foreground text-xs font-semibold">Episodes</h3>
                  <span className="text-muted-foreground text-[10px]">{episodes.length} episodes</span>
                </div>
                {episodes.length > 0 ? (
                  <div className="grid grid-cols-8 gap-1.5">
                    {episodes.map((ep) => (
                      <button key={ep.id}
                        onClick={() => { if (ep.streamLink) setCurrentEpisode(ep); }}
                        className={`flex flex-col items-center justify-center rounded-lg border text-[10px] font-medium py-1.5 transition-colors
                          ${currentEpisode?.id === ep.id
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-secondary/40 text-foreground hover:bg-secondary"}`}>
                        {ep.episodeNumber}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-[10px] text-center py-3">No episodes available</p>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          {showComments && (
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-foreground text-sm font-bold mb-3">Comments ({comments.length})</h3>
              <div className="flex gap-2 mb-3">
                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder={user ? "Write a comment..." : "Login to comment"}
                  className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  onKeyDown={e => e.key === "Enter" && handleAddComment()} disabled={!user} />
                <button onClick={handleAddComment} disabled={!user || !newComment.trim()}
                  className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-40">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2 p-2 bg-secondary/30 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                      {c.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-[11px] font-medium">{c.userName}</span>
                        <span className="text-muted-foreground text-[9px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] mt-0.5">{c.text}</p>
                    </div>
                    {user && c.userId === user.uid && (
                      <button onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {comments.length === 0 && <p className="text-muted-foreground text-xs text-center py-4">No comments yet.</p>}
              </div>
            </div>
          )}

          {/* Title & Meta */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-foreground text-lg font-bold">{drama.title}</h1>
              {drama.episodes && <span className="text-muted-foreground text-sm">{drama.episodes}</span>}
            </div>
            {drama.rating && (
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                <span className="text-accent text-sm font-bold">{drama.rating}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {drama.isHotDrama && <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">Hot</span>}
              {drama.isOriginal && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">Original</span>}
              {drama.isVip && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">VIP</span>}
              {isStillOnAgent && <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">🔥 Agent Exclusive</span>}
            </div>
            {genreList.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {genreList.map(tag => (
                  <span key={tag} className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded">{tag}</span>
                ))}
              </div>
            )}
            {drama.description && (
              <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                <span className="text-foreground font-medium">Description: </span>{drama.description}
              </p>
            )}
            {actorList.length > 0 && (
              <div className="mb-6">
                <h3 className="text-foreground text-sm font-bold mb-2">Cast</h3>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {actorList.map((actor, i) => (
                    <div key={i} className="flex flex-col items-center flex-shrink-0 w-16">
                      {actor.image ? (
                        <img src={actor.image} alt={actor.name} className="w-12 h-12 rounded-full object-cover mb-1 border-2 border-border" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-1 border-2 border-border">
                          <span className="text-foreground text-xs font-bold">{actor.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-foreground text-[10px] text-center line-clamp-1">{actor.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended */}
            {recommended.length > 0 && (
              <div>
                <h2 className="text-foreground text-base font-bold mb-3">Recommended</h2>
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
                  {recommended.map(d => (
                    <div key={d.firebaseId || d.id}
                      className="flex-shrink-0 w-[120px] cursor-pointer group"
                      onClick={() => navigate(`/watch/${d.firebaseId}`, {
                        state: {
                          firebaseId: d.firebaseId, title: d.title, image: d.image,
                          streamLink: d.streamLink, genre: d.genre, rating: d.rating,
                          description: d.description, downloadLink: d.downloadLink,
                        },
                      })}>
                      <div className="relative rounded-md overflow-hidden mb-1.5 aspect-[2/3]">
                        <img src={d.image} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <h3 className="text-foreground text-[11px] font-medium line-clamp-1">{d.title}</h3>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Desktop series */}
        {drama.episodes && (
          <div className="hidden lg:block w-[300px] border-l border-border flex-shrink-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-foreground font-bold text-sm">{drama.title}</h2>
            </div>
            <div className="flex border-b border-border">
              <button onClick={() => setActiveTab("episodes")}
                className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${activeTab === "episodes" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                Episodes
              </button>
              <button onClick={() => setActiveTab("highlights")}
                className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${activeTab === "highlights" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                🎵 Highlights
              </button>
            </div>
            <div className="overflow-y-auto max-h-[400px] scrollbar-thin p-3">
              {episodes.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-[11px]">Episodes 1-{episodes.length}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {episodes.map(ep => (
                      <button key={ep.id}
                        onClick={() => { if (ep.streamLink) setCurrentEpisode(ep); }}
                        className={`relative flex flex-col items-center justify-center rounded border text-[11px] font-medium py-2 px-1 transition-colors
                          ${currentEpisode?.id === ep.id
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-secondary/40 text-foreground hover:bg-secondary hover:border-muted-foreground/40"}`}>
                        <span>{ep.episodeNumber}</span>
                        {ep.streamLink && <span className="text-[8px] text-muted-foreground mt-0.5">Play</span>}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-muted-foreground text-xs">No episodes available</div>
              )}
            </div>
          </div>
        )}
      </div>

      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} mode={subscribeMode} />
    </div>
  );
};

export default Watch;
