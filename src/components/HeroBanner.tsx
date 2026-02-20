import { Play, Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { subscribeCarousels } from "@/lib/firebaseServices";
import type { CarouselItem } from "@/data/adminData";
import heroBanner from "@/assets/hero-banner.jpg";

// Static fallback slide shown when no Firebase carousels are active
const fallbackSlide = {
  image: heroBanner,
  title: "Welcome to\nLUO FILM",
  badges: ["VIP", "Exclusive"],
  genre: "Drama",
  rating: "9.0",
  year: "2026",
  age: "13+",
  status: "Now Streaming",
  tags: ["Movies", "Series", "Live Sport"],
  desc: "Stream the best movies, series and live sports on LUO FILM – your ultimate entertainment platform.",
};

const HeroBanner = () => {
  const [carousels, setCarousels] = useState<CarouselItem[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    return subscribeCarousels((items) => {
      setCarousels(items.filter(c => c.isActive));
    });
  }, []);

  const slides = carousels.length > 0
    ? carousels.map(c => ({
        image: c.imageUrl || heroBanner,
        title: c.title,
        badges: [c.hotWord].filter(Boolean),
        genre: "",
        rating: "",
        year: "",
        age: "",
        status: c.subtitle,
        tags: [],
        desc: c.subtitle,
      }))
    : [fallbackSlide];

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current] || fallbackSlide;

  return (
    <div className="relative w-full aspect-[16/7] overflow-hidden bg-black">
      {slides.map((s, i) => (
        <img
          key={i}
          src={s.image}
          alt={s.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
          onError={(e) => { (e.target as HTMLImageElement).src = heroBanner; }}
        />
      ))}

      <div className="absolute bottom-6 left-4 md:left-10 z-10">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2 rounded-full font-semibold text-xs hover:opacity-90 transition-opacity shadow-lg">
            <Play className="w-3.5 h-3.5 fill-current" /> Play
          </button>
          <button className="flex items-center justify-center w-8 h-8 rounded-full border border-muted-foreground/40 text-foreground hover:border-foreground transition-colors bg-black/30 backdrop-blur-sm">
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
