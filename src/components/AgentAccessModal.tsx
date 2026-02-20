import { useState } from "react";
import { X, ShieldCheck, KeyRound } from "lucide-react";
import { getAgentByAgentId } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AgentAccessModalProps {
  open: boolean;
  onClose: () => void;
  onAccess: () => void;
  onSubscribe: () => void;
}

const AgentAccessModal = ({ open, onClose, onAccess, onSubscribe }: AgentAccessModalProps) => {
  const [agentId, setAgentId] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAgentData } = useAuth();
  const { toast } = useToast();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (agentId.trim().length < 4) return;
    setLoading(true);
    try {
      const agent = await getAgentByAgentId(agentId.trim().toUpperCase());
      if (agent) {
        if (agent.status === "blocked") {
          toast({ title: "Access Denied", description: "Your agent account has been blocked.", variant: "destructive" });
        } else if (agent.status === "expired") {
          toast({ title: "Subscription Expired", description: "Please renew your agent subscription.", variant: "destructive" });
        } else {
          setAgentData(agent);
          toast({ title: "Welcome, Agent!", description: `Logged in as ${agent.name}` });
          onAccess();
        }
      } else {
        toast({ title: "Agent Not Found", description: "No agent found with this ID. Subscribe to become an agent.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-5 h-5 text-accent-foreground" />
          </div>
          <h2 className="text-foreground font-bold text-lg">Agent 1X Access</h2>
          <p className="text-muted-foreground text-xs mt-1">Enter your Agent ID to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-4 space-y-3">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Enter Agent ID (e.g. AG-XXXX-001)" value={agentId} onChange={(e) => setAgentId(e.target.value)} required
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>

        <div className="px-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-[10px]">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="px-6 py-4 text-center">
          <p className="text-muted-foreground text-xs mb-3">Don't have an Agent ID?</p>
          <button onClick={onSubscribe}
            className="w-full h-10 bg-accent text-accent-foreground font-semibold text-sm rounded-lg hover:bg-accent/90 transition-colors">
            Subscribe for Agent Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentAccessModal;
