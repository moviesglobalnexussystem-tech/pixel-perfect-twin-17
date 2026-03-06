import { useLocation, useNavigate } from "react-router-dom";
import { Film, Tv, Radio, Trophy, ShieldCheck, Download, Home } from "lucide-react";
import { useState } from "react";
import AgentAccessModal from "./AgentAccessModal";
import SubscribeModal from "./SubscribeModal";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const navItems = [
  { label: "Home",   path: "/",          icon: Home    },
  { label: "Movies", path: "/movies",    icon: Film    },
  { label: "Agent",  path: "#agent",     icon: ShieldCheck, isCenter: true },
  { label: "Series", path: "/series",    icon: Tv      },
  { label: "Sport",  path: "/live-sport", icon: Trophy  },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAgentAccess, setShowAgentAccess] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const { canInstall, install } = usePWAInstall();

  const isActive = (path: string) => {
    if (path.startsWith("#")) return false;
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
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
        {/* Install banner */}
        {canInstall && (
          <div className="bg-primary/10 border-t border-primary/20">
            <button
              onClick={install}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-primary text-[10px] font-bold"
            >
              <Download className="w-3 h-3" /> Install App for Better Experience
            </button>
          </div>
        )}

        {/* Classic nav bar */}
        <div className="relative bg-card border-t border-border/80 shadow-[0_-2px_20px_rgba(0,0,0,0.4)]">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="flex items-stretch h-[58px] pb-[env(safe-area-inset-bottom)]">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              if (item.isCenter) {
                return (
                  <button
                    key={item.label}
                    onClick={() => handleClick(item.path)}
                    className="relative flex flex-col items-center justify-center flex-1 -mt-4"
                    style={{ zIndex: 2 }}
                  >
                    {/* Floating center button */}
                    <div className="relative">
                      <div className="w-[52px] h-[52px] rounded-full bg-primary shadow-[0_4px_20px_hsl(var(--primary)/0.5)] flex items-center justify-center border-[3px] border-background transition-all active:scale-95 hover:shadow-[0_6px_25px_hsl(var(--primary)/0.65)]">
                        <Icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                    </div>
                    <span className="text-primary text-[9px] font-bold mt-0.5 tracking-wide">{item.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={() => handleClick(item.path)}
                  className="relative flex flex-col items-center justify-center flex-1 transition-all active:scale-95"
                >
                  {/* Active indicator bar at top */}
                  {active && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-b-full" />
                  )}
                  <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-primary/15" : "bg-transparent"}`}>
                    <Icon className={`w-[18px] h-[18px] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-[9px] font-semibold tracking-wide transition-colors ${active ? "text-primary" : "text-muted-foreground/70"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-[58px] lg:hidden" />

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
