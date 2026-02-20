import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Drama } from "@/data/dramas";
import SubscribeModal from "@/components/SubscribeModal";

interface DramaCardProps {
  drama: Drama;
  showRank?: boolean;
}

const DramaCard = ({ drama, showRank }: DramaCardProps) => {
  const navigate = useNavigate();
  const [showSubscribe, setShowSubscribe] = useState(false);

  // Check if agent content still within 5 days
  const isStillAgent = (() => {
    if (!drama.isAgent) return false;
    const markedAt = drama.agentMarkedAt ? new Date(drama.agentMarkedAt) : null;
    if (!markedAt) return false;
    return Math.floor((Date.now() - markedAt.getTime()) / (1000 * 60 * 60 * 24)) < 5;
  })();

  const handleClick = () => {
    if (isStillAgent) {
      // Show agent subscribe modal
      setShowSubscribe(true);
      return;
    }

    if (drama.firebaseId) {
      navigate(`/watch/${drama.firebaseId}`, {
        state: {
          firebaseId: drama.firebaseId,
          title: drama.title,
          image: drama.image,
          streamLink: drama.streamLink,
          downloadLink: drama.downloadLink,
          episodes: drama.episodes,
          genre: drama.genre,
          rating: drama.rating,
          description: drama.description,
          actors: drama.actors,
          isVip: drama.isVip,
          isHotDrama: drama.isHotDrama,
          isOriginal: drama.isOriginal,
          isAgent: drama.isAgent,
          agentMarkedAt: drama.agentMarkedAt,
        }
      });
    } else {
      navigate(`/watch/${drama.id}`);
    }
  };

  return (
    <>
      <div
        className="flex-shrink-0 w-[120px] md:w-[145px] group cursor-pointer"
        onClick={handleClick}
      >
        <div className="relative rounded-md overflow-hidden mb-1.5 aspect-[2/3]">
          <img
            src={drama.image}
            alt={drama.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Display order number */}
          {drama.displayOrder != null && drama.displayOrder > 0 && (
            <div className="absolute top-0 left-0">
              <div className="bg-primary/90 text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-br-lg min-w-[22px] text-center">
                {drama.displayOrder}
              </div>
            </div>
          )}
          {isStillAgent && (
            <div className="absolute top-1.5 right-1.5 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
              🔥 Agent Only
            </div>
          )}
          {!isStillAgent && drama.badge && (
            <div className="absolute top-1.5 right-1.5 bg-badge-coming text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
              {drama.badge}
            </div>
          )}
          {drama.episodes && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-4">
              <p className="text-foreground text-[9px] font-medium">{drama.episodes}</p>
            </div>
          )}
          {showRank && drama.rank && (
            <div className="absolute top-1.5 right-1.5">
              <span
                className="font-black text-lg italic leading-none"
                style={{
                  background: `linear-gradient(180deg, hsl(var(--top-gold)), hsl(var(--accent)))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                TOP {drama.rank}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
        </div>
        <h3 className="text-foreground text-[11px] font-medium line-clamp-1">{drama.title}</h3>
      </div>
      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} mode="agent" />
    </>
  );
};

export default DramaCard;
