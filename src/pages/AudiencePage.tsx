import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Play, CreditCard, Timer, Lock, AlertCircle, CheckCircle, Film, Download, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getSharedLinkByCode, updateSharedLink, addTransaction,
  getSharedLinksByAgent, getAgentByAgentId,
  subscribeMovies
} from "@/lib/firebaseServices";
import type { SharedLink } from "@/lib/firebaseServices";
import type { MovieItem } from "@/data/adminData";
import ArtPlayerComponent from "@/components/ArtPlayerComponent";
import { requestDeposit, pollPaymentStatus } from "@/lib/livraPayment";

// Device fingerprint for audience "login"
const getDeviceId = (): string => {
  let id = localStorage.getItem("luo_device_id");
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("luo_device_id", id);
  }
  return id;
};

const getAccessKey = (shareCode: string) => `luo_access_${shareCode}`;

const checkAccess = (shareCode: string): { hasAccess: boolean; timeLeft: number } => {
  const key = getAccessKey(shareCode);
  const data = localStorage.getItem(key);
  if (!data) return { hasAccess: false, timeLeft: 0 };
  try {
    const { deviceId, expiresAt } = JSON.parse(data);
    if (deviceId !== getDeviceId()) return { hasAccess: false, timeLeft: 0 };
    const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    return { hasAccess: remaining > 0, timeLeft: remaining };
  } catch {
    return { hasAccess: false, timeLeft: 0 };
  }
};

const grantAccess = (shareCode: string, durationMinutes: number) => {
  const key = getAccessKey(shareCode);
  localStorage.setItem(key, JSON.stringify({
    deviceId: getDeviceId(),
    expiresAt: Date.now() + durationMinutes * 60 * 1000,
  }));
};

type PageStep = "info" | "payment" | "processing" | "success" | "watching";

