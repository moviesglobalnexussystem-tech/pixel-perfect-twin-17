import SportsSection from "@/components/SportsSection";
import SportHeroBanner from "@/components/SportHeroBanner";

const LiveSport = () => {
  return (
    <div className="min-h-screen bg-background">
      <SportHeroBanner />
      <div className="px-4 md:px-8 py-4">
        <h2 className="text-foreground text-lg font-bold mb-1">Today's Matches</h2>
        <p className="text-muted-foreground text-[11px] mb-4">Live scores, upcoming fixtures & results</p>
      </div>
      <SportsSection />
    </div>
  );
};

export default LiveSport;
