import { useState, useEffect } from "react";
import HeroBanner from "@/components/HeroBanner";
import ContentRow from "@/components/ContentRow";
import GenreTags from "@/components/GenreTags";
import AppBanner from "@/components/AppBanner";
import LogoLoader from "@/components/LogoLoader";

import { subscribeMovies, subscribeSeries } from "@/lib/firebaseServices";
import type { MovieItem, SeriesItem } from "@/data/adminData";
import type { Drama } from "@/data/dramas";

const ALL_CATEGORIES = [
  "Popular",
  "Coming Soon",
  "Top Ten",
  "Sweet Romance",
  "Ancient Costume",
  "High Quality Dramas",
  "Drama Selection",
  "Hot Drama",
];

const toDrama = (item: MovieItem | SeriesItem, i: number): Drama => ({
  id: i + 5000,
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
});

const Index = () => {
  const [fbMovies, setFbMovies] = useState<(MovieItem & { _idx: number })[] | null>(null);
  const [fbSeries, setFbSeries] = useState<(SeriesItem & { _idx: number })[] | null>(null);

  useEffect(() => {
    const unsub1 = subscribeMovies((movies) =>
      setFbMovies(movies.map((m, i) => ({ ...m, _idx: i })))
    );
    const unsub2 = subscribeSeries((series) =>
      setFbSeries(series.map((s, i) => ({ ...s, _idx: i + 1000 })))
    );
    return () => { unsub1(); unsub2(); };
  }, []);

  const loading = fbMovies === null || fbSeries === null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative w-full aspect-[16/7] bg-card animate-pulse" />
        <LogoLoader text="Loading content..." />
      </div>
    );
  }

  const isStillAgent = (d: Drama) => {
    if (!d.isAgent) return false;
    const markedAt = d.agentMarkedAt ? new Date(d.agentMarkedAt) : null;
    if (!markedAt) return false;
    return Math.floor((Date.now() - markedAt.getTime()) / (1000 * 60 * 60 * 24)) < 5;
  };

  const all = [
    ...fbMovies.map(m => toDrama(m, m._idx)),
    ...fbSeries.map(s => toDrama(s, s._idx)),
  ];

  const displayAll = all.map(d => {
    if (isStillAgent(d)) {
      const markedAt = new Date(d.agentMarkedAt!);
      const leaveDate = new Date(markedAt.getTime() + 5 * 24 * 60 * 60 * 1000);
      return { ...d, badge: `Available ${leaveDate.toLocaleDateString()}`, streamLink: undefined };
    }
    return d;
  });

  const popular = displayAll.filter(d => fbMovies.find(m => m.id === d.firebaseId)?.isPopular || fbSeries.find(s => s.id === d.firebaseId)?.isPopular);
  const comingSoon = displayAll.filter(d => d.badge?.startsWith("Coming") || d.badge?.startsWith("Available"));
  const topTen = displayAll.filter(d => d.rank != null).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).map((d, i) => ({ ...d, rank: i + 1 }));
  const sweetRomance = displayAll.filter(d => {
    const item = fbMovies.find(m => m.id === d.firebaseId) || fbSeries.find(s => s.id === d.firebaseId);
    return item?.categories?.includes("Sweet Romance");
  });
  const ancientCostume = displayAll.filter(d => {
    const item = fbMovies.find(m => m.id === d.firebaseId) || fbSeries.find(s => s.id === d.firebaseId);
    return item?.categories?.includes("Ancient Costume");
  });
  const highQuality = displayAll.filter(d => {
    const item = fbMovies.find(m => m.id === d.firebaseId) || fbSeries.find(s => s.id === d.firebaseId);
    return item?.categories?.includes("High Quality Dramas");
  });
  const dramaSelection = displayAll.filter(d => {
    const item = fbMovies.find(m => m.id === d.firebaseId) || fbSeries.find(s => s.id === d.firebaseId);
    return item?.categories?.includes("Drama Selection");
  });
  const hotDrama = displayAll.filter(d => {
    const item = fbMovies.find(m => m.id === d.firebaseId) || fbSeries.find(s => s.id === d.firebaseId);
    return item?.isHotDrama;
  });

  const onlyMovies = fbMovies.map(m => toDrama(m, m._idx)).map(d => isStillAgent(d) ? { ...d, badge: "Upcoming", streamLink: undefined } : d);
  const onlySeries = fbSeries.map(s => toDrama(s, s._idx));

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner />
      <div className="mt-6">
        {onlyMovies.length > 0 && <ContentRow title="🔥 Movies" dramas={onlyMovies} />}
        {onlySeries.length > 0 && <ContentRow title="📺 Series" dramas={onlySeries} />}
        {popular.length > 0 && <ContentRow title="Popular on LUO FILM" dramas={popular} />}
        {comingSoon.length > 0 && <ContentRow title="Coming Soon & Upcoming" dramas={comingSoon} />}
        
        <GenreTags />
        {topTen.length > 0 && <ContentRow title="Drama Selection" dramas={topTen} showRank />}
        {dramaSelection.length > 0 && <ContentRow title="Editor's Selection" dramas={dramaSelection} showRank />}
        {highQuality.length > 0 && <ContentRow title="High-quality Dramas" dramas={highQuality} />}
        {hotDrama.length > 0 && <ContentRow title="🔥 Hot Dramas" dramas={hotDrama} />}
        {sweetRomance.length > 0 && <ContentRow title="Sweet Romance" dramas={sweetRomance} titleColor="hsl(30, 100%, 50%)" />}
        <AppBanner />
        {ancientCostume.length > 0 && <ContentRow title="Ancient Costume" dramas={ancientCostume} titleColor="hsl(30, 100%, 50%)" />}
        {displayAll.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <span className="text-4xl mb-4">🎬</span>
            <p className="text-sm font-medium">No content yet</p>
            <p className="text-xs mt-1">Admin can upload movies and series from the dashboard</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
