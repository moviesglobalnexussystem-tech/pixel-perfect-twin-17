import { useState, useEffect, useRef } from "react";
import { X, Crown, Phone, CheckCircle, Smartphone, Loader2 } from "lucide-react";
import { addAgent, generateAgentId, addTransaction, getUserByUid, updateUser } from "@/lib/firebaseServices";
import { requestDeposit, pollPaymentStatus } from "@/lib/livraPayment";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
  mode?: "user" | "agent";
}

// Updated plan prices as requested
const userPlans = [
  { id: "1day",   label: "1 Day",   price: "2,500",  priceNum: 2500,  duration: "24 hours access",  days: 1  },
  { id: "3days",  label: "3 Days",  price: "5,000",  priceNum: 5000,  duration: "3 days access",    days: 3  },
  { id: "1week",  label: "1 Week",  price: "10,000", priceNum: 10000, duration: "7 days access",    days: 7  },
  { id: "1month", label: "1 Month", price: "25,000", priceNum: 25000, duration: "30 days access",   days: 30 },
];

const agentPlans = [
  { id: "agent-1day",   label: "1 Day",   price: "5,000",  priceNum: 5000,  duration: "24 hours Agent access", days: 1  },
  { id: "agent-1week",  label: "1 Week",  price: "20,000", priceNum: 20000, duration: "7 days Agent access",   days: 7  },
  { id: "agent-1month", label: "1 Month", price: "50,000", priceNum: 50000, duration: "30 days Agent access",  days: 30 },
];

