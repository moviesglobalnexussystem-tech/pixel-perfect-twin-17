import { useState, useEffect } from "react";
import {
  Play, Download, Share2, Eye, Copy, Check,
  Wallet, ArrowDownToLine, Clock, AlertTriangle, Film,
  ChevronRight, X, Phone, CreditCard, Timer, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMovies, getSeries, getEpisodes,
  subscribeSharedLinks, addSharedLink, generateAgentId,
  updateAgent, addTransaction,
  type SharedLink,
} from "@/lib/firebaseServices";
import type { MovieItem, SeriesItem, EpisodeItem } from "@/data/adminData";
import { useNavigate } from "react-router-dom";

interface ContentItem {
  id: string;
  title: string;
  type: "Movie" | "Series" | "Episode";
  episode?: string;
  thumbnail: string;
  genre: string;
  streamLink?: string;
}

const Agent = () => {
  const { toast } = useToast();
  const { agentData, setAgentData } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState<ContentItem[]>([]);
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [sharePrice, setSharePrice] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNumber, setWithdrawNumber] = useState("");
  const [withdrawProvider, setWithdrawProvider] = useState("MTN Mobile Money");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewPlan, setRenewPlan] = useState<"week" | "month">("week");
  const [renewNumber, setRenewNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Redirect if no agent data
  useEffect(() => {
    if (!agentData) {
      // Allow page to render with message
      setLoading(false);
    }
  }, [agentData]);

  // Load content from Firestore
  useEffect(() => {
    const loadContent = async () => {
      try {
        const [movies, series, episodes] = await Promise.all([
          getMovies(), getSeries(), getEpisodes()
        ]);

        const items: ContentItem[] = [
          ...movies.map(m => ({
            id: m.id, title: m.name, type: "Movie" as const,
            thumbnail: m.posterUrl || "/placeholder.svg",
            genre: m.genre, streamLink: m.streamLink,
          })),
          ...series.map(s => ({
            id: s.id, title: s.name, type: "Series" as const,
            thumbnail: s.posterUrl || "/placeholder.svg",
            genre: s.genre,
          })),
          ...episodes.map(e => ({
            id: e.id, title: e.seriesName, type: "Episode" as const,
            episode: `EP ${e.episodeNumber}`,
            thumbnail: "/placeholder.svg",
            genre: "", streamLink: e.streamLink,
          })),
        ];
        setContent(items);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadContent();
  }, []);

  // Subscribe to agent's shared links
  useEffect(() => {
    if (!agentData) return;
    const unsub = subscribeSharedLinks(agentData.id, setSharedLinks);
    return unsub;
  }, [agentData]);

  if (!agentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-8 text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="text-foreground text-lg font-bold mb-2">Agent Access Required</h1>
          <p className="text-muted-foreground text-sm mb-4">Please log in with your Agent ID to access the dashboard.</p>
          <Button onClick={() => navigate("/")} className="text-xs">Go Home</Button>
        </div>
      </div>
    );
  }

  const agentBalance = agentData.balance || 0;
  const daysUntilExpiry = Math.max(0, Math.ceil((new Date(agentData.planExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isExpiringSoon = daysUntilExpiry <= 7;

  const handleShare = (item: ContentItem) => {
    setSelectedContent(item);
    setSharePrice("");
    setShowShareModal(true);
  };

  const handleCreateShare = async () => {
    if (!selectedContent || !sharePrice || !agentData) return;
    setIsProcessing(true);
    try {
      const shareCode = `${agentData.agentId}-${String(sharedLinks.length + 1).padStart(3, "0")}`;
      await addSharedLink({
        agentId: agentData.agentId,
        agentDocId: agentData.id,
        contentType: selectedContent.type.toLowerCase() as any,
        contentId: selectedContent.id,
        contentTitle: `${selectedContent.title}${selectedContent.episode ? ` ${selectedContent.episode}` : ""}`,
        price: parseInt(sharePrice),
        views: 0,
        earnings: 0,
        shareCode,
        active: true,
        streamLink: selectedContent.streamLink,
        posterUrl: selectedContent.thumbnail,
      } as any);

      setShowShareModal(false);
      toast({ title: "Share link created!", description: `Share code: ${shareCode}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleCopyLink = (shareCode: string, id: string) => {
    const link = `${window.location.origin}/shared/${shareCode}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawNumber || !agentData) return;
    const amt = parseInt(withdrawAmount);
    if (amt > agentBalance || amt < 1000) {
      toast({ title: "Invalid amount", description: amt > agentBalance ? "Insufficient balance" : "Min UGX 1,000", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      await updateAgent(agentData.id, { balance: agentBalance - amt });
      await addTransaction({
        userId: agentData.id,
        userName: agentData.name,
        userPhone: agentData.phone,
        type: "withdrawal",
        amount: amt,
        status: "completed",
        method: withdrawProvider,
        createdAt: new Date().toISOString().split("T")[0],
      } as any);
      setAgentData({ ...agentData, balance: agentBalance - amt });
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setWithdrawNumber("");
      toast({ title: "Withdrawal initiated!", description: `UGX ${amt.toLocaleString()} sent to ${withdrawProvider}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleRenew = async () => {
    if (!renewNumber || !agentData) return;
    setIsProcessing(true);
    try {
      const expiry = new Date();
      if (renewPlan === "month") expiry.setMonth(expiry.getMonth() + 1);
      else expiry.setDate(expiry.getDate() + 7);

      await updateAgent(agentData.id, {
        status: "active",
        planExpiry: expiry.toISOString().split("T")[0],
        plan: renewPlan === "month" ? "Monthly" : "Weekly",
      });
      setAgentData({ ...agentData, planExpiry: expiry.toISOString().split("T")[0], status: "active" });
      setShowRenewModal(false);
      setRenewNumber("");
      toast({ title: "Subscription renewed!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const renewPrice = renewPlan === "week" ? 20000 : 30000;

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-6">
      <div className="max-w-6xl mx-auto">
        {isExpiringSoon && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-foreground text-sm font-semibold">Subscription expiring in {daysUntilExpiry} days!</p>
              <p className="text-muted-foreground text-xs mt-1">Withdraw your balance or renew now.</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="text-xs h-8 gap-1" onClick={() => setShowRenewModal(true)}><RefreshCw className="w-3 h-3" /> Renew</Button>
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={() => setShowWithdrawModal(true)}><ArrowDownToLine className="w-3 h-3" /> Withdraw</Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-foreground text-xl font-bold">Agent Dashboard</h1>
            <p className="text-muted-foreground text-xs mt-1">Share content • Earn money</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-[10px]">Agent ID: {agentData.agentId}</p>
            <p className="text-muted-foreground text-[10px]">Expires: {agentData.planExpiry}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <Wallet className="w-5 h-5 text-primary mb-2" />
            <p className="text-foreground text-lg font-bold">UGX {agentBalance.toLocaleString()}</p>
            <p className="text-muted-foreground text-[11px]">Total Balance</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <Share2 className="w-5 h-5 text-accent mb-2" />
            <p className="text-foreground text-lg font-bold">{sharedLinks.filter(l => l.active).length}</p>
            <p className="text-muted-foreground text-[11px]">Active Shares</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <Eye className="w-5 h-5 text-primary mb-2" />
            <p className="text-foreground text-lg font-bold">{sharedLinks.reduce((a, b) => a + (b.views || 0), 0)}</p>
            <p className="text-muted-foreground text-[11px]">Total Views</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <Film className="w-5 h-5 text-accent mb-2" />
            <p className="text-foreground text-lg font-bold">{content.length}</p>
            <p className="text-muted-foreground text-[11px]">Available Content</p>
          </div>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList className="bg-secondary border border-border w-full justify-start overflow-x-auto scrollbar-thin">
            <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
            <TabsTrigger value="shared" className="text-xs">My Shares</TabsTrigger>
            <TabsTrigger value="withdraw" className="text-xs">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            {content.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <Film className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground text-sm font-semibold">No content available yet</p>
                <p className="text-muted-foreground text-xs mt-1">Content will appear here once admin uploads movies, series, or episodes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {content.map((item) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden group">
                    <div className="relative aspect-video bg-muted">
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-secondary/90 text-foreground text-[10px] px-2 py-0.5 rounded">{item.type}</div>
                    </div>
                    <div className="p-3">
                      <p className="text-foreground text-xs font-semibold line-clamp-1">{item.title}</p>
                      <p className="text-muted-foreground text-[10px] mt-0.5">{item.episode ? `${item.episode} • ` : ""}{item.genre}</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="text-[10px] h-7 flex-1 gap-1" onClick={() => handleShare(item)}>
                          <Share2 className="w-3 h-3" /> Share
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-foreground text-sm font-semibold">Shared Content Links</h2>
                <p className="text-muted-foreground text-[10px] mt-0.5">Users pay via Mobile Money to access for 10 minutes</p>
              </div>
              {sharedLinks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">No shared links yet. Go to Content tab and share something!</div>
              ) : (
                <div className="divide-y divide-border">
                  {sharedLinks.map((link) => (
                    <div key={link.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${link.active ? "bg-primary" : "bg-muted-foreground"}`} />
                          <p className="text-foreground text-xs font-medium">{link.contentTitle}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${link.active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {link.active ? "Active" : "Expired"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        <span>Price: <span className="text-accent font-bold">UGX {link.price.toLocaleString()}</span></span>
                        <span>Views: {link.views || 0}</span>
                        <span>Earned: <span className="text-primary font-bold">UGX {(link.earnings || 0).toLocaleString()}</span></span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 bg-secondary rounded px-2 py-1.5 flex-1">
                          <code className="text-[10px] text-foreground flex-1 truncate">/shared/{link.shareCode}</code>
                        </div>
                        <button onClick={() => handleCopyLink(link.shareCode, link.id)} className="bg-secondary text-muted-foreground hover:text-foreground p-1.5 rounded">
                          {copiedId === link.id ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="withdraw">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h2 className="text-foreground text-sm font-semibold mb-1">Withdraw Funds</h2>
                <p className="text-muted-foreground text-[10px] mb-4">Available: <span className="text-primary font-bold">UGX {agentBalance.toLocaleString()}</span></p>
                <div className="space-y-3">
                  <div>
                    <label className="text-muted-foreground text-[10px] block mb-1">Amount (UGX)</label>
                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Min 1,000"
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[10px] block mb-1">Mobile Money Number</label>
                    <input type="tel" value={withdrawNumber} onChange={(e) => setWithdrawNumber(e.target.value)} placeholder="e.g. 0771234567"
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[10px] block mb-1">Provider</label>
                    <select value={withdrawProvider} onChange={(e) => setWithdrawProvider(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                      <option>MTN Mobile Money</option>
                      <option>Airtel Money</option>
                    </select>
                  </div>
                  <Button className="w-full text-xs h-9" onClick={handleWithdraw} disabled={isProcessing || !withdrawAmount || !withdrawNumber}>
                    {isProcessing ? "Processing..." : "Withdraw"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Share Modal */}
      {showShareModal && selectedContent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Share Content</h3>
              <button onClick={() => setShowShareModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-secondary rounded-lg p-3 mb-4">
              <p className="text-foreground text-xs font-medium">{selectedContent.title}</p>
              <p className="text-muted-foreground text-[10px]">{selectedContent.type}{selectedContent.episode ? ` • ${selectedContent.episode}` : ""}</p>
            </div>
            <div className="mb-4">
              <label className="text-muted-foreground text-[10px] block mb-1">Set Price (UGX)</label>
              <input type="number" value={sharePrice} onChange={(e) => setSharePrice(e.target.value)} placeholder="e.g. 2000"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <Button className="w-full text-xs h-9" onClick={handleCreateShare} disabled={isProcessing || !sharePrice}>
              {isProcessing ? "Creating..." : "Create Share Link"}
            </Button>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowRenewModal(false)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-4">Renew Subscription</h3>
            <div className="flex gap-2 mb-4">
              {(["week", "month"] as const).map(p => (
                <button key={p} onClick={() => setRenewPlan(p)}
                  className={`flex-1 py-3 rounded-xl border-2 text-xs font-medium transition-all ${renewPlan === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"}`}>
                  1 {p === "week" ? "Week" : "Month"}<br />
                  <span className="text-sm font-bold">{p === "week" ? "20,000" : "30,000"} UGX</span>
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-muted-foreground text-[10px] block mb-1">Mobile Money Number</label>
              <input type="tel" value={renewNumber} onChange={(e) => setRenewNumber(e.target.value)} placeholder="e.g. 0771234567"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <Button className="w-full text-xs h-9" onClick={handleRenew} disabled={isProcessing || !renewNumber}>
              {isProcessing ? "Processing..." : `Pay UGX ${renewPrice.toLocaleString()}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agent;
