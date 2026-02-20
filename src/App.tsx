import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import Index from "./pages/Index";
import Watch from "./pages/Watch";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import TVChannel from "./pages/TVChannel";
import LiveSport from "./pages/LiveSport";
import Agent from "./pages/Agent";
import SharedContent from "./pages/SharedContent";
import AdminDashboard from "./pages/AdminDashboard";
import SectionPage from "./pages/SectionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/series" element={<Series />} />
            <Route path="/tv-channel" element={<TVChannel />} />
            <Route path="/live-sport" element={<LiveSport />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/shared/:shareCode" element={<SharedContent />} />
            <Route path="/section/:sectionId" element={<SectionPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
