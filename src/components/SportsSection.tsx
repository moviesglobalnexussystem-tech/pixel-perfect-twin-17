import { ChevronLeft, ChevronRight, Play, Clock, CheckCircle2 } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllMatches, type SportMatch } from "@/data/sportsData";

const MatchCard = ({ match, onClick }: { match: SportMatch; onClick: () => void }) => {
  const isLive = match.status === "live";
  const isEnded = match.status === "ended";
  const isUpcoming = match.status === "upcoming";

  return (
    <div onClick={onClick} className="bg-card rounded-lg overflow-hidden border border-border hover:border-muted-foreground/30 transition-colors cursor-pointer">
      {/* Status bar */}
      <div className="px-3 py-1.5">
        {isLive ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-[10px] font-bold uppercase">Live</span>
            {match.timeDesc && <span className="text-primary text-[10px]">· {match.timeDesc}</span>}
          </div>
        ) : isEnded ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground text-[10px] font-bold">FT</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-accent" />
            <span className="text-accent text-[10px] font-bold">Upcoming</span>
            <span className="text-muted-foreground text-[10px]">· {match.countdown}</span>
          </div>
        )}
      </div>

      {/* League */}
      <div className="px-3 pb-1">
        <p className="text-muted-foreground text-[8px] truncate">{match.league}</p>
      </div>

      {/* Match content */}
      <div className="px-3 pb-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-center gap-1 flex-1">
            {match.homeAvatar ? (
              <img src={match.homeAvatar} alt={match.homeTeam} className="w-8 h-8 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground bg-secondary border border-border">
                {match.homeTeam.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2">
            {isLive || isEnded ? (
              <>
                <span className="text-foreground text-lg font-bold">{match.homeScore}</span>
                <span className="text-muted-foreground text-xs">-</span>
                <span className="text-foreground text-lg font-bold">{match.awayScore}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs font-medium">VS</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 flex-1">
            {match.awayAvatar ? (
              <img src={match.awayAvatar} alt={match.awayTeam} className="w-8 h-8 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground bg-secondary border border-border">
                {match.awayTeam.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teams label + action */}
      <div className="px-3 pb-2.5">
        <p className="text-foreground text-[10px] text-center truncate mb-1.5">
          {match.homeTeam} VS {match.awayTeam}
        </p>
        {isLive && match.playPath ? (
          <div className="flex items-center justify-center gap-1 text-primary text-[9px] font-bold">
            <Play className="w-3 h-3 fill-current" /> Watch Live
          </div>
        ) : isUpcoming ? (
          <p className="text-center text-accent text-[9px]">
            {new Date(match.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        ) : isEnded && match.matchResult ? (
          <p className="text-center text-muted-foreground text-[9px] truncate">{match.matchResult}</p>
        ) : null}
      </div>
    </div>
  );
};

type FilterTab = "all" | "live" | "upcoming" | "ended";

const SportsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const data = await fetchAllMatches();
      if (!cancelled) {
        setMatches(data);
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleMatchClick = (match: SportMatch) => {
    // Only allow navigation to watch for live matches with a stream
    if (match.status === "live" && (match.playPath || match.playSource.length > 0)) {
      navigate(`/watch/sport-${match.id}`, {
        state: {
          matchId: match.id,
          playPath: match.playPath,
          playSource: match.playSource,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          highlights: match.highlights,
          isLive: true,
        },
      });
    } else if (match.status === "ended" && match.highlights.length > 0) {
      navigate(`/watch/sport-${match.id}`, {
        state: {
          matchId: match.id,
          playPath: "",
          playSource: [],
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          highlights: match.highlights,
        },
      });
    }
    // Upcoming matches - no navigation, just show info
  };

  const filtered = filter === "all" ? matches : matches.filter((m) => m.status === filter);

  const liveCount = matches.filter((m) => m.status === "live").length;
  const upcomingCount = matches.filter((m) => m.status === "upcoming").length;
  const endedCount = matches.filter((m) => m.status === "ended").length;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: matches.length },
    { key: "live", label: "🔴 Live", count: liveCount },
    { key: "upcoming", label: "⏳ Upcoming", count: upcomingCount },
    { key: "ended", label: "✅ FT", count: endedCount },
  ];

  return (
    <section className="px-4 md:px-10 mb-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className={`text-[10px] ${filter === tab.key ? "text-primary-foreground/70" : "opacity-60"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2.5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-card rounded-lg border border-border h-[140px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No {filter === "all" ? "" : filter} matches available right now.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 pb-1">
          {filtered.map((match) => (
            <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match)} />
          ))}
        </div>
      )}
    </section>
  );
};

export default SportsSection;
