import { useLocation, useNavigate } from "react-router-dom";
import { Film, Tv, Radio, Trophy, ShieldCheck, Download } from "lucide-react";
import { useState } from "react";
import AgentAccessModal from "./AgentAccessModal";
import SubscribeModal from "./SubscribeModal";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const navItems = [
  { label: "Movies", path: "/movies", icon: Film },
  { label: "Series", path: "/series", icon: Tv },
  { label: "Agent", path: "#agent", icon: ShieldCheck, isCenter: true },
  { label: "Live TV", path: "/tv-channel", icon: Radio },
  { label: "Sport", path: "/live-sport", icon: Trophy },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAgentAccess, setShowAgentAccess] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const { canInstall, install } = usePWAInstall();

  const isActive = (path: string) => {
    if (path.startsWith("#")) return false;
    return location.pathname === path;
  };

  const handleClick = (path: string) => {
    if (path === "#agent") {
      setShowAgentAccess(true);
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Glassmorphism background */}
        <div className="bg-card/95 backdrop-blur-xl border-t border-border/60 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          {canInstall && (
            <div className="flex border-b border-border/60">
              <button
                onClick={install}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-[10px] font-bold active:scale-[0.98] transition-transform"
              >
                <Download className="w-3 h-3" /> Install App
              </button>
            </div>
          )}
          <div className="flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              if (item.isCenter) {
                return (
                  <button
                    key={item.label}
                    onClick={() => handleClick(item.path)}
                    className="relative -mt-5 flex flex-col items-center"
                  >
                    {/* Outer glow ring */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_4px_15px_rgba(0,170,80,0.4)] border-[3px] border-background transition-transform active:scale-95">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-primary text-[9px] font-bold mt-1">{item.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={() => handleClick(item.path)}
                  className="flex flex-col items-center py-2.5 px-3 min-w-[56px] transition-colors"
                >
                  <div className={`relative p-1.5 rounded-xl transition-colors ${active ? "bg-primary/15" : ""}`}>
                    <Icon className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
                    {active && (
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className={`text-[9px] font-medium mt-0.5 ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-16 lg:hidden" />

      <AgentAccessModal
        open={showAgentAccess}
        onClose={() => setShowAgentAccess(false)}
        onAccess={() => { setShowAgentAccess(false); navigate("/agent"); }}
        onSubscribe={() => { setShowAgentAccess(false); setShowSubscribe(true); }}
      />
      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} mode="agent" />
    </>
  );
};

export default BottomNav;
