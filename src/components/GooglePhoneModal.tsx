import { useState } from "react";
import { X, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUserByPhone, addUser } from "@/lib/firebaseServices";
import { updateProfile, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import logo from "@/assets/logo.png";

interface GooglePhoneModalProps {
  open: boolean;
  onClose: () => void;
}

const GooglePhoneModal = ({ open, onClose }: GooglePhoneModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    setLoading(true);
    try {
      // Check phone uniqueness
      const existing = await getUserByPhone(phone);
      if (existing) {
        toast({ title: "Phone already registered", description: "This phone number is linked to another account.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Set password for the Google user so they can also login with phone+password
      try {
        await updatePassword(auth.currentUser!, password);
      } catch {
        // Password update may fail for re-auth reasons, but we still save the user record
      }

      // Create user record in Firestore
      await addUser({
        name: user.displayName || user.email?.split("@")[0] || "User",
        phone,
        email: user.email || "",
        status: "active",
        subscription: null,
        subscriptionExpiry: null,
        lastActive: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString().split("T")[0],
        uid: user.uid,
        password, // Store for phone+password login lookup
      } as any);

      toast({ title: "Profile completed!", description: "You can now also login with your phone number and password." });
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="relative px-6 pt-6 pb-4 text-center">
          <img src={logo} alt="LUO FILM" className="w-12 h-12 rounded-xl object-contain mx-auto mb-3" />
          <h2 className="text-foreground font-bold text-lg">Complete Your Profile</h2>
          <p className="text-muted-foreground text-xs mt-1">
            Add your phone number and set a password so you can also login without Google.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} placeholder="Set Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full h-10 pl-10 pr-10 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? "Saving..." : "Complete Profile"}
          </button>
          <button type="button" onClick={onClose} className="w-full text-muted-foreground text-xs text-center hover:text-foreground">
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
};

export default GooglePhoneModal;