const SubscribeModal = ({ open, onClose, mode = "user" }: SubscribeModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"plan" | "pay" | "processing" | "success" | "failed">("plan");
  const [generatedAgentId, setGeneratedAgentId] = useState("");
  const [statusMessage, setStatusMessage] = useState("Sending payment prompt to your phone...");
  const { toast } = useToast();
  const { user } = useAuth();
  const cancelPollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => { cancelPollRef.current?.(); };
  }, []);

  if (!open) return null;

  const plans = mode === "agent" ? agentPlans : userPlans;
  const title = mode === "agent" ? "Agent 1X Plan" : "Subscribe";
  const subtitle = mode === "agent"
    ? "Get your Agent ID and unlock earnings"
    : "Choose a plan and enjoy unlimited content";

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10 || !selectedPlan) return;

    const planInfo = plans.find(p => p.id === selectedPlan);
    if (!planInfo) return;

    setStep("processing");
    setStatusMessage("Sending payment prompt to your phone...");

    try {
      const description = mode === "agent"
        ? `LUO FILM Agent ${planInfo.label} Plan`
        : `LUO FILM ${planInfo.label} Subscription`;

      const result = await requestDeposit(phoneNumber, planInfo.priceNum, description);

      if (!result.success || !result.internal_reference) {
        toast({ title: "Payment failed", description: result.error || "Could not initiate payment", variant: "destructive" });
        setStep("failed");
        return;
      }

      setStatusMessage("Waiting for you to confirm payment on your phone...");

      cancelPollRef.current = pollPaymentStatus(
        result.internal_reference,
        async (statusData) => {
          setStatusMessage("Payment confirmed! Setting up your account...");

          try {
            const now = new Date();
            const expiry = new Date(now);
            expiry.setDate(expiry.getDate() + planInfo.days);
            const expiryStr = expiry.toISOString().split("T")[0];
            const nowStr = now.toISOString().split("T")[0];

            if (mode === "agent") {
              const newAgentId = generateAgentId();

              await addAgent({
                name: name || phoneNumber,
                phone: phoneNumber,
                agentId: newAgentId,
                balance: 0,
                sharedMovies: 0,
                sharedSeries: 0,
                totalEarnings: 0,
                status: "active",
                plan: planInfo.label,
                planExpiry: expiryStr,
                createdAt: nowStr,
              } as any);

              await addTransaction({
                userId: "",
                userName: name || phoneNumber,
                userPhone: phoneNumber,
                type: "subscription",
                amount: planInfo.priceNum,
                status: "completed",
                method: "Mobile Money (Livra)",
                description: `Agent ${planInfo.label} Plan`,
                livraRef: result.internal_reference,
                createdAt: nowStr,
              } as any);

              setGeneratedAgentId(newAgentId);
            } else {
              // User subscription - update Firestore user record with proper expiry
              if (user) {
                const userDoc = await getUserByUid(user.uid);
                if (userDoc) {
                  await updateUser(userDoc.id, {
                    subscription: planInfo.label,
                    subscriptionExpiry: expiryStr,
                    status: "active",
                  });
                }
              }

              await addTransaction({
                userId: user?.uid || "",
                userName: user?.displayName || phoneNumber,
                userPhone: phoneNumber,
                type: "subscription",
                amount: planInfo.priceNum,
                status: "completed",
                method: "Mobile Money (Livra)",
                description: `User ${planInfo.label} Subscription`,
                livraRef: result.internal_reference,
                createdAt: nowStr,
              } as any);
            }

            setStep("success");
          } catch (err: any) {
            toast({ title: "Account setup error", description: err.message, variant: "destructive" });
            setStep("failed");
          }
        },
        (errorMsg) => {
          toast({ title: "Payment failed", description: errorMsg, variant: "destructive" });
          setStep("failed");
        },
        60,
        5000
      );
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setStep("failed");
    }
  };

  const handleClose = () => {
    cancelPollRef.current?.();
    setStep("plan");
    setSelectedPlan(null);
    setPhoneNumber("");
    setName("");
    setGeneratedAgentId("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button onClick={handleClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center mx-auto mb-3">
            <Crown className="w-5 h-5 text-accent-foreground" />
          </div>
          <h2 className="text-foreground font-bold text-lg">{title}</h2>
          <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>
        </div>

        {step === "plan" && (
          <div className="px-6 pb-6 space-y-3">
            {plans.map((plan) => (
              <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === plan.id ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-muted-foreground/30"
                }`}>
                <div className="text-left">
                  <p className="text-foreground text-sm font-semibold">{plan.label}</p>
                  <p className="text-muted-foreground text-[11px]">{plan.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary text-sm font-bold">UGX {plan.price}</p>
                </div>
              </button>
            ))}
            <button disabled={!selectedPlan} onClick={() => setStep("pay")}
              className="w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2">
              Continue to Pay
            </button>
          </div>
        )}

        {step === "pay" && (
          <form onSubmit={handlePay} className="px-6 pb-6 space-y-4">
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-muted-foreground text-[11px]">Pay with Mobile Money</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <Smartphone className="w-5 h-5 text-accent" />
                <span className="text-foreground font-bold text-lg">
                  UGX {plans.find((p) => p.id === selectedPlan)?.price}
                </span>
              </div>
            </div>
            {mode === "agent" && (
              <div className="relative">
                <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            )}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="tel" placeholder="Mobile Money Number (07...)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required
                className="w-full h-10 pl-10 pr-3 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <p className="text-muted-foreground text-[10px] text-center">
              A payment prompt will be sent to your phone. Enter your PIN to confirm.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep("plan")} className="flex-1 h-10 bg-secondary text-foreground font-medium text-sm rounded-lg hover:bg-muted transition-colors">
                Back
              </button>
              <button type="submit" className="flex-1 h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors">
                Pay Now
              </button>
            </div>
          </form>
        )}

        {step === "processing" && (
          <div className="px-6 pb-6 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <div>
              <p className="text-foreground font-bold text-base">Processing Payment</p>
              <p className="text-muted-foreground text-xs mt-1">{statusMessage}</p>
              <p className="text-muted-foreground text-[10px] mt-2">Check your phone for the payment prompt and enter your PIN.</p>
            </div>
            <button onClick={handleClose} className="text-muted-foreground text-[10px] hover:text-foreground">
              Cancel
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="px-6 pb-6 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
            <div>
              <p className="text-foreground font-bold text-base">Payment Successful!</p>
              <p className="text-muted-foreground text-xs mt-1">
                {mode === "agent"
                  ? <>Your Agent ID: <span className="text-primary font-bold text-base">{generatedAgentId}</span><br/><span className="text-[10px]">Save this ID — you'll use it to log in to the Agent Dashboard</span></>
                  : "Your subscription is now active. Enjoy unlimited streaming!"}
              </p>
            </div>
            <button onClick={handleClose} className="w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors">
              {mode === "agent" ? "Done" : "Start Watching"}
            </button>
          </div>
        )}

        {step === "failed" && (
          <div className="px-6 pb-6 text-center space-y-4">
            <X className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <p className="text-foreground font-bold text-base">Payment Failed</p>
              <p className="text-muted-foreground text-xs mt-1">The payment was not completed. Please try again.</p>
            </div>
            <button onClick={() => setStep("pay")} className="w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors">
              Try Again
            </button>
            <button onClick={handleClose} className="w-full text-muted-foreground text-xs text-center hover:text-foreground">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscribeModal;
