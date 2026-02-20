import { useState, useEffect, useMemo } from "react";
import ContentRow from "@/components/ContentRow";
import GenreTags from "@/components/GenreTags";
import HeroBanner from "@/components/HeroBanner";
import LogoLoader from "@/components/LogoLoader";
import { subscribeSeries } from "@/lib/firebaseServices";
import type { SeriesItem } from "@/data/adminData";
import type { Drama } from "@/data/dramas";

const toDrama = (s: SeriesItem, i: number): Drama => ({
  id: i + 7000,
  title: s.name,
  image: s.posterUrl || "/placeholder.svg",
  episodes: `${s.totalEpisodes} Episodes`,
  badge: s.isComingSoon ? "Coming soon" : undefined,
  rank: s.isTopTen ? i + 1 : undefined,
  firebaseId: s.id,
  genre: s.genre,
  rating: s.rating,
  description: s.description,
  actors: s.actors,
  isVip: s.isVip,
  isHotDrama: s.isHotDrama,
  isOriginal: s.isOriginal,
  categories: s.categories,
  displayOrder: s.displayOrder || 0,
});

const genreMatch = (genre: string | undefined, filter: string) => {
  if (!genre) return false;
  return genre.toLowerCase().includes(filter.toLowerCase());
};

const Series = () => {
  const [seriesList, setSeriesList] = useState<SeriesItem[] | null>(null);
  const [activeGenre, setActiveGenre] = useState("All Videos");

  useEffect(() => {
    return subscribeSeries(setSeriesList);
  }, []);

  const allDramas = useMemo(() => {
    if (!seriesList) return [];
    return seriesList
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((s, i) => toDrama(s, i));
  }, [seriesList]);

  const dramas = useMemo(() => {
    if (activeGenre === "All Videos") return allDramas;
    return allDramas.filter(d => genreMatch(d.genre, activeGenre));
  }, [allDramas, activeGenre]);

  if (seriesList === null) {
    return (
      <div className="min-h-screen bg-background">
        <LogoLoader text="Loading series..." />
      </div>
    );
  }

  const popular = dramas.filter(d => seriesList.find(s => s.id === d.firebaseId)?.isPopular);
  const comingSoon = dramas.filter(d => d.badge === "Coming soon");
  const topTen = dramas.filter(d => d.rank != null).map((d, i) => ({ ...d, rank: i + 1 }));
  const sweetRomance = dramas.filter(d => seriesList.find(s => s.id === d.firebaseId)?.categories?.includes("Sweet Romance"));
  const ancientCostume = dramas.filter(d => seriesList.find(s => s.id === d.firebaseId)?.categories?.includes("Ancient Costume"));
  const highQuality = dramas.filter(d => seriesList.find(s => s.id === d.firebaseId)?.categories?.includes("High Quality Dramas"));
  const dramaSelection = dramas.filter(d => seriesList.find(s => s.id === d.firebaseId)?.categories?.includes("Drama Selection"));
  const hotDrama = dramas.filter(d => seriesList.find(s => s.id === d.firebaseId)?.isHotDrama);

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner page="series" compact />
      <GenreTags activeGenre={activeGenre} onGenreChange={setActiveGenre} />
      {dramas.length > 0 && <ContentRow title="📺 All Series" dramas={dramas} />}
      {popular.length > 0 && <ContentRow title="Popular Series" dramas={popular} />}
      {topTen.length > 0 && <ContentRow title="Top Rated" dramas={topTen} showRank />}
      {comingSoon.length > 0 && <ContentRow title="Coming Soon" dramas={comingSoon} />}
      {hotDrama.length > 0 && <ContentRow title="🔥 Hot Dramas" dramas={hotDrama} />}
      {sweetRomance.length > 0 && <ContentRow title="Sweet Romance" dramas={sweetRomance} titleColor="hsl(30, 100%, 50%)" />}
      {ancientCostume.length > 0 && <ContentRow title="Ancient Costume" dramas={ancientCostume} titleColor="hsl(30, 100%, 50%)" />}
      {highQuality.length > 0 && <ContentRow title="High Quality" dramas={highQuality} />}
      {dramaSelection.length > 0 && <ContentRow title="Drama Selection" dramas={dramaSelection} showRank />}
      {dramas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <span className="text-4xl mb-4">📺</span>
          <p className="text-sm font-medium">{activeGenre === "All Videos" ? "No series uploaded yet" : `No series found for "${activeGenre}"`}</p>
          <p className="text-xs mt-1">{activeGenre === "All Videos" ? "Check back soon or visit Admin to upload" : "Try a different genre filter"}</p>
        </div>
      )}
    </div>
  );
};

export default Series;
