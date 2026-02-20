import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import ActivityTrackerProvider from "./components/ActivityTrackerProvider";
import GooglePhoneModal from "./components/GooglePhoneModal";
import Index from "./pages/Index";
import Watch from "./pages/Watch";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import TVChannel from "./pages/TVChannel";
import LiveSport from "./pages/LiveSport";
import Agent from "./pages/Agent";
import AgentWatch from "./pages/AgentWatch";
import AudiencePage from "./pages/AudiencePage";
import SharedContent from "./pages/SharedContent";
import AdminDashboard from "./pages/AdminDashboard";
import SectionPage from "./pages/SectionPage";
import HowToUse from "./pages/HowToUse";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const location = useLocation();
  const isAudiencePage = location.pathname.startsWith("/a/");

  return (
    <>
      <ActivityTrackerProvider />
      <GooglePhonePrompt />
      {!isAudiencePage && <Header />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/series" element={<Series />} />
        <Route path="/tv-channel" element={<TVChannel />} />
        <Route path="/live-sport" element={<LiveSport />} />
        <Route path="/agent" element={<Agent />} />
        <Route path="/agent-watch/:id" element={<AgentWatch />} />
        <Route path="/a/:shareCode" element={<AudiencePage />} />
        <Route path="/shared/:shareCode" element={<SharedContent />} />
        <Route path="/section/:sectionId" element={<SectionPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/how-to-use" element={<HowToUse />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAudiencePage && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// Wrapper to show Google phone prompt
import { useAuth } from "./contexts/AuthContext";

const GooglePhonePrompt = () => {
  const { needsPhoneSetup, setNeedsPhoneSetup } = useAuth();
  return <GooglePhoneModal open={needsPhoneSetup} onClose={() => setNeedsPhoneSetup(false)} />;
};

export default App;
