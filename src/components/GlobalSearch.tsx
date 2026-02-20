import { useState, useEffect, useRef } from "react";
import { Search, X, Film, Tv, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { subscribeMovies, subscribeSeries, subscribeTVChannels } from "@/lib/firebaseServices";
import type { MovieItem, SeriesItem, TVChannelItem } from "@/data/adminData";

interface SearchResult {
  id: string;
  title: string;
  type: "movie" | "series" | "tv";
  image?: string;
  genre?: string;
}

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [tvChannels, setTvChannels] = useState<TVChannelItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubs = [
      subscribeMovies(setMovies),
      subscribeSeries(setSeries),
      subscribeTVChannels(setTvChannels),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results: SearchResult[] = (() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const movieResults: SearchResult[] = movies
      .filter(m => m.name.toLowerCase().includes(q) || m.genre?.toLowerCase().includes(q))
      .map(m => ({ id: m.id, title: m.name, type: "movie", image: m.posterUrl, genre: m.genre }));
    const seriesResults: SearchResult[] = series
      .filter(s => s.name.toLowerCase().includes(q) || s.genre?.toLowerCase().includes(q))
      .map(s => ({ id: s.id, title: s.name, type: "series", image: s.posterUrl, genre: s.genre }));
    const tvResults: SearchResult[] = tvChannels
      .filter(t => t.name.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q))
      .map(t => ({ id: t.id, title: t.name, type: "tv", image: t.logoUrl, genre: t.category }));
    return [...movieResults, ...seriesResults, ...tvResults].slice(0, 8);
  })();

  const handleSelect = (r: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (r.type === "movie") {
      navigate(`/watch/${r.id}`, { state: { firebaseId: r.id, title: r.title, image: r.image } });
    } else if (r.type === "series") {
      const s = series.find(s => s.id === r.id);
      navigate(`/watch/${r.id}`, {
        state: {
          firebaseId: r.id, title: r.title, image: r.image,
          episodes: s ? `${s.totalEpisodes || 0} Episodes` : "Episodes",
          genre: s?.genre, rating: s?.rating, description: s?.description,
          actors: s?.actors, isVip: s?.isVip,
        }
      });
    } else {
      navigate("/tv-channel", { state: { channelId: r.id } });
    }
  };

  const TypeIcon = ({ type }: { type: string }) => {
    if (type === "movie") return <Film className="w-3 h-3 text-primary" />;
    if (type === "series") return <Tv className="w-3 h-3 text-accent" />;
    return <Radio className="w-3 h-3 text-muted-foreground" />;
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary border border-border hover:bg-secondary/80 transition-colors">
        <Search className="w-3 h-3 text-muted-foreground" />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={() => { setOpen(false); setQuery(""); }} />

      {/* Search panel */}
      <div className="fixed top-0 left-0 right-0 z-[61] bg-background border-b border-border shadow-lg">
        <div className="flex items-center gap-2 px-4 h-12">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search movies, series, channels..."
            className="flex-1 bg-transparent text-foreground text-xs placeholder:text-muted-foreground outline-none"
          />
          <button onClick={() => { setOpen(false); setQuery(""); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {query.trim() && (
          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
            {results.length > 0 ? (
              <div className="py-1">
                {results.map(r => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-secondary/60 transition-colors text-left"
                  >
                    {r.image ? (
                      <img src={r.image} alt={r.title} className="w-8 h-10 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-10 rounded bg-secondary flex items-center justify-center shrink-0">
                        <TypeIcon type={r.type} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-[11px] font-medium truncate">{r.title}</p>
                      <div className="flex items-center gap-1.5">
                        <TypeIcon type={r.type} />
                        <span className="text-muted-foreground text-[9px] capitalize">{r.type === "tv" ? "TV Channel" : r.type}</span>
                        {r.genre && <span className="text-muted-foreground text-[9px]">· {r.genre}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-muted-foreground text-xs">No results for "{query}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default GlobalSearch;
