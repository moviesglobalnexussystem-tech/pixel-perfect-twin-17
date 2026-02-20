import { useState, useEffect } from "react";
import ContentRow from "@/components/ContentRow";
import GenreTags from "@/components/GenreTags";
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

const Series = () => {
  const [seriesList, setSeriesList] = useState<SeriesItem[] | null>(null);

  useEffect(() => {
    return subscribeSeries(setSeriesList);
  }, []);

  if (seriesList === null) {
    return (
      <div className="min-h-screen bg-background">
        <LogoLoader text="Loading series..." />
      </div>
    );
  }

  const dramas = seriesList
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .map((s, i) => toDrama(s, i));
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
      <div className="px-4 md:px-8 py-6">
        <h1 className="text-foreground text-xl font-bold mb-1">Series</h1>
        <p className="text-muted-foreground text-xs mb-4">Binge-worthy drama series updated daily</p>
      </div>
      <GenreTags />
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
          <p className="text-sm font-medium">No series uploaded yet</p>
          <p className="text-xs mt-1">Check back soon or visit Admin to upload</p>
        </div>
      )}
    </div>
  );
};

export default Series;
