import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Download, User, Home, Film, Tv, Radio, Trophy, Crown, ShieldCheck, Menu, X, Settings, LogOut, HelpCircle, Search } from "lucide-react";
import logo from "@/assets/logo.png";
import LoginModal from "./LoginModal";
import SubscribeModal from "./SubscribeModal";
import AgentAccessModal from "./AgentAccessModal";
import GlobalSearch from "./GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const ADMIN_EMAIL = "mainplatform.nexus@gmail.com";

const navLinks = [
  { label: "Home", path: "/", icon: Home },
  { label: "Movies", path: "/movies", icon: Film },
  { label: "Series", path: "/series", icon: Tv },
  { label: "TV Channel", path: "/tv-channel", icon: Radio },
  { label: "Live Sport", path: "/live-sport", icon: Trophy },
  { label: "Subscribe", path: "#subscribe", icon: Crown },
  { label: "Agent 1X", path: "#agent", icon: ShieldCheck },
  { label: "Admin", path: "/admin", icon: Settings, adminOnly: true },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [showLogin, setShowLogin] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribeMode, setSubscribeMode] = useState<"user" | "agent">("user");
  const [showAgentAccess, setShowAgentAccess] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { canInstall, install } = usePWAInstall();

  const handleLogout = async () => {
    await logout();
  };

  const handleNavClick = (path: string) => {
    setMobileOpen(false);
    if (path === "#subscribe") {
      setSubscribeMode("user");
      setShowSubscribe(true);
    } else if (path === "#agent") {
      setShowAgentAccess(true);
    } else {
      navigate(path);
    }
  };

  const isActive = (path: string) => {
    if (path.startsWith("#")) return false;
    return location.pathname === path;
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 md:px-8 h-14">
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <img src={logo} alt="LUO FILM" className="w-7 h-7 rounded-lg object-contain" />
            <span className="text-foreground font-bold text-sm">LUO FILM</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 mx-4 bg-secondary/60 rounded-full px-1.5 py-1 border border-border">
            {navLinks.filter(link => !link.adminOnly || isAdmin).map((link) => {
              const Icon = link.icon;
              return (
                <button key={link.label} onClick={() => handleNavClick(link.path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                    isActive(link.path) ? "bg-primary text-primary-foreground shadow-sm"
                    : link.path === "#subscribe" || link.path === "#agent" ? "text-accent bg-accent/10 hover:bg-accent/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            <GlobalSearch />
            <button
              onClick={() => navigate("/how-to-use")}
              className="flex items-center gap-1.5 bg-secondary text-foreground text-[10px] font-medium px-3 py-1.5 rounded-full border border-border hover:bg-secondary/80 transition-all active:scale-95"
            >
              <HelpCircle className="w-3 h-3" />Guide
            </button>
            {canInstall && (
              <button
                onClick={install}
                className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] font-bold px-4 py-1.5 rounded-full shadow-[0_2px_10px_hsl(135_100%_37%/0.3)] hover:shadow-[0_2px_16px_hsl(135_100%_37%/0.5)] transition-all active:scale-95"
              >
                <Download className="w-3 h-3" />Install
              </button>
            )}

            {user ? (
              <div className="relative group">
                <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                </button>
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <p className="text-foreground text-xs font-medium px-2 py-1">{user.displayName || "User"}</p>
                  <p className="text-muted-foreground text-[10px] px-2 pb-1">{user.email}</p>
                  <button onClick={handleLogout}
                    className="w-full text-left text-destructive text-xs px-2 py-1 rounded hover:bg-secondary transition-colors flex items-center gap-1.5">
                    <LogOut className="w-3 h-3" /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-[0_2px_12px_hsl(135_100%_37%/0.4)] text-[11px] font-bold px-4 py-1.5 rounded-full transition-all active:scale-95 shadow-sm">
                <User className="w-3.5 h-3.5" />
                Login
              </button>
            )}

            
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden border-t border-border bg-card px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {navLinks.filter(link => !link.adminOnly || isAdmin).map((link) => {
              const Icon = link.icon;
              return (
                <button key={link.label} onClick={() => handleNavClick(link.path)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive(link.path) ? "bg-primary/15 text-primary"
                    : link.path === "#subscribe" || link.path === "#agent" ? "text-accent hover:bg-accent/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}>
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} mode={subscribeMode} />
      <AgentAccessModal open={showAgentAccess} onClose={() => setShowAgentAccess(false)}
        onAccess={() => { setShowAgentAccess(false); navigate("/agent"); }}
        onSubscribe={() => { setShowAgentAccess(false); setSubscribeMode("agent"); setShowSubscribe(true); }}
      />
    </>
  );
};

export default Header;
