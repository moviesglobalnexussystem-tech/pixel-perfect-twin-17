import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Play, MessageSquare, Clock, Share2, Monitor, Smartphone, ChevronRight, Star, ArrowLeft, Download, Send, Trash2 } from "lucide-react";
import { subscribeMovies, subscribeSeries, getEpisodesBySeries, subscribeComments, addComment, deleteComment, addWatchLater, subscribeWatchLater, deleteWatchLater, subscribeEpisodes } from "@/lib/firebaseServices";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EpisodeItem, CommentItem, WatchLaterItem } from "@/data/adminData";
import SportPlayer from "@/components/SportPlayer";
import ArtPlayerComponent from "@/components/ArtPlayerComponent";
import { useState, useEffect } from "react";
import type { Drama } from "@/data/dramas";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SubscribeModal from "@/components/SubscribeModal";

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
                <ArtPlayerComponent key={currentVideoUrl} src={currentVideoUrl} autoplay />
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

// ==================== HELPER: Check if user has active subscription ====================
const hasActiveSubscription = (user: any): boolean => {
  // In a real app, check Firestore user record for subscription status
  return !!user;
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
  const isSport = id?.startsWith("sport-");

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

  // Load content from Firestore - either from state or by fetching directly
  useEffect(() => {
    if (isSport || !id) return;

    const loadContent = async () => {
      if (firebaseState?.firebaseId) {
        // We have state from navigation
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
        // No state - fetch directly from Firestore by document ID
        try {
          // Try series first
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
            // Try movies
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
    };

    loadContent();

    const unsub1 = subscribeMovies((movies) => {
      setRecommended(movies.filter(m => !m.isAgent).slice(0, 7).map((m, i) => ({
        id: i + 6000, title: m.name, image: m.posterUrl || "/placeholder.svg",
        firebaseId: m.id, streamLink: m.streamLink,
      })));
    });
    return () => { unsub1(); };
  }, [id, isSport]);

  // Subscribe to episodes for this content
  useEffect(() => {
    const contentId = firebaseState?.firebaseId || id;
    if (!contentId || isSport) return;
    const unsub = subscribeEpisodes((allEps) => {
      const filtered = allEps
        .filter(ep => ep.seriesId === contentId)
        .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
      setEpisodes(filtered);
      // Default to first episode if none selected
      if (!currentEpisode && filtered.length > 0 && filtered[0].streamLink) {
        setCurrentEpisode(filtered[0]);
      }
    });
    return unsub;
  }, [id, firebaseState?.firebaseId, isSport]);

  // Subscribe to comments
  useEffect(() => {
    if (!id) return;
    const contentId = firebaseState?.firebaseId || id;
    const unsub = subscribeComments(contentId, setComments);
    return unsub;
  }, [id, firebaseState?.firebaseId]);

  // Subscribe to watch later
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeWatchLater(user.uid, setWatchLaterItems);
    return unsub;
  }, [user]);

  if (isSport) return <SportWatch />;

  if (!drama && firebaseState?.firebaseId) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Loading...</div>;
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

  // Check if content is agent-only (upcoming) and user doesn't have agent sub
  const isAgentContent = drama.isAgent;
  const agentMarkedDate = drama.agentMarkedAt ? new Date(drama.agentMarkedAt) : null;
  const daysSinceMarked = agentMarkedDate ? Math.floor((Date.now() - agentMarkedDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const isStillOnAgent = isAgentContent && daysSinceMarked < 5;

  // Parse actors: format can be "Name|ImageURL, Name|ImageURL" or just "Name, Name"
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
        contentId,
        userId: user.uid,
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
      toast({ title: "Login required", description: "Please login to save", variant: "destructive" });
      return;
    }
    const contentId = firebaseState?.firebaseId || id || "";
    const existing = watchLaterItems.find(w => w.contentId === contentId);
    if (existing) {
      await deleteWatchLater(existing.id);
      toast({ title: "Removed from Watch Later" });
    } else {
      await addWatchLater({
        userId: user.uid,
        contentId,
        contentTitle: drama.title,
        contentImage: drama.image,
        contentType: "movie",
        createdAt: new Date().toISOString(),
      } as any);
      toast({ title: "Added to Watch Later" });
    }
  };

  const isInWatchLater = watchLaterItems.some(w => w.contentId === (firebaseState?.firebaseId || id));

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Watch "${drama.title}" on LUO FILM`;
    if (navigator.share) {
      try {
        await navigator.share({ title: drama.title, text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share it with friends" });
    }
  };

  const handleDownload = () => {
    const downloadUrl = currentEpisode?.downloadLink || currentEpisode?.streamLink || (drama as any).downloadLink || drama.streamLink;
    if (downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.target = "_blank";
      a.download = `${drama.title}.mp4`;
      a.click();
    } else {
      toast({ title: "No download available", variant: "destructive" });
    }
  };

  const handleWatchOnTV = () => {
    toast({ title: "Watch on TV", description: "Open the LUO FILM TV app and scan the QR code or enter the code shown on your TV" });
  };

  const handleWatchOnApp = () => {
    // Trigger PWA install or redirect
    toast({ title: "Install LUO FILM App", description: "Add to home screen from your browser menu for the best experience" });
  };

  // If user not logged in or no subscription, show subscribe prompt
  const requiresSubscription = !user;

  return (
    <div className="min-h-screen bg-background">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-4 py-2.5 text-muted-foreground hover:text-foreground text-xs transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          {/* Video Player */}
          <div className="relative w-full max-h-[480px] aspect-video bg-black">
            {requiresSubscription ? (
              <div className="w-full h-full relative">
                <img src={drama.image} alt={drama.title} className="w-full h-full object-cover blur-sm" />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                  <Play className="w-12 h-12 text-primary" />
                  <p className="text-foreground text-sm font-bold">Login & Subscribe to Watch</p>
                  <p className="text-muted-foreground text-xs text-center px-8">
                    {isStillOnAgent ? "This is an exclusive Agent content. Subscribe to Agent plan to watch." : "Get a subscription plan to enjoy unlimited streaming"}
                  </p>
                  <button onClick={() => { setSubscribeMode(isStillOnAgent ? "agent" : "user"); setShowSubscribe(true); }}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-xs font-bold hover:bg-primary/90">
                    {isStillOnAgent ? "Get Agent Plan" : "Subscribe Now"}
                  </button>
                </div>
              </div>
            ) : (currentEpisode?.streamLink || drama.streamLink) ? (
              <ArtPlayerComponent key={currentEpisode?.streamLink || drama.streamLink || ""} src={currentEpisode?.streamLink || drama.streamLink || ""} poster={drama.image} autoplay />
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
          <div className="flex items-center gap-2 px-4 py-3">
            <button onClick={handleShare} className="flex-1 flex flex-col items-center gap-1 bg-card border border-border rounded-xl py-2.5 hover:bg-secondary transition-colors">
              <Share2 className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-medium text-foreground">Share</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex-1 flex flex-col items-center gap-1 bg-card border border-border rounded-xl py-2.5 hover:bg-secondary transition-colors">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-medium text-foreground">Comments ({comments.length})</span>
            </button>
            <button onClick={() => {
              if (!user) {
                toast({ title: "Login required", description: "Please login to download", variant: "destructive" });
                return;
              }
              handleDownload();
            }} className="flex-1 flex flex-col items-center gap-1 bg-card border border-border rounded-xl py-2.5 hover:bg-secondary transition-colors">
              <Download className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-medium text-foreground">Download</span>
            </button>
          </div>

          {/* Episodes Grid - Mobile only (before details) */}
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
                      <button
                        key={ep.id}
                        onClick={() => { if (ep.streamLink) setCurrentEpisode(ep); }}
                        className={`flex flex-col items-center justify-center rounded-lg border text-[10px] font-medium py-1.5 transition-colors
                          ${currentEpisode?.id === ep.id
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-secondary/40 text-foreground hover:bg-secondary"
                          }`}
                      >
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

          {/* Comments Section */}
          {showComments && (
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-foreground text-sm font-bold mb-3">Comments ({comments.length})</h3>
              <div className="flex gap-2 mb-3">
                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={user ? "Write a comment..." : "Login to comment"}
                  className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()} disabled={!user} />
                <button onClick={handleAddComment} disabled={!user || !newComment.trim()} className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-40">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {comments.map((c) => (
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
                {comments.length === 0 && <p className="text-muted-foreground text-xs text-center py-4">No comments yet. Be the first!</p>}
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
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                  <span className="text-accent text-sm font-bold">{drama.rating}</span>
                </div>
                <span className="text-primary text-xs cursor-pointer hover:underline">Rate now</span>
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {drama.rank && <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">TOP {drama.rank}</span>}
              {drama.isHotDrama && <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">Hot</span>}
              {drama.isOriginal && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">Original</span>}
              {drama.isVip && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">VIP</span>}
              {isStillOnAgent && <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">🔥 Agent Exclusive</span>}
            </div>

            {/* Genre Tags */}
            {genreList.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {genreList.map((tag) => (
                  <span key={tag} className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded cursor-pointer hover:bg-muted">{tag}</span>
                ))}
              </div>
            )}

            {/* Description */}
            {drama.description && (
              <div className="mb-4">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  <span className="text-foreground font-medium">Description: </span>
                  {drama.description}
                </p>
              </div>
            )}

            {/* Cast */}
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
                  {recommended.map((d) => (
                    <div key={d.id} className="flex-shrink-0 w-[120px] cursor-pointer group"
                      onClick={() => navigate(`/watch/${d.firebaseId}`, { state: { firebaseId: d.firebaseId, title: d.title, image: d.image, streamLink: d.streamLink } })}>
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

        {/* Right Sidebar - Only for series on desktop */}
        {drama.episodes && (
          <div className="hidden lg:block w-[300px] border-l border-border flex-shrink-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-foreground font-bold text-sm">{drama.title}</h2>
            </div>

            {/* Tabs */}
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

            {/* Episode Grid */}
            <div className="overflow-y-auto max-h-[400px] scrollbar-thin p-3">
              {episodes.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-[11px]">Episodes 1-{episodes.length}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {episodes.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => { if (ep.streamLink) setCurrentEpisode(ep); }}
                        className={`relative flex flex-col items-center justify-center rounded border text-[11px] font-medium py-2 px-1 transition-colors
                          ${currentEpisode?.id === ep.id
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-secondary/40 text-foreground hover:bg-secondary hover:border-muted-foreground/40"
                          }`}
                      >
                        <span>{ep.episodeNumber}</span>
                        {ep.streamLink && <span className="text-[8px] text-muted-foreground mt-0.5">Play</span>}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-muted-foreground text-xs">
                  {drama.episodes ? `${drama.episodes}` : "No episodes available"}
                </div>
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
