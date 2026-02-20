import { useState } from "react";
import { genreTags } from "@/data/dramas";

const GenreTags = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="px-4 md:px-12 mb-4">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {genreTags.map((tag, i) => (
          <button
            key={tag}
            onClick={() => setActive(i)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium transition-colors ${
              i === active
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