const AudiencePage = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const { toast } = useToast();
  const [step, setStep] = useState<PageStep>("info");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("MTN Mobile Money");
  const [timeLeft, setTimeLeft] = useState(0);
  const [content, setContent] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentName, setAgentName] = useState("");
  const [relatedLinks, setRelatedLinks] = useState<SharedLink[]>([]);
  const [relatedMovies, setRelatedMovies] = useState<MovieItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const cancelPollRef = useState<(() => void) | null>(null);
  const accessDuration = (content as any)?.accessDuration || 60;

  // Load content
  useEffect(() => {
    if (!shareCode) { setLoading(false); return; }
    getSharedLinkByCode(shareCode).then(async (data) => {
      setContent(data);
      if (data) {
        // Get agent name
        const agName = (data as any).agentName;
        if (agName) setAgentName(agName);
        else {
          try {
            const agent = await getAgentByAgentId(data.agentId);
            if (agent) setAgentName(agent.name);
          } catch {}
        }
        // Check existing access
        const { hasAccess, timeLeft: tl } = checkAccess(shareCode);
        if (hasAccess) {
          setTimeLeft(tl);
          setStep("watching");
        }
        // Load related
        try {
          const agentLinks = await getSharedLinksByAgent(data.agentDocId);
          setRelatedLinks(agentLinks.filter(l => l.id !== data.id && l.active));
        } catch {}
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [shareCode]);

  // Load related movies for display
  useEffect(() => {
    const unsub = subscribeMovies((movies) => {
      setRelatedMovies(movies.filter(m => m.isAgent).slice(0, 8));
    });
    return unsub;
  }, []);

  // Countdown timer
  useEffect(() => {
    if (step !== "watching" || timeLeft <= 0) {
      if (timeLeft <= 0 && step === "watching") {
        setStep("info");
        toast({ title: "Access expired", description: "Your access time has ended.", variant: "destructive" });
      }
      return;
    }
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePay = async () => {
    if (!phoneNumber || !content) {
      toast({ title: "Enter phone number", variant: "destructive" });
      return;
    }
    setStep("processing");
    setStatusMessage("Sending payment prompt to your phone...");
    
    try {
      const description = `LUO FILM: ${content.contentTitle} (${accessDuration}min access)`;
      const result = await requestDeposit(phoneNumber, content.price, description);
      
      if (!result.success || !result.internal_reference) {
        toast({ title: "Payment failed", description: result.error || "Could not initiate payment", variant: "destructive" });
        setStep("payment");
        return;
      }

      setStatusMessage("Waiting for you to confirm payment on your phone...");

      // Poll for payment status
      const cancelPoll = pollPaymentStatus(
        result.internal_reference,
        async (statusData) => {
          // Payment successful!
          try {
            await addTransaction({
              userId: getDeviceId(),
              userName: phoneNumber,
              userPhone: phoneNumber,
              type: "agent-share",
              amount: content.price,
              status: "completed",
              method: `Mobile Money (Livra)`,
              description: `Agent sell: ${content.contentTitle}`,
              livraRef: result.internal_reference,
              createdAt: new Date().toISOString().split("T")[0],
            } as any);

            await updateSharedLink(content.id, {
              views: (content.views || 0) + 1,
              earnings: (content.earnings || 0) + content.price,
            });

            // Credit the agent's balance
            try {
              const agent = await getAgentByAgentId(content.agentId);
              if (agent) {
                const { updateAgent } = await import("@/lib/firebaseServices");
                await updateAgent(agent.id, {
                  balance: (agent.balance || 0) + content.price,
                  totalEarnings: (agent.totalEarnings || 0) + content.price,
                });
              }
            } catch (e) {
              console.error("Failed to credit agent balance:", e);
            }

            grantAccess(shareCode!, accessDuration);
            setStep("success");
            setTimeout(() => {
              setStep("watching");
              setTimeLeft(accessDuration * 60);
            }, 2000);
          } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
            setStep("payment");
          }
        },
        (errorMsg) => {
          toast({ title: "Payment failed", description: errorMsg, variant: "destructive" });
          setStep("payment");
        },
        60,
        5000
      );
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setStep("payment");
    }
  };

  const pageTitle = agentName ? `${agentName} at luofilm.site` : "LUO FILM";

  // Update document title
  useEffect(() => {
    document.title = pageTitle;
    return () => { document.title = "LUO FILM"; };
  }, [pageTitle]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!content) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h1 className="text-foreground text-lg font-bold mb-2">Content Not Found</h1>
        <p className="text-muted-foreground text-sm">This link is invalid or has expired.</p>
      </div>
    </div>
  );

  // ===================== WATCHING STATE =====================
  if (step === "watching") return (
    <div className="min-h-screen bg-background">
      {/* Agent branded header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-foreground text-xs font-bold">{agentName || "Agent"}</p>
            <p className="text-muted-foreground text-[9px]">at luofilm.site</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="w-3.5 h-3.5 text-primary" />
          <span className={`text-sm font-bold tabular-nums ${timeLeft < 120 ? "text-destructive" : "text-primary"}`}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Player */}
      <div className="aspect-video bg-black relative max-w-4xl mx-auto">
        {content.streamLink ? (
          <ArtPlayerComponent key={content.streamLink} src={content.streamLink} poster={content.posterUrl} autoplay />
        ) : (
          <div className="w-full h-full relative">
            <img src={content.posterUrl || "/placeholder.svg"} alt={content.contentTitle} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-16 h-16 text-primary-foreground bg-primary/80 rounded-full p-4" />
            </div>
          </div>
        )}
        {timeLeft < 120 && (
          <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">
            Expiring soon!
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="max-w-4xl mx-auto px-4 pt-2">
        <div className="w-full bg-secondary rounded-full h-1">
          <div className={`h-1 rounded-full transition-all duration-1000 ${timeLeft < 120 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${(timeLeft / (accessDuration * 60)) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <h1 className="text-foreground text-lg font-bold">{content.contentTitle}</h1>
        <p className="text-muted-foreground text-xs mt-1 capitalize">{content.contentType}</p>
        {content.streamLink && (
          <a href={content.streamLink} download target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg hover:shadow-lg transition-all active:scale-95">
            <Download className="w-4 h-4" /> Download
          </a>
        )}
      </div>

      {/* Related content from agent */}
      {relatedLinks.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <h2 className="text-foreground text-sm font-bold mb-3">More from {agentName || "this Agent"}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {relatedLinks.map((link) => (
              <a key={link.id} href={`/a/${link.shareCode}`}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
                <div className="aspect-video bg-muted relative">
                  <img src={link.posterUrl || "/placeholder.svg"} alt={link.contentTitle} className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                    UGX {link.price.toLocaleString()}
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-foreground text-[11px] font-medium line-clamp-1">{link.contentTitle}</p>
                  <p className="text-muted-foreground text-[9px] mt-0.5 capitalize">{link.contentType}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border py-4 text-center">
        <p className="text-muted-foreground text-[10px]">Powered by <span className="text-primary font-bold">LUO FILM</span></p>
      </div>
    </div>
  );

  // ===================== PAYMENT FLOW =====================
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Agent branded header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-foreground text-sm font-bold">{agentName || "Agent"}</p>
          <p className="text-muted-foreground text-[10px]">at luofilm.site</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Content preview */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4 shadow-lg">
            <div className="aspect-video bg-muted relative">
              <img src={content.posterUrl || "/placeholder.svg"} alt={content.contentTitle} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
                <Lock className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="absolute top-2 right-2 bg-secondary/90 text-foreground text-[10px] px-2 py-0.5 rounded capitalize">{content.contentType}</div>
            </div>
            <div className="p-4">
              <h1 className="text-foreground text-base font-bold">{content.contentTitle}</h1>
              <p className="text-muted-foreground text-[10px] mt-1 capitalize">{content.contentType}</p>
              <div className="flex items-center gap-1.5 mt-2 text-muted-foreground text-[10px]">
                <Timer className="w-3 h-3" />
                <span>{accessDuration} minutes access</span>
              </div>
            </div>
          </div>

          {step === "info" && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="text-center">
                <p className="text-muted-foreground text-xs">Pay to watch & download</p>
                <p className="text-primary text-3xl font-bold mt-1">UGX {content.price.toLocaleString()}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <Timer className="w-3 h-3 text-muted-foreground" />
                  <p className="text-muted-foreground text-[10px]">{accessDuration} minutes access after payment</p>
                </div>
              </div>
              <Button className="w-full text-xs h-10 gap-1.5 rounded-xl" onClick={() => setStep("payment")}>
                <CreditCard className="w-4 h-4" /> Pay Now
              </Button>
            </div>
          )}

          {step === "payment" && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                <p className="text-primary text-2xl font-bold">UGX {content.price.toLocaleString()}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-muted-foreground text-[10px] block mb-1">Mobile Money Number</label>
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 0771234567"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-muted-foreground text-[10px] block mb-1">Provider</label>
                  <select value={provider} onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option>MTN Mobile Money</option>
                    <option>Airtel Money</option>
                  </select>
                </div>
              </div>
              <Button className="w-full text-xs h-10 gap-1.5 rounded-xl" onClick={handlePay} disabled={!phoneNumber}>
                <CreditCard className="w-4 h-4" /> Pay UGX {content.price.toLocaleString()}
              </Button>
              <button onClick={() => setStep("info")} className="w-full text-muted-foreground text-[10px] text-center hover:text-foreground">← Go back</button>
            </div>
          )}

          {step === "processing" && (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-lg">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-foreground text-sm font-semibold">Processing Payment</p>
              <p className="text-muted-foreground text-[10px]">{statusMessage || "Waiting for confirmation..."}</p>
              <p className="text-muted-foreground text-[9px]">Check your phone and enter your PIN</p>
            </div>
          )}

          {step === "success" && (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-lg">
              <CheckCircle className="w-12 h-12 text-primary mx-auto" />
              <p className="text-foreground text-sm font-semibold">Payment Successful!</p>
              <p className="text-muted-foreground text-xs">Loading your content...</p>
            </div>
          )}

          {/* Related from agent */}
          {relatedLinks.length > 0 && step === "info" && (
            <div className="mt-6">
              <h2 className="text-foreground text-sm font-bold mb-3">More from {agentName || "this Agent"}</h2>
              <div className="grid grid-cols-2 gap-2">
                {relatedLinks.slice(0, 4).map((link) => (
                  <a key={link.id} href={`/a/${link.shareCode}`}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
                    <div className="aspect-video bg-muted">
                      <img src={link.posterUrl || "/placeholder.svg"} alt={link.contentTitle} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <p className="text-foreground text-[10px] font-medium line-clamp-1">{link.contentTitle}</p>
                      <p className="text-primary text-[10px] font-bold">UGX {link.price.toLocaleString()}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border py-4 text-center">
        <p className="text-muted-foreground text-[10px]">Powered by <span className="text-primary font-bold">LUO FILM</span></p>
      </div>
    </div>
  );
};

export default AudiencePage;
