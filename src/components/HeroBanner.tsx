import { Play, Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { subscribeCarousels } from "@/lib/firebaseServices";
import type { CarouselItem } from "@/data/adminData";
import LogoLoader from "@/components/LogoLoader";

interface HeroBannerProps {
  page?: "home" | "series" | "movies";
  compact?: boolean;
}

const HeroBanner = ({ page = "home", compact = false }: HeroBannerProps) => {
  const [carousels, setCarousels] = useState<CarouselItem[] | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    return subscribeCarousels((items) => {
      setCarousels(items.filter(c => c.isActive && (!c.page || c.page === page)));
    });
  }, [page]);

  const slides = carousels && carousels.length > 0
    ? carousels.map(c => ({
        image: c.imageUrl,
        title: c.title,
        badges: [c.hotWord].filter(Boolean),
        status: c.subtitle,
        desc: c.subtitle,
      }))
    : [];

  const next = useCallback(() => {
    if (slides.length > 0) setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  // Loading state
  if (carousels === null) {
    return (
      <div className={`relative w-full ${compact ? "aspect-[16/5] md:aspect-[16/4]" : "aspect-[16/7] md:aspect-[16/5] lg:aspect-[16/4.5]"} bg-card rounded-b-lg flex items-center justify-center`}>
        <LogoLoader text="Loading banner..." />
      </div>
    );
  }

  // No carousels from Firebase
  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <div className={`relative w-full ${compact ? "aspect-[16/5] md:aspect-[16/4]" : "aspect-[16/7] md:aspect-[16/5] lg:aspect-[16/4.5]"} overflow-hidden bg-card`}>
      {slides.map((s, i) => (
        <img
          key={i}
          src={s.image}
          alt={s.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
        />
      ))}

      <div className="absolute bottom-6 left-4 md:left-10 z-10">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2 rounded-full font-semibold text-xs hover:opacity-90 transition-opacity shadow-lg">
            <Play className="w-3.5 h-3.5 fill-current" /> Play
          </button>
          <button className="flex items-center justify-center w-8 h-8 rounded-full border border-muted-foreground/40 text-foreground hover:border-foreground transition-colors bg-card/30 backdrop-blur-sm">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 right-4 md:right-10 flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-foreground" : "bg-muted-foreground/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
