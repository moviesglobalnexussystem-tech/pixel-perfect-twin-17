import { useState } from "react";
import { X, Crown, Phone, CheckCircle, Smartphone } from "lucide-react";
import { addAgent, generateAgentId, addTransaction } from "@/lib/firebaseServices";
import { useToast } from "@/hooks/use-toast";

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
  mode?: "user" | "agent";
}

const userPlans = [
  { id: "1day", label: "1 Day", price: "5,000", priceNum: 5000, duration: "24 hours access" },
  { id: "1week", label: "1 Week", price: "10,000", priceNum: 10000, duration: "7 days access" },
  { id: "1month", label: "1 Month", price: "25,000", priceNum: 25000, duration: "30 days access" },
];

const agentPlans = [
  { id: "agent-1week", label: "1 Week", price: "25,000", priceNum: 25000, duration: "7 days Agent access" },
  { id: "agent-1month", label: "1 Month", price: "50,000", priceNum: 50000, duration: "30 days Agent access" },
];

const SubscribeModal = ({ open, onClose, mode = "user" }: SubscribeModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"plan" | "pay" | "processing" | "success">("plan");
  const [generatedAgentId, setGeneratedAgentId] = useState("");
  const { toast } = useToast();

  if (!open) return null;

  const plans = mode === "agent" ? agentPlans : userPlans;
  const title = mode === "agent" ? "Agent 1X Plan" : "Subscribe";
  const subtitle = mode === "agent"
    ? "Get your Agent ID and unlock earnings"
    : "Choose a plan and enjoy unlimited content";

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) return;

    setStep("processing");

    try {
      if (mode === "agent") {
        // Create agent in Firestore
        const newAgentId = generateAgentId();
        const planInfo = plans.find(p => p.id === selectedPlan);
        const now = new Date();
        const expiry = new Date(now);
        if (selectedPlan?.includes("month")) {
          expiry.setMonth(expiry.getMonth() + 1);
        } else {
          expiry.setDate(expiry.getDate() + 7);
        }

        await addAgent({
          name: name || phoneNumber,
          phone: phoneNumber,
          agentId: newAgentId,
          balance: 0,
          sharedMovies: 0,
          sharedSeries: 0,
          totalEarnings: 0,
          status: "active",
          plan: planInfo?.label || "Weekly",
          planExpiry: expiry.toISOString().split("T")[0],
          createdAt: now.toISOString().split("T")[0],
        } as any);

        // Record transaction
        await addTransaction({
          userId: "",
          userName: name || phoneNumber,
          userPhone: phoneNumber,
          type: "subscription",
          amount: planInfo?.priceNum || 0,
          status: "completed",
          method: "Mobile Money",
          createdAt: now.toISOString().split("T")[0],
        } as any);

        setGeneratedAgentId(newAgentId);
      } else {
        // Record user subscription transaction
        const planInfo = plans.find(p => p.id === selectedPlan);
        await addTransaction({
          userId: "",
          userName: phoneNumber,
          userPhone: phoneNumber,
          type: "subscription",
          amount: planInfo?.priceNum || 0,
          status: "completed",
          method: "Mobile Money",
          createdAt: new Date().toISOString().split("T")[0],
        } as any);
      }

      setStep("success");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setStep("pay");
    }
  };

  const handleClose = () => {
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
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <p className="text-foreground font-bold text-base">Processing...</p>
              <p className="text-muted-foreground text-xs mt-1">Creating your subscription</p>
            </div>
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
                  : "Enjoy unlimited streaming"}
              </p>
            </div>
            <button onClick={handleClose} className="w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors">
              {mode === "agent" ? "Done" : "Start Watching"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscribeModal;
