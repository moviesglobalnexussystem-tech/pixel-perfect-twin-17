import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Drama } from "@/data/dramas";
import SubscribeModal from "@/components/SubscribeModal";
import { getContentDateBadge } from "@/lib/contentDate";

interface DramaCardProps {
  drama: Drama;
  showRank?: boolean;
}

const DramaCard = ({ drama, showRank }: DramaCardProps) => {
  const navigate = useNavigate();
  const [showSubscribe, setShowSubscribe] = useState(false);
  const rankNumber = drama.rank;

  const isStillAgent = (() => {
    if (!drama.isAgent) return false;
    const markedAt = drama.agentMarkedAt ? new Date(drama.agentMarkedAt) : null;
    if (!markedAt) return false;
    return Math.floor((Date.now() - markedAt.getTime()) / (1000 * 60 * 60 * 24)) < 5;
  })();

  // Date badge for newly uploaded content (within 1 week)
  const dateBadge = getContentDateBadge((drama as any).createdAt);

  const handleClick = () => {
    if (isStillAgent) {
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
        className={`flex-shrink-0 group cursor-pointer ${showRank && rankNumber ? "flex items-center w-[160px] md:w-[195px]" : "w-[120px] md:w-[145px]"}`}
        onClick={handleClick}
      >
        {showRank && rankNumber && (
          <div className="relative flex-shrink-0 w-[45px] md:w-[55px] flex items-center justify-center -mr-3 z-10">
            <span
              className="font-black italic leading-none select-none"
              style={{
                fontSize: "clamp(70px, 10vw, 100px)",
                color: "#9b59b6",
                WebkitTextStroke: "2px hsl(var(--primary))",
                filter: "drop-shadow(0 0 12px hsl(var(--primary) / 0.5))",
              }}
            >
              {rankNumber}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="relative rounded-md overflow-hidden mb-1.5 aspect-[2/3]">
            <img
              src={drama.image}
              alt={drama.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {/* Display order badge */}
            {drama.displayOrder != null && drama.displayOrder > 0 && !showRank && (
              <div className="absolute top-0 left-0">
                <div className="bg-primary/90 text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-br-lg min-w-[22px] text-center">
                  {drama.displayOrder}
                </div>
              </div>
            )}
            {/* Agent Only badge */}
            {isStillAgent && (
              <div className="absolute top-1.5 right-1.5 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                🔥 Agent Only
              </div>
            )}
            {/* Date badge (today / yesterday / X days ago) - top left if no rank badge */}
            {!isStillAgent && dateBadge && (
              <div className="absolute top-1.5 left-1.5 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                {dateBadge}
              </div>
            )}
            {/* Coming soon badge */}
            {!isStillAgent && !dateBadge && drama.badge && (
              <div className="absolute top-1.5 right-1.5 bg-accent/90 text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                {drama.badge}
              </div>
            )}
            {drama.episodes && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-4">
                <p className="text-white text-[9px] font-medium">{drama.episodes}</p>
              </div>
            )}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
          </div>
          <h3 className="text-foreground text-[11px] font-medium line-clamp-1">{drama.title}</h3>
        </div>
      </div>
      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} mode="agent" />
    </>
  );
};

export default DramaCard;
