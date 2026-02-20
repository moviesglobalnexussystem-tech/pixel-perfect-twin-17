import { useState, useEffect, useMemo } from "react";
import { Film, TrendingUp, Clock, Flame, Heart, Sparkles, Crown, Star } from "lucide-react";
import ContentRow from "@/components/ContentRow";
import GenreTags from "@/components/GenreTags";
import HeroBanner from "@/components/HeroBanner";
import LogoLoader from "@/components/LogoLoader";
import { subscribeMovies } from "@/lib/firebaseServices";
import type { MovieItem } from "@/data/adminData";
import type { Drama } from "@/data/dramas";

const toDrama = (m: MovieItem, i: number): Drama => ({
  id: i + 6000,
  title: m.name,
  image: m.posterUrl || "/placeholder.svg",
  badge: m.isComingSoon ? "Coming soon" : undefined,
  rank: m.isTopTen ? i + 1 : undefined,
  firebaseId: m.id,
  streamLink: m.streamLink,
  downloadLink: m.downloadLink,
  genre: m.genre,
  rating: m.rating,
  description: m.description,
  actors: m.actors,
  isVip: m.isVip,
  isHotDrama: m.isHotDrama,
  isOriginal: m.isOriginal,
  isAgent: m.isAgent,
  agentMarkedAt: m.agentMarkedAt,
  categories: m.categories,
  displayOrder: m.displayOrder || 0,
});

const isStillAgent = (d: Drama) => {
  if (!d.isAgent) return false;
  const markedAt = d.agentMarkedAt ? new Date(d.agentMarkedAt) : null;
  if (!markedAt) return false;
  return Math.floor((Date.now() - markedAt.getTime()) / (1000 * 60 * 60 * 24)) < 5;
};

const genreMatch = (genre: string | undefined, filter: string) => {
  if (!genre) return false;
  return genre.toLowerCase().includes(filter.toLowerCase());
};

const Movies = () => {
  const [movies, setMovies] = useState<MovieItem[] | null>(null);
  const [activeGenre, setActiveGenre] = useState("All Videos");

  useEffect(() => {
    return subscribeMovies(setMovies);
  }, []);

  const allDramas = useMemo(() => {
    if (!movies) return [];
    return movies
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((m, i) => toDrama(m, i)).map(d => {
        if (isStillAgent(d)) {
          const markedAt = new Date(d.agentMarkedAt!);
          const leaveDate = new Date(markedAt.getTime() + 5 * 24 * 60 * 60 * 1000);
          return { ...d, badge: `Available ${leaveDate.toLocaleDateString()}` };
        }
        return d;
      });
  }, [movies]);

  const dramas = useMemo(() => {
    if (activeGenre === "All Videos") return allDramas;
    return allDramas.filter(d => genreMatch(d.genre, activeGenre));
  }, [allDramas, activeGenre]);

  if (movies === null) {
    return (
      <div className="min-h-screen bg-background">
        <LogoLoader text="Loading movies..." />
      </div>
    );
  }

  const popular = dramas.filter(d => movies.find(m => m.id === d.firebaseId)?.isPopular);
  const comingSoon = dramas.filter(d => d.badge && (d.badge.startsWith("Coming") || d.badge.startsWith("Available")));
  const topTen = dramas.filter(d => d.rank != null).map((d, i) => ({ ...d, rank: i + 1 }));
  const sweetRomance = dramas.filter(d => movies.find(m => m.id === d.firebaseId)?.categories?.includes("Sweet Romance"));
  const ancientCostume = dramas.filter(d => movies.find(m => m.id === d.firebaseId)?.categories?.includes("Ancient Costume"));
  const highQuality = dramas.filter(d => movies.find(m => m.id === d.firebaseId)?.categories?.includes("High Quality Dramas"));
  const hotDrama = dramas.filter(d => movies.find(m => m.id === d.firebaseId)?.isHotDrama);

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner page="movies" compact />
      <GenreTags activeGenre={activeGenre} onGenreChange={setActiveGenre} />
      {dramas.length > 0 && <ContentRow title="All Movies" dramas={dramas} icon={Film} />}
      {popular.length > 0 && <ContentRow title="Popular Movies" dramas={popular} icon={TrendingUp} />}
      {topTen.length > 0 && <ContentRow title="Top Rated" dramas={topTen} icon={Star} showRank />}
      {comingSoon.length > 0 && <ContentRow title="Coming Soon & Upcoming" dramas={comingSoon} icon={Clock} />}
      {hotDrama.length > 0 && <ContentRow title="Hot" dramas={hotDrama} icon={Flame} />}
      {sweetRomance.length > 0 && <ContentRow title="Sweet Romance" dramas={sweetRomance} titleColor="hsl(30, 100%, 50%)" icon={Heart} />}
      {ancientCostume.length > 0 && <ContentRow title="Ancient Costume" dramas={ancientCostume} titleColor="hsl(30, 100%, 50%)" icon={Sparkles} />}
      {highQuality.length > 0 && <ContentRow title="High Quality" dramas={highQuality} icon={Crown} />}
      {dramas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Film className="w-10 h-10 mb-4" />
          <p className="text-sm font-medium">{activeGenre === "All Videos" ? "No movies uploaded yet" : `No movies found for "${activeGenre}"`}</p>
          <p className="text-xs mt-1">{activeGenre === "All Videos" ? "Check back soon or visit Admin to upload" : "Try a different genre filter"}</p>
        </div>
      )}
    </div>
  );
};

export default Movies;
