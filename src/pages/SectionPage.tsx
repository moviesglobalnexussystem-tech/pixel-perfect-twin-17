import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import DramaCard from "@/components/DramaCard";
import LogoLoader from "@/components/LogoLoader";
import { subscribeMovies, subscribeSeries } from "@/lib/firebaseServices";
import type { MovieItem, SeriesItem } from "@/data/adminData";
import type { Drama } from "@/data/dramas";

const toDrama = (item: MovieItem | SeriesItem, i: number): Drama => ({
  id: i + 8000,
  title: item.name,
  image: item.posterUrl || "/placeholder.svg",
  episodes: "totalEpisodes" in item ? `${item.totalEpisodes} Episodes` : undefined,
  badge: item.isComingSoon ? "Coming soon" : undefined,
  rank: item.isTopTen ? i + 1 : undefined,
  firebaseId: item.id,
  streamLink: "streamLink" in item ? item.streamLink : undefined,
  downloadLink: "downloadLink" in item ? item.downloadLink : undefined,
  genre: item.genre,
  rating: item.rating,
  description: item.description,
  actors: item.actors,
  isVip: item.isVip,
  isHotDrama: item.isHotDrama,
  isOriginal: item.isOriginal,
  isAgent: "isAgent" in item ? item.isAgent : false,
  agentMarkedAt: "agentMarkedAt" in item ? item.agentMarkedAt : null,
  categories: item.categories,
  displayOrder: item.displayOrder || 0,
});

const SECTION_CONFIG: Record<string, { title: string; emoji: string; filter: (m: MovieItem[], s: SeriesItem[]) => (MovieItem | SeriesItem)[] }> = {
  "movies": {
    title: "All Movies",
    emoji: "🎬",
    filter: (m) => m,
  },
  "series": {
    title: "All Series",
    emoji: "📺",
    filter: (_, s) => s,
  },
  "popular": {
    title: "Popular on LUO FILM",
    emoji: "🔥",
    filter: (m, s) => [...m.filter(i => i.isPopular), ...s.filter(i => i.isPopular)],
  },
  "coming-soon": {
    title: "Coming Soon & Upcoming",
    emoji: "⏳",
    filter: (m, s) => [...m.filter(i => i.isComingSoon), ...s.filter(i => i.isComingSoon)],
  },
  "top-rated": {
    title: "Top Rated",
    emoji: "🏆",
    filter: (m, s) => [...m.filter(i => i.isTopTen), ...s.filter(i => i.isTopTen)],
  },
  "drama-selection": {
    title: "Drama Selection",
    emoji: "⭐",
    filter: (m, s) => [...m.filter(i => i.isTopTen), ...s.filter(i => i.isTopTen)],
  },
  "editors-selection": {
    title: "Editor's Selection",
    emoji: "✨",
    filter: (m, s) => [...m.filter(i => i.categories?.includes("Drama Selection")), ...s.filter(i => i.categories?.includes("Drama Selection"))],
  },
  "high-quality": {
    title: "High-quality Dramas",
    emoji: "💎",
    filter: (m, s) => [...m.filter(i => i.categories?.includes("High Quality Dramas")), ...s.filter(i => i.categories?.includes("High Quality Dramas"))],
  },
  "hot-dramas": {
    title: "Hot Dramas",
    emoji: "🔥",
    filter: (m, s) => [...m.filter(i => i.isHotDrama), ...s.filter(i => i.isHotDrama)],
  },
  "sweet-romance": {
    title: "Sweet Romance",
    emoji: "💕",
    filter: (m, s) => [...m.filter(i => i.categories?.includes("Sweet Romance")), ...s.filter(i => i.categories?.includes("Sweet Romance"))],
  },
  "ancient-costume": {
    title: "Ancient Costume",
    emoji: "🏯",
    filter: (m, s) => [...m.filter(i => i.categories?.includes("Ancient Costume")), ...s.filter(i => i.categories?.includes("Ancient Costume"))],
  },
  "popular-series": {
    title: "Popular Series",
    emoji: "📺",
    filter: (_, s) => s.filter(i => i.isPopular),
  },
  "popular-movies": {
    title: "Popular Movies",
    emoji: "🎬",
    filter: (m) => m.filter(i => i.isPopular),
  },
  "hot-movies": {
    title: "Hot Movies",
    emoji: "🔥",
    filter: (m) => m.filter(i => i.isHotDrama),
  },
  "hot-series": {
    title: "Hot Series",
    emoji: "🔥",
    filter: (_, s) => s.filter(i => i.isHotDrama),
  },
};

const SectionPage = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<MovieItem[] | null>(null);
  const [seriesList, setSeriesList] = useState<SeriesItem[] | null>(null);

  useEffect(() => {
    const unsub1 = subscribeMovies(setMovies);
    const unsub2 = subscribeSeries(setSeriesList);
    return () => { unsub1(); unsub2(); };
  }, []);

  const config = SECTION_CONFIG[sectionId || ""];
  const loading = movies === null || seriesList === null;

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground text-sm">Section not found</p>
        <button onClick={() => navigate(-1)} className="text-primary text-xs mt-2">Go Back</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LogoLoader text={`Loading ${config.title}...`} />
      </div>
    );
  }

  const items = config.filter(movies, seriesList);
  const sorted = items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const dramas = sorted.slice(0, 100).map((item, i) => toDrama(item, i));
  const showRank = sectionId === "top-rated" || sectionId === "drama-selection" || sectionId === "editors-selection";

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs mb-3 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-foreground text-xl font-bold mb-1">
          {config.emoji} {config.title}
        </h1>
        <p className="text-muted-foreground text-xs mb-4">{dramas.length} items</p>
      </div>

      <div className="px-4 md:px-8 pb-24">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {dramas.map((drama, i) => (
            <DramaCard
              key={drama.firebaseId || drama.id}
              drama={showRank ? { ...drama, rank: i + 1 } : drama}
              showRank={showRank}
            />
          ))}
        </div>
        {dramas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <span className="text-4xl mb-4">{config.emoji}</span>
            <p className="text-sm font-medium">No content in this section yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionPage;
