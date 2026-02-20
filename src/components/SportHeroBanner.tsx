import { Play, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeCarousels } from "@/lib/firebaseServices";
import type { CarouselItem } from "@/data/adminData";

interface SportCarouselItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkId: string;
  hotWord: string;
}

const SportHeroBanner = () => {
  const navigate = useNavigate();
  const [carousels, setCarousels] = useState<SportCarouselItem[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    return subscribeCarousels((items) => {
      const sportItems = items
        .filter(c => c.isActive && c.linkType === "live-match")
        .map(c => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          imageUrl: c.imageUrl,
          linkId: c.linkId,
          hotWord: c.hotWord,
        }));
      setCarousels(sportItems);
    });
  }, []);

  const next = useCallback(() => {
    if (carousels.length > 0) setCurrent(c => (c + 1) % carousels.length);
  }, [carousels.length]);

  useEffect(() => {
    if (carousels.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, carousels.length]);

  if (carousels.length === 0) {
    // Fallback hero
    return (
      <div className="relative w-full aspect-[16/6] bg-gradient-to-r from-primary/20 via-card to-card overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-foreground text-2xl md:text-3xl font-black mb-2">⚽ Live Sport</h1>
          <p className="text-muted-foreground text-xs md:text-sm mb-4 max-w-md">
            Watch live football matches, highlights and more. All in one place.
          </p>
          <button
            onClick={() => navigate("/watch/sport-live")}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <Play className="w-4 h-4 fill-current" /> Open Live Player
          </button>
        </div>
      </div>
    );
  }

  const slide = carousels[current];

  return (
    <div className="relative w-full aspect-[16/6] overflow-hidden bg-black">
      {carousels.map((s, i) => (
        <img
          key={s.id}
          src={s.imageUrl}
          alt={s.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      <div className="absolute bottom-6 left-4 md:left-8 max-w-md z-10">
        {slide.hotWord && (
          <span className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded mb-2 inline-block">
            {slide.hotWord}
          </span>
        )}
        <h2 className="text-foreground text-xl md:text-2xl font-black mb-1">{slide.title}</h2>
        <p className="text-muted-foreground text-[11px] mb-3">{slide.subtitle}</p>
        <button
          onClick={() => navigate(`/watch/sport-${slide.linkId}`)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2 rounded-full font-semibold text-xs hover:opacity-90 transition-opacity"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Watch Now
        </button>
      </div>

      {carousels.length > 1 && (
        <div className="absolute bottom-3 right-4 md:right-8 flex gap-1.5">
          {carousels.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-foreground" : "bg-muted-foreground/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SportHeroBanner;
