import { useState, useEffect } from "react";
import ContentRow from "@/components/ContentRow";
import GenreTags from "@/components/GenreTags";
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

const Movies = () => {
  const [movies, setMovies] = useState<MovieItem[] | null>(null);

  useEffect(() => {
    return subscribeMovies(setMovies);
  }, []);

  if (movies === null) {
    return (
      <div className="min-h-screen bg-background">
        <LogoLoader text="Loading movies..." />
      </div>
    );
  }

  const dramas = movies
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .map((m, i) => toDrama(m, i)).map(d => {
    if (isStillAgent(d)) {
      const markedAt = new Date(d.agentMarkedAt!);
      const leaveDate = new Date(markedAt.getTime() + 5 * 24 * 60 * 60 * 1000);
      return { ...d, badge: `Available ${leaveDate.toLocaleDateString()}` };
    }
    return d;
  });

  const popular = dramas.filter(d => movies.find(m => m.id === d.firebaseId)?.isPopular);
  const comingSoon = dramas.filter(d => d.badge && (d.badge.startsWith("Coming") || d.badge.startsWith("Available")));
  const topTen = dramas.filter(d => d.rank != null).map((d, i) => ({ ...d, rank: i + 1 }));
  const sweetRomance = dramas.filter(d => movies.find(m => m.id === d.firebaseId)?.categories?.includes("Sweet Romance"));
  const ancientCostume = dramas.filter(d => movies.find(m => m.id === d.firebaseId)?.categories?.includes("Ancient Costume"));
  const highQuality = dramas.filter(d => movies.find(m => m.id === d.firebaseId)?.categories?.includes("High Quality Dramas"));
  const hotDrama = dramas.filter(d => movies.find(m => m.id === d.firebaseId)?.isHotDrama);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 py-6">
        <h1 className="text-foreground text-xl font-bold mb-1">Movies</h1>
        <p className="text-muted-foreground text-xs mb-4">Explore blockbuster movies and exclusives</p>
      </div>
      <GenreTags />
      {dramas.length > 0 && <ContentRow title="🎬 All Movies" dramas={dramas} />}
      {popular.length > 0 && <ContentRow title="Popular Movies" dramas={popular} />}
      {topTen.length > 0 && <ContentRow title="Top Rated" dramas={topTen} showRank />}
      {comingSoon.length > 0 && <ContentRow title="Coming Soon & Upcoming" dramas={comingSoon} />}
      {hotDrama.length > 0 && <ContentRow title="🔥 Hot" dramas={hotDrama} />}
      {sweetRomance.length > 0 && <ContentRow title="Sweet Romance" dramas={sweetRomance} titleColor="hsl(30, 100%, 50%)" />}
      {ancientCostume.length > 0 && <ContentRow title="Ancient Costume" dramas={ancientCostume} titleColor="hsl(30, 100%, 50%)" />}
      {highQuality.length > 0 && <ContentRow title="High Quality" dramas={highQuality} />}
      {dramas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <span className="text-4xl mb-4">🎬</span>
          <p className="text-sm font-medium">No movies uploaded yet</p>
          <p className="text-xs mt-1">Check back soon or visit Admin to upload</p>
        </div>
      )}
    </div>
  );
};

export default Movies;
