import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Play, Phone, CreditCard, Timer, Clock, Film, CheckCircle, Lock, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSharedLinkByCode, updateSharedLink, updateAgent, addTransaction } from "@/lib/firebaseServices";
import type { SharedLink } from "@/lib/firebaseServices";
import HLSPlayer from "@/components/HLSPlayer";

type PaymentStep = "info" | "payment" | "processing" | "success" | "watching";

const SharedContent = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const { toast } = useToast();
  const [step, setStep] = useState<PaymentStep>("info");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("MTN Mobile Money");
  const [timeLeft, setTimeLeft] = useState(600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [content, setContent] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState(true);

  // Load shared content from Firestore
  useEffect(() => {
    if (!shareCode) { setLoading(false); return; }
    getSharedLinkByCode(shareCode).then(data => {
      setContent(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [shareCode]);

  // Countdown timer
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && isTimerRunning) {
        setIsTimerRunning(false);
        setStep("info");
        toast({ title: "Access expired", description: "Your 10-minute access has ended.", variant: "destructive" });
      }
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePay = async () => {
    if (!phoneNumber || !content) {
      toast({ title: "Enter phone number", variant: "destructive" });
      return;
    }
    setStep("processing");
    try {
      // Record transaction and update share stats
      await addTransaction({
        userId: "",
        userName: phoneNumber,
        userPhone: phoneNumber,
        type: "agent-share",
        amount: content.price,
        status: "completed",
        method: provider,
        createdAt: new Date().toISOString().split("T")[0],
      } as any);

      // Update share link views/earnings
      await updateSharedLink(content.id, {
        views: (content.views || 0) + 1,
        earnings: (content.earnings || 0) + content.price,
      });

      setStep("success");
      setTimeout(() => {
        setStep("watching");
        setTimeLeft(600);
        setIsTimerRunning(true);
      }, 2000);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setStep("payment");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!content) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-8 text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h1 className="text-foreground text-lg font-bold mb-2">Content Not Found</h1>
        <p className="text-muted-foreground text-sm">This share link is invalid or has expired.</p>
      </div>
    </div>
  );

  if (step === "watching") return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/10 border-b border-primary/30 px-4 py-2 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary" />
          <span className="text-primary text-xs font-semibold">Time Remaining</span>
        </div>
        <span className={`text-sm font-bold ${timeLeft < 120 ? "text-destructive" : "text-primary"}`}>{formatTime(timeLeft)}</span>
      </div>
      <div className="aspect-video bg-muted relative max-w-4xl mx-auto">
        {content.streamLink ? (
          <HLSPlayer src={content.streamLink} />
        ) : (
          <>
            <img src={content.posterUrl || "/placeholder.svg"} alt={content.contentTitle} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                <Play className="w-8 h-8 ml-1" />
              </button>
            </div>
          </>
        )}
        {timeLeft < 120 && <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full animate-pulse">Expiring soon!</div>}
      </div>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <h1 className="text-foreground text-lg font-bold">{content.contentTitle}</h1>
        <p className="text-muted-foreground text-sm mt-1 capitalize">{content.contentType}</p>
        {content.streamLink && (
          <a
            href={content.streamLink}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 bg-secondary border border-border text-foreground text-xs font-medium px-4 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Movie
          </a>
        )}
      </div>
      <div className="max-w-4xl mx-auto px-4">
        <div className="w-full bg-secondary rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all duration-1000 ${timeLeft < 120 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${(timeLeft / 600) * 100}%` }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
          <div className="aspect-video bg-muted relative">
            <img src={content.posterUrl || "/placeholder.svg"} alt={content.contentTitle} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><Lock className="w-10 h-10 text-muted-foreground" /></div>
            <div className="absolute top-2 right-2 bg-secondary/90 text-foreground text-[10px] px-2 py-0.5 rounded">{content.contentType}</div>
          </div>
          <div className="p-4">
            <h1 className="text-foreground text-base font-bold">{content.contentTitle}</h1>
            <p className="text-muted-foreground text-xs mt-1">{content.contentType}</p>
            <p className="text-muted-foreground text-[10px] mt-2">Shared by Agent</p>
          </div>
        </div>

        {step === "info" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Pay to watch</p>
              <p className="text-accent text-3xl font-bold mt-1">UGX {content.price.toLocaleString()}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Timer className="w-3 h-3 text-muted-foreground" />
                <p className="text-muted-foreground text-[10px]">10 minutes access after payment</p>
              </div>
            </div>
            <Button className="w-full text-xs h-10 gap-1" onClick={() => setStep("payment")}>
              <CreditCard className="w-4 h-4" /> Pay Now
            </Button>
          </div>
        )}

        {step === "payment" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-center">
              <p className="text-accent text-2xl font-bold">UGX {content.price.toLocaleString()}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-muted-foreground text-[10px] block mb-1">Mobile Money Number</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 0771234567"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] block mb-1">Provider</label>
                <select value={provider} onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                  <option>MTN Mobile Money</option>
                  <option>Airtel Money</option>
                </select>
              </div>
            </div>
            <Button className="w-full text-xs h-10 gap-1" onClick={handlePay} disabled={!phoneNumber}>
              <CreditCard className="w-4 h-4" /> Pay UGX {content.price.toLocaleString()}
            </Button>
            <button onClick={() => setStep("info")} className="w-full text-muted-foreground text-[10px] text-center mt-1 hover:text-foreground">← Go back</button>
          </div>
        )}

        {step === "processing" && (
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-foreground text-sm font-semibold">Processing Payment</p>
          </div>
        )}

        {step === "success" && (
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
            <p className="text-foreground text-sm font-semibold">Payment Successful!</p>
            <p className="text-muted-foreground text-xs">Loading your content...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedContent;
