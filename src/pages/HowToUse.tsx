import { useState } from "react";
import { 
  Film, Tv, Radio, Trophy, ShieldCheck, Download, Play, Search, 
  Share2, Star, ChevronDown, ChevronUp, Smartphone, Monitor, 
  UserPlus, LogIn, KeyRound, Crown, ArrowLeft, Globe, Heart,
  Clock, BookOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionItem = ({ title, icon, children, defaultOpen = false }: AccordionItemProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card/50">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">{icon}</div>
        <span className="text-foreground font-semibold text-sm flex-1">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 text-muted-foreground text-xs leading-relaxed space-y-3">{children}</div>}
    </div>
  );
};

const Step = ({ num, text }: { num: number; text: string }) => (
  <div className="flex gap-3 items-start">
    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{num}</div>
    <p className="pt-0.5">{text}</p>
  </div>
);

const HowToUse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-foreground font-bold text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> How to Use LUO FILM
          </h1>
          <p className="text-muted-foreground text-[10px]">Complete guide for all features</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Getting Started */}
        <AccordionItem title="Getting Started" icon={<UserPlus className="w-4 h-4 text-primary" />} defaultOpen>
          <p className="font-medium text-foreground">Welcome to LUO FILM! Here's how to get started:</p>
          <Step num={1} text="Open LUO FILM in your browser on any device — phone, tablet, or computer." />
          <Step num={2} text="Tap the Login button at the top right corner of the screen." />
          <Step num={3} text="You can create a new account using your email, password, name, and phone number. Or tap 'Continue with Google' to sign up quickly with your Google account." />
          <Step num={4} text="If you sign up with Google for the first time, you'll be asked to enter your phone number and set a password. This lets you also log in with your phone number later." />
          <Step num={5} text="Once logged in, you're ready to explore all the content!" />
        </AccordionItem>

        {/* Login Methods */}
        <AccordionItem title="Login Methods" icon={<LogIn className="w-4 h-4 text-primary" />}>
          <p className="font-medium text-foreground">You have two ways to log in:</p>
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <p><span className="text-foreground font-medium">📧 Email & Password:</span> Use the email and password you registered with. Type them in and tap "Login".</p>
            <p><span className="text-foreground font-medium">🔵 Google Sign-In:</span> Tap "Continue with Google" and select your Google account. Quick and easy!</p>
          </div>
          <p>Both methods work for the same account — if you registered with Google and set a password, you can use either method to log in.</p>
        </AccordionItem>

        {/* Install the App */}
        <AccordionItem title="Install the App on Your Phone" icon={<Download className="w-4 h-4 text-primary" />}>
          <p className="font-medium text-foreground">LUO FILM works like a real app on your phone!</p>
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <p className="font-medium text-foreground flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> On Android:</p>
            <Step num={1} text="Open LUO FILM in Chrome browser." />
            <Step num={2} text="You'll see an 'Install LUO FILM App' banner at the bottom or an Install button at the top. Tap it." />
            <Step num={3} text="Tap 'Install' on the popup. The app icon will appear on your home screen!" />
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <p className="font-medium text-foreground flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> On iPhone (Safari):</p>
            <Step num={1} text="Open LUO FILM in Safari browser." />
            <Step num={2} text="Tap the Share button (square with arrow) at the bottom of Safari." />
            <Step num={3} text="Scroll down and tap 'Add to Home Screen'." />
            <Step num={4} text="Tap 'Add'. The app will appear on your home screen like a real app!" />
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <p className="font-medium text-foreground flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> On Computer (Chrome):</p>
            <Step num={1} text="Open LUO FILM in Chrome." />
            <Step num={2} text="Click the Install button in the header, or look for the install icon in the address bar." />
            <Step num={3} text="Click 'Install'. The app will open in its own window!" />
          </div>
        </AccordionItem>

        {/* Watching Movies */}
        <AccordionItem title="Watching Movies" icon={<Film className="w-4 h-4 text-primary" />}>
          <p className="font-medium text-foreground">How to find and watch movies:</p>
          <Step num={1} text="Tap 'Movies' from the bottom navigation bar (on phone) or the top menu (on desktop)." />
          <Step num={2} text="Browse through the movie collection. You'll see movie posters with titles." />
          <Step num={3} text="Tap any movie poster to open it." />
          <Step num={4} text="On the movie page, tap the Play button to start watching." />
          <Step num={5} text="Use the video controls to pause, play, adjust volume, or go fullscreen." />
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-primary text-[11px] font-medium">💡 Tip: On the home page, scroll through different sections like 'Editor's Selection', 'Popular Movies', and genre categories to discover new content!</p>
          </div>
        </AccordionItem>

        {/* Watching Series */}
        <AccordionItem title="Watching Series" icon={<Tv className="w-4 h-4 text-primary" />}>
          <p className="font-medium text-foreground">How to find and watch TV series:</p>
          <Step num={1} text="Tap 'Series' from the bottom navigation or top menu." />
          <Step num={2} text="Browse the series collection and tap on one you like." />
          <Step num={3} text="On the series page, you'll see episode thumbnails listed. Tap an episode to start watching." />
          <Step num={4} text="Episodes play one after another. Use the episode list to jump to any episode." />
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-primary text-[11px] font-medium">💡 Tip: New episodes are added regularly — check back often for updates!</p>
          </div>
        </AccordionItem>

        {/* Live TV */}
        <AccordionItem title="Live TV Channels" icon={<Radio className="w-4 h-4 text-primary" />}>
          <p className="font-medium text-foreground">Watch live TV channels:</p>
          <Step num={1} text="Tap 'Live TV' from the bottom navigation or top menu." />
          <Step num={2} text="You'll see a list of available live TV channels." />
          <Step num={3} text="Tap on any channel to start watching the live broadcast." />
          <Step num={4} text="Live TV streams in real-time — you're watching what's happening now!" />
          <div className="bg-accent/10 rounded-lg p-3">
            <p className="text-accent text-[11px] font-medium">⚡ Note: Live TV requires a stable internet connection for smooth playback.</p>
          </div>
        </AccordionItem>

        {/* Live Sport */}
        <AccordionItem title="Live Sports" icon={<Trophy className="w-4 h-4 text-primary" />}>
          <p className="font-medium text-foreground">Watch live sports events:</p>
          <Step num={1} text="Tap 'Sport' from the bottom navigation or top menu." />
          <Step num={2} text="Browse upcoming and live sports events." />
          <Step num={3} text="Tap on a match or event to watch the live stream." />
          <Step num={4} text="Enjoy real-time sports action including football, basketball, and more!" />
        </AccordionItem>

        {/* Browsing Sections */}
        <AccordionItem title="Browsing Content Sections" icon={<Search className="w-4 h-4 text-primary" />}>
          <p className="font-medium text-foreground">Explore content organized in sections:</p>
          <Step num={1} text="On the home page, you'll see sections like 'Editor's Selection', 'Popular', 'Top Rated', and genre sections." />
          <Step num={2} text="Scroll horizontally through any section to see more titles." />
          <Step num={3} text="Tap the section title or the arrow (→) next to it to see ALL content in that section — up to 100 titles!" />
          <Step num={4} text="On the full section page, browse the complete grid of movies and series." />
          <Step num={5} text="Tap any title to start watching." />
        </AccordionItem>

        {/* Sharing Content */}
        <AccordionItem title="Sharing Content" icon={<Share2 className="w-4 h-4 text-primary" />}>
          <p className="font-medium text-foreground">Share movies and series with friends:</p>
          <Step num={1} text="Open any movie or series you want to share." />
          <Step num={2} text="Look for the Share button on the player or content page." />
          <Step num={3} text="Copy the link and send it to your friends via WhatsApp, Telegram, or any messaging app." />
          <Step num={4} text="When your friend opens the link, they'll go directly to that content!" />
        </AccordionItem>

        {/* Subscribe Section */}
        <AccordionItem title="Subscription Plans" icon={<Crown className="w-4 h-4 text-primary" />}>
          <p className="font-medium text-foreground">Unlock premium features with a subscription:</p>
          <Step num={1} text="Tap 'Subscribe' from the top menu or look for subscription prompts in the app." />
          <Step num={2} text="Choose a subscription plan that suits you." />
          <Step num={3} text="Follow the payment instructions to activate your subscription." />
          <Step num={4} text="Once subscribed, enjoy all premium content and features!" />
        </AccordionItem>

        {/* Agent Section */}
        <div className="pt-4">
          <h2 className="text-foreground font-bold text-base flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-accent" /> Agent 1X Guide
          </h2>
        </div>

        <AccordionItem title="What is Agent 1X?" icon={<ShieldCheck className="w-4 h-4 text-accent" />}>
          <p>Agent 1X is a special program for authorized agents who help distribute and share LUO FILM content. As an agent, you get access to a personal dashboard with tools to manage and share content.</p>
          <div className="bg-accent/10 rounded-lg p-3 space-y-1.5">
            <p className="text-accent font-medium text-[11px]">🛡️ Agent Benefits:</p>
            <p>• Personal agent dashboard</p>
            <p>• Shareable content links</p>
            <p>• Track your shared content</p>
            <p>• Manage your agent profile</p>
          </div>
        </AccordionItem>

        <AccordionItem title="How to Become an Agent" icon={<KeyRound className="w-4 h-4 text-accent" />}>
          <p className="font-medium text-foreground">Follow these steps to become a LUO FILM agent:</p>
          <Step num={1} text="Tap 'Agent' from the bottom navigation (the center green button) or 'Agent 1X' from the top menu." />
          <Step num={2} text="A popup will appear. If you don't have an Agent ID yet, tap 'Subscribe for Agent Plan'." />
          <Step num={3} text="Choose the Agent subscription plan and complete the payment." />
          <Step num={4} text="After payment, you'll receive your unique Agent ID (like AG-XXXX-001)." />
          <Step num={5} text="Save your Agent ID safely — you'll need it every time you access the Agent dashboard." />
        </AccordionItem>

        <AccordionItem title="How to Access Agent Dashboard" icon={<LogIn className="w-4 h-4 text-accent" />}>
          <p className="font-medium text-foreground">Access your agent dashboard:</p>
          <Step num={1} text="Tap 'Agent' from the bottom navigation (center green button) or 'Agent 1X' from the top menu." />
          <Step num={2} text="In the popup, enter your Agent ID (e.g., AG-XXXX-001) in the input field." />
          <Step num={3} text="Tap 'Access Dashboard' to verify your ID." />
          <Step num={4} text="If your ID is valid and active, you'll be taken to your Agent Dashboard!" />
          <div className="bg-destructive/10 rounded-lg p-3 space-y-1.5">
            <p className="text-destructive font-medium text-[11px]">⚠️ Common Issues:</p>
            <p><span className="text-foreground font-medium">"Agent Not Found"</span> — Double-check your Agent ID. Make sure it's typed correctly with the correct format.</p>
            <p><span className="text-foreground font-medium">"Account Blocked"</span> — Your agent account has been suspended. Contact support for help.</p>
            <p><span className="text-foreground font-medium">"Subscription Expired"</span> — Your agent subscription needs renewal. Subscribe again to continue.</p>
          </div>
        </AccordionItem>

        <AccordionItem title="Using Agent Dashboard" icon={<Globe className="w-4 h-4 text-accent" />}>
          <p className="font-medium text-foreground">What you can do in the Agent Dashboard:</p>
          <Step num={1} text="View your agent profile and status at the top of the dashboard." />
          <Step num={2} text="Browse content available for sharing." />
          <Step num={3} text="Generate share links for movies and series to send to your audience." />
          <Step num={4} text="Track how your shared links are performing." />
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-primary text-[11px] font-medium">💡 Tip: Share your links on social media, WhatsApp groups, and Telegram channels to reach more people!</p>
          </div>
        </AccordionItem>

        {/* FAQ */}
        <div className="pt-4">
          <h2 className="text-foreground font-bold text-base flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary" /> Frequently Asked Questions
          </h2>
        </div>

        <AccordionItem title="Is LUO FILM free?" icon={<Star className="w-4 h-4 text-primary" />}>
          <p>LUO FILM offers both free and premium content. Browse and discover content for free, and subscribe for full access to all premium movies, series, and features.</p>
        </AccordionItem>

        <AccordionItem title="What devices can I use?" icon={<Monitor className="w-4 h-4 text-primary" />}>
          <p>LUO FILM works on all devices with a modern web browser:</p>
          <p>• 📱 <span className="text-foreground font-medium">Phones</span> — Android & iPhone</p>
          <p>• 💻 <span className="text-foreground font-medium">Computers</span> — Windows, Mac, Linux</p>
          <p>• 📟 <span className="text-foreground font-medium">Tablets</span> — iPad, Android tablets</p>
          <p>Install the app for the best experience!</p>
        </AccordionItem>

        <AccordionItem title="Video won't play — what do I do?" icon={<Play className="w-4 h-4 text-primary" />}>
          <p>Try these steps if a video doesn't play:</p>
          <Step num={1} text="Check your internet connection — try loading another website." />
          <Step num={2} text="Refresh the page by pulling down (on phone) or pressing F5 (on computer)." />
          <Step num={3} text="Try a different browser (Chrome usually works best)." />
          <Step num={4} text="Clear your browser cache and try again." />
          <Step num={5} text="If it still doesn't work, the content may be temporarily unavailable." />
        </AccordionItem>

        <AccordionItem title="How do I update the app?" icon={<Clock className="w-4 h-4 text-primary" />}>
          <p>LUO FILM updates automatically! Since it's a web app, you always get the latest version when you open it. If you installed it:</p>
          <p>• Just close and reopen the app</p>
          <p>• Or refresh the page in your browser</p>
        </AccordionItem>

      </div>
    </div>
  );
};

export default HowToUse;
