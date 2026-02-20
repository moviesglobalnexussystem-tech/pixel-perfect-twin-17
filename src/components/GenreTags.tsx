import { genreTags } from "@/data/dramas";

interface GenreTagsProps {
  activeGenre?: string;
  onGenreChange?: (genre: string) => void;
}

const GenreTags = ({ activeGenre = "All Videos", onGenreChange }: GenreTagsProps) => {
  return (
    <section className="px-4 md:px-12 mb-4">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {genreTags.map((tag) => (
          <button
            key={tag}
            onClick={() => onGenreChange?.(tag)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium transition-colors ${
              activeGenre === tag
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </section>
  );
};

export default GenreTags;
